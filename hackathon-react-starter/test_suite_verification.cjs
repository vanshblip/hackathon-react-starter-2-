// test_suite_verification.cjs
const { analyzeComplexity } = require('./server/complexityAnalyzer');
const { inspectStaticBugs, verifyBugsWithProbes } = require('./server/bugDetector');
const path = require('path');
const cp = require('child_process');

function runIsolatedProcess(userCode, functionName, inputArgs, timeoutMs = 800) {
  return new Promise((resolve) => {
    const runnerPath = path.join(__dirname, 'server', 'runner.js');
    const child = cp.spawn('node', ['--max-old-space-size=64', runnerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdoutData = '';
    let stderrData = '';
    let hasFinished = false;

    const killTimer = setTimeout(() => {
      if (!hasFinished) {
        hasFinished = true;
        try { child.kill('SIGKILL'); } catch (e) {}
        resolve({ success: false, error: 'Timed out', executionTimeMs: timeoutMs });
      }
    }, timeoutMs + 300);

    child.stdout.on('data', chunk => stdoutData += chunk);
    child.stderr.on('data', chunk => stderrData += chunk);
    child.on('close', () => {
      if (hasFinished) return;
      hasFinished = true;
      clearTimeout(killTimer);
      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.result === '__UNDEFINED__') parsed.result = undefined;
        resolve(parsed);
      } catch (e) {
        resolve({ success: false, error: stderrData || e.message });
      }
    });

    child.stdin.write(JSON.stringify({ userCode, functionName, inputArgs, timeoutMs }));
    child.stdin.end();
  });
}

