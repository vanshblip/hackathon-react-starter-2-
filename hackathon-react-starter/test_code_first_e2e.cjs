// test_code_first_e2e.cjs
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resBody));
        } catch (e) {
          resolve({ raw: resBody, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: path,
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resBody));
        } catch (e) {
          resolve({ raw: resBody, statusCode: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

async function runAcceptanceTests() {
  console.log("=== CODE-FIRST ACCEPTANCE CRITERIA VERIFICATION ===\n");

  // Acceptance Test 2: Add Two Numbers Code-First Analysis
  console.log("1. Testing 'Add Two Numbers' Code-First Analysis...");
  const addAnalysis = await post('/api/code/analyze', {
    code: `function addTwoNumbers(a, b) {\n  return a + b;\n}`
  });
  console.log(`   Inferred Title: "${addAnalysis.inferredTitle}"`);
  console.log(`   Time Complexity: ${addAnalysis.complexity?.time}`);
  console.log(`   Explanation: ${addAnalysis.explanation?.overview}`);
  console.log(`   Suggested Test Cases: ${addAnalysis.suggestedTestCases?.length}`);
  if (addAnalysis.inferredTitle !== "Add Two Numbers") throw new Error("Add Two Numbers inference failed!");

  // Acceptance Test 3: Reverse an Array Inferred Explanation & Test Suggestions
  console.log("\n2. Testing 'Reverse an Array' Inferred Explanation & Test Suggestions...");
  const revAnalysis = await post('/api/code/analyze', {
    code: `function reverseArray(nums) {\n  return nums && Array.isArray(nums) ? [...nums].reverse() : [];\n}`
  });
  console.log(`   Inferred Title: "${revAnalysis.inferredTitle}"`);
  console.log(`   Time Complexity: ${revAnalysis.complexity?.time}`);
  console.log(`   Edge Cases Count: ${revAnalysis.edgeCases?.length}`);
  console.log(`   Suggested Tests: ${revAnalysis.suggestedTestCases?.map(t => t.name).join(', ')}`);
  if (!revAnalysis.inferredTitle.includes("Reverse")) throw new Error("Reverse array inference failed!");

  // Acceptance Test 4: Deliberately Incorrect Function
  console.log("\n3. Testing Deliberately Incorrect Function Bug Detection...");
  const bugAnalysis = await post('/api/code/analyze', {
    code: `function addTwoNumbers(a, b) {\n  return a - b; // Deliberate bug\n}`
  });
  console.log(`   Potential Bugs Found: ${bugAnalysis.potentialBugs?.length}`);
  console.log(`   Bug Title: "${bugAnalysis.potentialBugs[0]?.title}"`);
  console.log(`   Bug Severity: ${bugAnalysis.potentialBugs[0]?.severity}`);
  if (!bugAnalysis.potentialBugs || bugAnalysis.potentialBugs.length === 0) throw new Error("Bug was not caught by analyzer!");

  // Acceptance Test 5: Running tests without a predefined problem (both with and without expected output)
  console.log("\n4. Testing Execution Without Predefined Problem...");
  const testExecution = await post('/api/solve/run', {
    code: `function addTwoNumbers(a, b) { return a + b; }`,
    testCases: [
      { id: 1, name: 'Normal Positive', input: [5, 7], expected: 12 },
      { id: 2, name: 'Ad-hoc without expected', input: [100, 200] }, // No expected output!
      { id: 3, name: 'Zero Identity', input: [0, 42], expected: 42 }
    ]
  });
  console.log(`   Total Tests: ${testExecution.total}`);
  console.log(`   Evaluated Tests (with expected): ${testExecution.evaluated}`);
  console.log(`   Executed-Only Tests (without expected): ${testExecution.executedOnly}`);
  console.log(`   Passed Count: ${testExecution.passed}`);
  console.log(`   Test #2 (no expected) Status: "${testExecution.tests[1].status}", Actual: ${testExecution.tests[1].actual}, Passed: ${testExecution.tests[1].passed}`);
  if (testExecution.tests[1].status !== 'EXECUTED' || testExecution.tests[1].passed !== null) {
    throw new Error("Test without expected output was falsely marked passed or failed!");
  }

  // Acceptance Test 5b: Counterexample Arena with Deliberate Bug
  console.log("\n5. Testing Counterexample Arena Discrepancy Discovery...");
  const arenaChallenge = await post('/api/solve/challenge', {
    studentCode: `function addTwoNumbers(a, b) { return a - b; }`,
    alternativeCode: `function addTwoNumbers(a, b) { return a + b; }`,
    testCases: [
      { id: 1, name: 'Positive Pair', input: [5, 7], expected: 12 }
    ]
  });
  console.log(`   Counterexample Detected: ${arenaChallenge.hasCounterexample}`);
  console.log(`   Student Output: ${arenaChallenge.counterexample?.studentOutput}, Expected: ${arenaChallenge.counterexample?.expected}`);
  console.log(`   Arena Disclaimer: "${arenaChallenge.disclaimer?.slice(0, 50)}..."`);
  if (!arenaChallenge.hasCounterexample) throw new Error("Counterexample was not caught in Arena!");

  // Acceptance Test 7: SQLite Attempt Persistence & Retrieval
  console.log("\n6. Testing SQLite Persistence & Retrieval for Code-First Attempt...");
  const saveRes = await post('/api/attempts', {
    problemId: 'code-analysis',
    problemTitle: addAnalysis.inferredTitle,
    language: 'javascript',
    studentCode: `function addTwoNumbers(a, b) { return a + b; }`,
    passedCount: 3,
    totalCount: 3,
    verdict: 'ALL_PASSED',
    timeTakenMs: 12
  });
  console.log(`   Attempt Saved: ID=${saveRes.attempt?.id}, Title="${saveRes.attempt?.problem_title}"`);

  const listRes = await get('/api/attempts');
  console.log(`   Attempts in DB: ${listRes.count}, Latest Title: "${listRes.attempts[0]?.problem_title}"`);

  // Acceptance Test 8: Predefined Labs & Examples Intact
  console.log("\n7. Testing Predefined Problems Availability...");
  const problemsRes = await get('/api/problems');
  console.log(`   Available problems count: ${problemsRes.count}`);
  const hasFindMax = problemsRes.problems.some(p => p.id === 'find-max');
  const hasReverse = problemsRes.problems.some(p => p.id === 'quick-reverse-array');
  console.log(`   Predefined 'find-max' intact: ${hasFindMax}, Quick-start 'reverse' intact: ${hasReverse}`);

  console.log("\n=== ALL CODE-FIRST ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===");
}

runAcceptanceTests().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
