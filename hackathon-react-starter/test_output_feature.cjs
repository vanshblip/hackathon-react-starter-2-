// test_output_feature.cjs
const http = require('http');

function postCodeRun(code, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ code, timeoutMs });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/code/run',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyAllFlows() {
  console.log("=================================================");
  console.log("  CODELENS RUN CODE & OUTPUT CONSOLE TEST SUITE  ");
  console.log("=================================================\n");

  let allPassed = true;

  // Flow 1: console.log("Hello CodeLens")
  console.log("Test 1: Single console.log(\"Hello CodeLens\")...");
  const r1 = await postCodeRun('console.log("Hello CodeLens");');
  const p1 = r1.status === 200 && r1.data.success && r1.data.logs.includes("Hello CodeLens");
  if (!p1) allPassed = false;
  console.log(`  Actual Success: ${r1.data.success}, Logs: ${JSON.stringify(r1.data.logs)}, Error: ${r1.data.error}`);
  console.log(`  Status: ${p1 ? 'PASSED' : 'FAILED'}\n`);

  // Flow 2: console.log(2 + 3)
  console.log("Test 2: Arithmetic console.log(2 + 3)...");
  const r2 = await postCodeRun('console.log(2 + 3);');
  const p2 = r2.status === 200 && r2.data.success && r2.data.logs.includes("5");
  if (!p2) allPassed = false;
  console.log(`  Actual Success: ${r2.data.success}, Logs: ${JSON.stringify(r2.data.logs)}, Error: ${r2.data.error}`);
  console.log(`  Status: ${p2 ? 'PASSED' : 'FAILED'}\n`);

  // Flow 3: Multiple console.log statements
  console.log("Test 3: Multiple console.log() statements...");
  const multiCode = `
console.log("Initializing algorithm...");
let sum = 0;
for (let i = 1; i <= 3; i++) {
  sum += i;
  console.log("Iteration " + i + ", current sum: " + sum);
}
console.log("Final sum: " + sum);
  `;
  const r3 = await postCodeRun(multiCode);
  const p3 = r3.status === 200 && r3.data.success && r3.data.logs.length === 5 && r3.data.logs[4] === "Final sum: 6";
  if (!p3) allPassed = false;
  console.log(`  Actual Success: ${r3.data.success}, Total Log Lines: ${r3.data.logs.length}`);
  r3.data.logs.forEach((line, idx) => console.log(`    [Line ${idx + 1}] ${line}`));
  console.log(`  Status: ${p3 ? 'PASSED' : 'FAILED'}\n`);

  // Flow 4: Deliberate syntax error
  console.log("Test 4: Deliberate Syntax Error...");
  const syntaxErrCode = 'function broken( { console.log("Missing parenthesis");';
  const r4 = await postCodeRun(syntaxErrCode);
  const p4 = r4.status === 200 && r4.data.success === false && Boolean(r4.data.error);
  if (!p4) allPassed = false;
  console.log(`  Actual Success: ${r4.data.success}, Caught Error: "${r4.data.error}"`);
  console.log(`  Status: ${p4 ? 'PASSED' : 'FAILED'}\n`);

  // Flow 5: Deliberate runtime error
  console.log("Test 5: Deliberate Runtime Error...");
  const runtimeErrCode = 'let obj = null;\nconsole.log("About to fail...");\nobj.nonExistentMethod();';
  const r5 = await postCodeRun(runtimeErrCode);
  const p5 = r5.status === 200 && r5.data.success === false && Boolean(r5.data.error) && r5.data.logs.includes("About to fail...");
  if (!p5) allPassed = false;
  console.log(`  Actual Success: ${r5.data.success}, Logs Before Crash: ${JSON.stringify(r5.data.logs)}, Caught Error: "${r5.data.error}"`);
  console.log(`  Status: ${p5 ? 'PASSED' : 'FAILED'}\n`);

  // Flow 6: Execution Timeout
  console.log("Test 6: Execution Timeout Protection (Infinite Loop)...");
  const r6 = await postCodeRun('while (true) {}', 400);
  const p6 = r6.status === 200 && r6.data.success === false && r6.data.error.includes("timed out");
  if (!p6) allPassed = false;
  console.log(`  Actual Success: ${r6.data.success}, Caught Error: "${r6.data.error}"`);
  console.log(`  Status: ${p6 ? 'PASSED' : 'FAILED'}\n`);

  // Flow 7: Empty code handling
  console.log("Test 7: Empty Code Graceful Handling...");
  const r7 = await postCodeRun('');
  const p7 = r7.status === 400 && r7.data.success === false;
  if (!p7) allPassed = false;
  console.log(`  Status Code: ${r7.status}, Message: "${r7.data.message}"`);
  console.log(`  Status: ${p7 ? 'PASSED' : 'FAILED'}\n`);

  if (!allPassed) {
    console.error("FAILURES DETECTED IN TEST FLOWS!");
    process.exit(1);
  } else {
    console.log("=================================================");
    console.log("  ALL 7 REQUIRED FLOWS PASSED WITH 0 FAILURES!   ");
    console.log("=================================================\n");
  }
}

verifyAllFlows().catch(e => {
  console.error("Runner error:", e);
  process.exit(1);
});