async function runAllTests() {
  console.log("=== CODELENS VERIFICATION TESTS ===\n");

  // A. One loop over n elements -> O(n)
  const cA = analyzeComplexity(`
    function singleLoop(arr) {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
      }
      return sum;
    }
  `, 'singleLoop', ['arr']);
  console.log('Test A (Single Loop):', cA.time, '| Expected: O(n)');
  if (cA.time !== 'O(n)') throw new Error(`Test A failed: got ${cA.time}`);

  // B. Two sequential loops over n elements -> O(n)
  const cB = analyzeComplexity(`
    function sequentialLoops(arr) {
      let maxVal = arr[0];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] > maxVal) maxVal = arr[i];
      }
      let minVal = arr[0];
      for (let j = 0; j < arr.length; j++) {
        if (arr[j] < minVal) minVal = arr[j];
      }
      return maxVal - minVal;
    }
  `, 'sequentialLoops', ['arr']);
  console.log('Test B (Two Sequential Loops):', cB.time, '| Expected: O(n)');
  if (cB.time !== 'O(n)') throw new Error(`Test B failed: got ${cB.time}`);

  // C. Nested loops over n elements -> O(n²)
  const cC = analyzeComplexity(`
    function nestedLoops(arr) {
      let count = 0;
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          count++;
        }
      }
      return count;
    }
  `, 'nestedLoops', ['arr']);
  console.log('Test C (Nested Loops):', cC.time, '| Expected: O(n²)');
  if (cC.time !== 'O(n²)') throw new Error(`Test C failed: got ${cC.time}`);

  // D. Binary search halving -> O(log n)
  const cD = analyzeComplexity(`
    function binarySearch(arr, target) {
      let lo = 0, hi = arr.length - 1;
      while (lo <= hi) {
        let mid = Math.floor((lo + hi) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      return -1;
    }
  `, 'binarySearch', ['arr', 'target']);
  console.log('Test D (Binary Search Halving):', cD.time, '| Expected: O(log n)');
  if (cD.time !== 'O(log n)') throw new Error(`Test D failed: got ${cD.time}`);

  // E. Second-largest function tests
  console.log("\nTest E: Second-Largest Distinct Element Bug Detection & Probe Testing...");
  const buggySecondCode = `
    function findSecondLargest(nums) {
      let first = 0, second = 0;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] > first) {
          second = first;
          first = nums[i];
        } else if (nums[i] > second) {
          second = nums[i];
        }
      }
      return second;
    }
  `;

  const bugsEStatic = inspectStaticBugs(buggySecondCode, 'findSecondLargest');
  const bugsE = await verifyBugsWithProbes(buggySecondCode, 'findSecondLargest', bugsEStatic, runIsolatedProcess);

  console.log(`   Found ${bugsE.length} findings:`);
  bugsE.forEach((b, i) => {
    console.log(`   ${i+1}. [${b.severity}] ${b.title}`);
    console.log(`      Expression: "${b.expression}"`);
    console.log(`      Input: ${b.concreteInput} | Confirmed: ${b.isConfirmed}`);
    if (b.actualOutput !== undefined) {
      console.log(`      Actual: ${JSON.stringify(b.actualOutput)} vs Expected: ${JSON.stringify(b.expectedOutput)}`);
    }
  });

  // Verify second-largest against the 5 specific inputs
  const inputsE = [
    { name: 'empty input []', input: [[]], expected: null },
    { name: 'all values equal [5, 5, 5]', input: [[5, 5, 5]], expected: null },
    { name: 'single element [2]', input: [[2]], expected: null },
    { name: 'negative values [-8, -3, -1, -6]', input: [[-8, -3, -1, -6]], expected: -3 },
    { name: 'standard sample [3, 1, 2]', input: [[3, 1, 2]], expected: 2 },
  ];

  for (const tc of inputsE) {
    const res = await runIsolatedProcess(buggySecondCode, 'findSecondLargest', tc.input);
    const pass = JSON.stringify(res.result) === JSON.stringify(tc.expected);
    console.log(`   Input ${tc.name}: result = ${JSON.stringify(res.result)}, expected = ${JSON.stringify(tc.expected)} -> ${pass ? 'PASS' : 'FAIL (Caught bug)'}`);
  }

  // F. Test a different function with an obvious incorrect operation
  console.log("\nTest F: Reusable Bug Detection on Different Function (calculateAverage)...");
  const buggyDiffCode = `
    function calculateAverage(a, b) {
      if (a = b) {
        return a;
      }
      return a - b;
    }
  `;
  const bugsF = inspectStaticBugs(buggyDiffCode, 'calculateAverage');
  console.log(`   Found ${bugsF.length} findings in calculateAverage:`);
  bugsF.forEach((b, i) => {
    console.log(`   ${i+1}. [${b.severity}] ${b.title} on line ${b.line} ("${b.expression}")`);
  });
  if (bugsF.length < 2) throw new Error("Case F failed to detect assignment in condition and operator mismatch!");

  // G. Test live HTTP analysis endpoint with multiline indented code (Check G)
  console.log("\nTest G: Live HTTP /api/code/analyze with Multiline Indented Code...");
  const http = require('http');
  const postData = JSON.stringify({
    code: `function findSecondLargest(nums) {\n  let first = 0, second = 0;\n  for (let i = 0; i < nums.length; i++) {\n    if (nums[i] > first) {\n      second = first;\n      first = nums[i];\n    } else if (nums[i] > second) {\n      second = nums[i];\n    }\n  }\n  return second;\n}`
  });

  const apiRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/code/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  console.log(`   API Inferred Title: "${apiRes.inferredTitle}"`);
  console.log(`   API Time Complexity: ${apiRes.complexity?.time} (${apiRes.complexity?.explanation})`);
  console.log(`   API Aux Space Complexity: ${apiRes.complexity?.space}`);
  console.log(`   API Potential Bugs Count: ${apiRes.potentialBugs?.length}`);
  const confirmedBugs = apiRes.potentialBugs?.filter(b => b.isConfirmed);
  console.log(`   API Confirmed Bug Count via Probes: ${confirmedBugs?.length}`);
  confirmedBugs?.forEach(b => console.log(`      * Confirmed: ${b.title} -> input ${b.concreteInput} produced ${JSON.stringify(b.actualOutput)} (expected ${JSON.stringify(b.expectedOutput)})`));

  if (!apiRes.success || apiRes.complexity?.time !== 'O(n)' || !apiRes.potentialBugs?.length) {
    throw new Error("Check G failed: live API analysis did not return expected result!");
  }

  console.log("\n=== ALL UNIT & ACCEPTANCE TESTS (A through G) PASSED SUCCESSFULLY! ===");
}

runAllTests().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
