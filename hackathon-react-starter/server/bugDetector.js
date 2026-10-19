/**
 * CodeLens Evidence-Based Bug Detective Engine
 * Structural static inspection and sandboxed live execution probes.
 * Provides root-cause tracing, minimal reproducible inputs, diff previews,
 * and safe targeted fix suggestions.
 */

const { stripCommentsAndStrings } = require("./complexityAnalyzer");

/**
 * Reusable static bug inspection with fix suggestions & concept explanations
 */
function inspectStaticBugs(code, fnName) {
  const findings = [];
  const lines = (code || '').split('\n');
  const clean = stripCommentsAndStrings(code);
  const lowerCode = code.toLowerCase();
  const lowerName = (fnName || '').toLowerCase();

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // 1. Accidental assignment in conditional: if (x = y)
    const assignMatch = trimmed.match(/if\s*\(([^=!<>\n]*[^=!<>\s])\s*=\s*([^=][^)]*)\)/);
    if (assignMatch) {
      const left = assignMatch[1].trim();
      const right = assignMatch[2].trim();
      const fixedLine = line.replace(/=\s*([^=])/, '=== $1');
      const col = line.indexOf('=') + 1;

      findings.push({
        id: `bug-assignment-${lineNum}`,
        kind: 'static_warning',
        severity: 'High',
        confidence: 'High (Static Analysis)',
        title: 'Accidental Assignment in Condition',
        line: lineNum,
        column: col,
        expression: trimmed,
        whatCodeDoes: `Evaluates \`${trimmed}\` which assigns the value of \`${right}\` to \`${left}\`, then checks whether \`${right}\` is truthy.`,
        whyIncorrect: `A single \`=\` operator is assignment, not equality comparison. This unintentionally mutates \`${left}\` and branches based on the assigned value rather than comparing operands.`,
        conceptExplanation: 'In JavaScript, the single equals operator (=) is for assignment. To test for strict equality without type coercion, always use the triple equals operator (===).',
        concreteInput: 'N/A (Syntax / Control-Flow Defect)',
        rawInput: null,
        expectedOutput: 'Equality comparison boolean (true/false)',
        observedOutput: 'Variable reassignment and truthy coercion',
        chainOfCause: `1. Execution reaches \`if\` condition.\n2. \`${left} = ${right}\` assigns rather than compares.\n3. \`${left}\` is overwritten with \`${right}\`.\n4. Branch always executes if \`${right}\` is truthy, regardless of previous value.`,
        suggestedFix: {
          explanation: 'Replace the assignment operator (=) with the strict equality comparison operator (===).',
          targetLine: lineNum,
          originalSnippet: trimmed,
          replacementSnippet: fixedLine.trim(),
          diff: {
            removed: trimmed,
            added: fixedLine.trim(),
          },
          canAutoApply: true,
        },
        isConfirmed: false,
      });
    }

    // 2. Off-by-one loop boundary: i <= arr.length
    const oobMatch = trimmed.match(/for\s*\(([^;]+;\s*[a-zA-Z0-9_$]+\s*)<=\s*([a-zA-Z0-9_$]+\.length\s*;[^)]*)\)/);
    if (oobMatch) {
      const fixedLine = line.replace(/<=\s*([a-zA-Z0-9_$]+\.length)/, '< $1');
      const col = line.indexOf('<=') + 1;

      findings.push({
        id: `bug-oob-${lineNum}`,
        kind: 'static_warning',
        severity: 'High',
        confidence: 'High (Static Analysis)',
        title: 'Off-by-One Array Boundary (Out of Bounds)',
        line: lineNum,
        column: col,
        expression: trimmed,
        whatCodeDoes: `Iterates loop counter up to and including \`arr.length\`. On the final iteration, accesses index \`arr[arr.length]\`.`,
        whyIncorrect: `JavaScript arrays are zero-indexed: valid element indices range from 0 to \`arr.length - 1\`. Accessing index \`arr.length\` yields \`undefined\`, which leads to \`NaN\` arithmetic, incorrect comparisons, or \`TypeError\`.`,
        conceptExplanation: 'Zero-based indexing means an array of length N has valid indices 0, 1, ..., N-1. Loop conditions should use the strict less-than operator (i < arr.length) rather than less-than-or-equal (i <= arr.length).',
        concreteInput: '[[1, 2, 3]]',
        rawInput: [[1, 2, 3]],
        expectedOutput: 'Operate strictly on defined indices 0, 1, 2',
        observedOutput: 'Accesses undefined at index 3',
        chainOfCause: `1. Array has length 3 with valid indices [0, 1, 2].\n2. Loop continues while \`i <= 3\`.\n3. At i = 3, reads \`arr[3]\` which evaluates to \`undefined\`.\n4. Operations on undefined produce corrupt output or NaN.`,
        suggestedFix: {
          explanation: 'Change "<=" to "<" in the loop condition so traversal halts at index length - 1.',
          targetLine: lineNum,
          originalSnippet: trimmed,
          replacementSnippet: fixedLine.trim(),
          diff: {
            removed: trimmed,
            added: fixedLine.trim(),
          },
          canAutoApply: true,
        },
        isConfirmed: false,
      });
    }

    // 3. Zero initialization for maximum / extreme value trackers
    const zeroInitMatch = trimmed.match(/(?:let|var)\s+([a-zA-Z0-9_$]*(?:max|largest|second|secondLargest|second_largest|first)[a-zA-Z0-9_$]*)\s*=\s*0\b/);
    if (zeroInitMatch && !lowerCode.includes('-infinity')) {
      const fixedLine = line.replace(/\b0\b/g, '-Infinity');
      const col = line.indexOf('0') + 1;

      findings.push({
        id: `bug-zeroinit-${lineNum}`,
        kind: 'static_warning',
        severity: 'High',
        confidence: 'High (Static Analysis)',
        title: 'Zero-Initialization Failure for Negative Values',
        line: lineNum,
        column: col,
        expression: trimmed,
        whatCodeDoes: `Initializes candidate tracker variable \`${zeroInitMatch[1]}\` to numeric constant \`0\`.`,
        whyIncorrect: `If the input array contains only negative numbers (e.g. [-8, -3, -1]), every element is less than 0. The tracker will never update, and 0 will be erroneously returned as the maximum/second-largest value even though 0 was not present in the input.`,
        conceptExplanation: 'When searching for maximums or tracking upper bounds, initialize tracker variables to -Infinity (or the first element of the collection) so any valid number will compare greater.',
        concreteInput: '[[-8, -3, -1, -6]]',
        rawInput: [[-8, -3, -1, -6]],
        expectedOutput: -3,
        observedOutput: 0,
        chainOfCause: `1. Input array [-8, -3, -1, -6] contains only negative values.\n2. Tracker initialized to 0.\n3. Every element x in array has x < 0, so \`nums[i] > tracker\` is never true.\n4. Function returns initial 0 instead of true maximum from the array.`,
        suggestedFix: {
          explanation: 'Initialize extreme tracker variables to -Infinity instead of 0.',
          targetLine: lineNum,
          originalSnippet: trimmed,
          replacementSnippet: fixedLine.trim(),
          diff: {
            removed: trimmed,
            added: fixedLine.trim(),
          },
          canAutoApply: true,
        },
        isConfirmed: false,
      });
    }

    // 4. Missing check for identical elements in second-largest / ranking algorithms
    if (
      (lowerName.includes('second') || lowerCode.includes('secondlargest') || lowerCode.includes('second_largest')) &&
      !clean.includes('!==') && !clean.includes('!=') && !clean.includes('new Set')
    ) {
      if (idx === 0) {
        findings.push({
          id: `bug-duplicate-${lineNum}`,
          kind: 'suspected_risk',
          severity: 'Medium',
          confidence: 'Medium (Suspected Risk)',
          title: 'Duplicate/Identical Elements Blindspot',
          line: lineNum,
          column: 1,
          expression: 'Array comparison logic',
          whatCodeDoes: 'Compares array elements without checking if candidate values equal the current maximum value.',
          whyIncorrect: 'When all elements in the array are identical (e.g. [5, 5, 5]), no distinct second-largest element exists. Without an inequality guard (nums[i] !== first), the duplicate maximum will be assigned to second largest.',
          conceptExplanation: 'Finding the "second largest distinct element" requires verifying that a candidate is strictly strictly less than the primary maximum (nums[i] < first && nums[i] > second).',
          concreteInput: '[[5, 5, 5]]',
          rawInput: [[5, 5, 5]],
          expectedOutput: null,
          observedOutput: 5,
          chainOfCause: `1. Input [5, 5, 5] has identical values.\n2. First element sets \`first = 5\`.\n3. Subsequent 5 values bypass first check but satisfy \`nums[i] >= second\`.\n4. Erroneously reports 5 as the second largest distinct element.`,
          suggestedFix: {
            explanation: 'Add an inequality condition `nums[i] !== first` when updating the second-largest tracker, and return null if second remains unchanged.',
            targetLine: lineNum,
            originalSnippet: 'else if (nums[i] > second)',
            replacementSnippet: 'else if (nums[i] > second && nums[i] !== first)',
            diff: {
              removed: 'else if (nums[i] > second)',
              added: 'else if (nums[i] > second && nums[i] !== first)',
            },
            canAutoApply: false,
          },
          isConfirmed: false,
        });
      }
    }

    // 5. Operator inversion / Semantic Mismatch
    if (
      (lowerName.includes('add') || lowerName.includes('sum') || lowerName.includes('average') || lowerName.includes('mean')) &&
      /return\s+[a-zA-Z0-9_$]+\s*-\s*[a-zA-Z0-9_$]+/.test(trimmed)
    ) {
      const fixedLine = line.replace('-', '+');
      const col = line.indexOf('-') + 1;

      findings.push({
        id: `bug-operator-inversion-${lineNum}`,
        kind: 'static_warning',
        severity: 'High',
        confidence: 'High (Static Analysis)',
        title: 'Operator Inversion (Subtraction instead of Addition)',
        line: lineNum,
        column: col,
        expression: trimmed,
        whatCodeDoes: `Executes subtraction (\`-\`) in a function whose purpose is addition/summation.`,
        whyIncorrect: `Function signature implies arithmetic sum, but the return expression performs subtraction, yielding an inverted result.`,
        conceptExplanation: 'Verification of arithmetic operators ensures implementation matches algorithm intent.',
        concreteInput: '[5, 7]',
        rawInput: [5, 7],
        expectedOutput: 12,
        observedOutput: -2,
        chainOfCause: `1. Calling with arguments 5 and 7.\n2. Expression executes 5 - 7.\n3. Returns -2 instead of expected sum 12.`,
        suggestedFix: {
          explanation: 'Replace subtraction operator (-) with addition operator (+).',
          targetLine: lineNum,
          originalSnippet: trimmed,
          replacementSnippet: fixedLine.trim(),
          diff: {
            removed: trimmed,
            added: fixedLine.trim(),
          },
          canAutoApply: true,
        },
        isConfirmed: false,
      });
    }
  });

  // 6. Missing empty input guard check for array parameters
  const hasEmptyGuard = /if\s*\(\s*![a-zA-Z0-9_$]+|\.length\s*===?\s*0|\.length\s*<\s*2/.test(clean);
  if (!hasEmptyGuard && (lowerCode.includes('[0]') || (lowerCode.includes('.length') && lowerName.includes('second')))) {
    findings.push({
      id: 'bug-empty-guard-1',
      kind: 'suspected_risk',
      severity: 'Medium',
      confidence: 'Medium (Suspected Risk)',
      title: 'Missing Guard for Empty or Insufficient Input',
      line: 1,
      column: 1,
      expression: lines[0] ? lines[0].trim() : 'function ...',
      whatCodeDoes: 'Directly executes algorithm body without validating whether the input array is empty or contains insufficient elements.',
      whyIncorrect: 'On empty array input [], indexing nums[0] yields undefined, and loop lengths of 0 may result in initial tracker return values instead of graceful handling.',
      conceptExplanation: 'Defensive programming requires handling boundary edge cases (such as null, undefined, or empty collections) at function entry using guard clauses.',
      concreteInput: '[[]]',
      rawInput: [[]],
      expectedOutput: null,
      observedOutput: 'undefined or initial value',
      chainOfCause: `1. Caller passes empty array [].\n2. Array length is 0.\n3. Code accesses undefined indices or returns unhandled default.`,
      suggestedFix: {
        explanation: 'Add a defensive guard clause at the top of the function to validate input length.',
        targetLine: 1,
        originalSnippet: lines[0] ? lines[0].trim() : '',
        replacementSnippet: `${lines[0] ? lines[0].trim() : ''}\n  if (!nums || nums.length < 2) return null;`,
        diff: {
          removed: lines[0] ? lines[0].trim() : '',
          added: `${lines[0] ? lines[0].trim() : ''}\n  if (!nums || nums.length < 2) return null;`,
        },
        canAutoApply: false,
      },
      isConfirmed: false,
    });
  }

  // 7. Missing return statement
  if (!clean.includes('return') && code.includes('function')) {
    findings.push({
      id: `bug-missing-return-${lines.length}`,
      kind: 'static_warning',
      severity: 'High',
      confidence: 'High (Static Analysis)',
      title: 'Missing Return Statement',
      line: lines.length,
      column: 1,
      expression: 'End of function',
      whatCodeDoes: 'Terminates function execution without explicitly returning a value.',
      whyIncorrect: 'JavaScript functions without a return statement implicitly evaluate to `undefined`. Callers expecting computed results will receive undefined.',
      conceptExplanation: 'Functions designed to calculate a result must explicitly use the `return` keyword to yield data back to the calling scope.',
      concreteInput: 'Any input',
      rawInput: null,
      expectedOutput: 'Computed result',
      observedOutput: 'undefined',
      chainOfCause: `1. Function computes values into local variables.\n2. Function block ends without \`return\`.\n3. JavaScript engine yields \`undefined\`.`,
      suggestedFix: {
        explanation: 'Add an explicit return statement returning the calculated result variable.',
        targetLine: lines.length,
        originalSnippet: '}',
        replacementSnippet: '  return result;\n}',
        diff: {
          removed: '}',
          added: '  return result;\n}',
        },
        canAutoApply: false,
      },
      isConfirmed: false,
    });
  }

  return findings;
}

