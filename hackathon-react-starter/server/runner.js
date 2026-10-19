/**
 * CodeLens Out-of-Process Isolated Runner
 * Executes student and alternative code in an isolated child process,
 * preventing arbitrary user code from running in the main Express server process.
 */

const vm = require("vm");

let inputBuffer = "";

process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  inputBuffer += chunk;
});

process.stdin.on("end", () => {
  if (!inputBuffer.trim()) {
    process.stdout.write(JSON.stringify({ success: false, error: "Empty runner payload." }));
    process.exit(0);
  }

  let payload;
  try {
    payload = JSON.parse(inputBuffer);
  } catch (err) {
    process.stdout.write(JSON.stringify({ success: false, error: `Invalid JSON payload: ${err.message}` }));
    process.exit(0);
  }

  const { userCode, functionName, inputArgs, timeoutMs = 800 } = payload;

  const logs = [];
  const safeSandbox = {
    Math,
    Array,
    String,
    Number,
    Boolean,
    JSON,
    Map,
    Set,
    Date,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Infinity,
    NaN,
    undefined,
    console: {
      log: (...args) => {
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
      warn: (...args) => {
        logs.push("[warn] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
      error: (...args) => {
        logs.push("[error] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
      info: (...args) => {
        logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      },
    },
  };

  // Block dangerous primitives
  safeSandbox.process = undefined;
  safeSandbox.require = undefined;
  safeSandbox.global = undefined;
  safeSandbox.globalThis = safeSandbox;

  const context = vm.createContext(safeSandbox);

  const inputJson = JSON.stringify(inputArgs !== undefined ? inputArgs : []);

  const isDirectScript = !functionName && (inputArgs === undefined || inputArgs === null || (Array.isArray(inputArgs) && inputArgs.length === 0));

  const startTime = process.hrtime();
  let result;
  try {
    if (isDirectScript) {
      try {
        result = vm.runInContext(userCode, context, { timeout: timeoutMs });
      } catch (directErr) {
        if (directErr && directErr.message && directErr.message.includes("Illegal return")) {
          result = vm.runInContext('(function() {\n' + userCode + '\n})()', context, { timeout: timeoutMs });
        } else {
          throw directErr;
        }
      }
    } else {
      const runnerScript = `
        "use strict";
        ${userCode}
        ;
        (function() {
          var targetFn;
          if (typeof ${functionName} === 'function') {
            targetFn = ${functionName};
          } else {
            // Fallback: try finding first global function if functionName not specified
            var foundKeys = Object.keys(this);
            for (var i = 0; i < foundKeys.length; i++) {
              if (typeof this[foundKeys[i]] === 'function') {
                targetFn = this[foundKeys[i]];
                break;
              }
            }
          }

          if (typeof targetFn !== 'function') {
            throw new Error("Target function '" + ${JSON.stringify(functionName || "function")} + "' is not defined in submitted code.");
          }

          var input = ${inputJson};
          if (Array.isArray(input)) {
            return targetFn.apply(null, input);
          } else {
            return targetFn(input);
          }
        })()
      `;
      result = vm.runInContext(runnerScript, context, { timeout: timeoutMs });
    }
  } catch (err) {
    const errorMsg = err && err.message ? err.message : String(err);
    process.stdout.write(JSON.stringify({
      success: false,
      error: errorMsg.includes("timed out") ? "Execution timed out (exceeded " + timeoutMs + "ms limit)." : errorMsg,
      logs,
      executionTimeMs: 0,
    }));
    process.exit(0);
  }

  const diff = process.hrtime(startTime);
  const executionTimeMs = parseFloat((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));

  // Serialize result cleanly, handling undefined and NaN
  let serializedResult = result;
  if (result === undefined) {
    serializedResult = "__UNDEFINED__";
  } else if (Number.isNaN(result)) {
    serializedResult = "__NAN__";
  }

  process.stdout.write(JSON.stringify({
    success: true,
    result: serializedResult,
    logs,
    executionTimeMs,
  }));
  process.exit(0);
});