/**
 * Runs sandboxed probe tests to verify suspected bugs against live execution.
 * Promotes static warnings and suspected risks to 'confirmed' status when the runner
 * observes a concrete test failure.
 */
async function verifyBugsWithProbes(code, fnName, staticFindings, runIsolatedProcess) {
  if (!runIsolatedProcess || typeof runIsolatedProcess !== 'function') {
    return staticFindings;
  }

  const lowerName = (fnName || '').toLowerCase();
  const lowerCode = (code || '').toLowerCase();
  const isSecondLargest = lowerName.includes('second') || lowerCode.includes('secondlargest') || lowerCode.includes('second_largest');
  const isAddTwo = lowerName.includes('add') || lowerName.includes('sum');

  // Define concrete probe tests for evidence confirmation
  const probes = [];

  if (isSecondLargest) {
    probes.push(
      { name: 'Empty array probe', input: [[]], expected: null, findingMatch: 'Empty' },
      { name: 'Identical elements probe', input: [[5, 5, 5]], expected: null, findingMatch: 'Duplicate' },
      { name: 'Single element probe', input: [[2]], expected: null, findingMatch: 'Single' },
      { name: 'Negative values probe', input: [[-8, -3, -1, -6]], expected: -3, findingMatch: 'Negative' },
      { name: 'Standard sample probe', input: [[3, 1, 2]], expected: 2, findingMatch: null }
    );
  } else if (isAddTwo) {
    probes.push(
      { name: 'Addition probe', input: [5, 7], expected: 12, findingMatch: 'Inversion' }
    );
  }

  const verifiedFindings = [...staticFindings];

  for (const probe of probes) {
    try {
      const res = await runIsolatedProcess(code, fnName, probe.input, 600);
      const actual = res.success ? res.result : `Error: ${res.error}`;
      const failed = !res.success || JSON.stringify(actual) !== JSON.stringify(probe.expected);

      if (failed) {
        // Find matching static finding or append a confirmed failure
        const matchIdx = verifiedFindings.findIndex(f =>
          probe.findingMatch && f.title.toLowerCase().includes(probe.findingMatch.toLowerCase())
        );

        if (matchIdx !== -1) {
          verifiedFindings[matchIdx] = {
            ...verifiedFindings[matchIdx],
            kind: 'confirmed',
            confidence: 'High (Confirmed by Test)',
            isConfirmed: true,
            concreteInput: JSON.stringify(probe.input),
            rawInput: probe.input,
            observedOutput: actual,
            expectedOutput: probe.expected,
            evidence: `Confirmed by live execution: input ${JSON.stringify(probe.input)} produced ${JSON.stringify(actual)} (expected ${JSON.stringify(probe.expected)}).`,
          };
        } else if (probe.findingMatch) {
          verifiedFindings.push({
            id: `bug-confirmed-${probe.name.toLowerCase().replace(/\s+/g, '-')}`,
            kind: 'confirmed',
            severity: 'High',
            confidence: 'High (Confirmed by Test)',
            isConfirmed: true,
            expression: `Probe: ${probe.name}`,
            line: 1,
            column: 1,
            title: `Confirmed Execution Failure on ${probe.name}`,
            whatCodeDoes: `Executing ${fnName} with input ${JSON.stringify(probe.input)} produced ${JSON.stringify(actual)}.`,
            whyIncorrect: `Expected ${JSON.stringify(probe.expected)} but received ${JSON.stringify(actual)}.`,
            conceptExplanation: 'Live execution confirms a mismatch between actual behavior and algorithm specification on this test input.',
            concreteInput: JSON.stringify(probe.input),
            rawInput: probe.input,
            observedOutput: actual,
            expectedOutput: probe.expected,
            chainOfCause: `1. Isolated sandbox executed ${fnName}(${JSON.stringify(probe.input)}).\n2. Returned ${JSON.stringify(actual)}.\n3. Expected result is ${JSON.stringify(probe.expected)}.`,
            evidence: `Test input ${JSON.stringify(probe.input)} produced actual output ${JSON.stringify(actual)}, but expected ${JSON.stringify(probe.expected)}.`,
            suggestedFix: null,
          });
        }
      }
    } catch (err) {
      // Ignore probe execution errors
    }
  }

  return verifiedFindings;
}

module.exports = {
  inspectStaticBugs,
  verifyBugsWithProbes,
};
