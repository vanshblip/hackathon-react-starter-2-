/**
 * CodeLens Intelligent Code Analyzer & Inference Engine
 * Combines deterministic structural complexity analysis and evidence-based bug detection
 * with pedagogical explanations and alternative implementations.
 */

const { analyzeComplexity } = require("./complexityAnalyzer");
const { inspectStaticBugs, verifyBugsWithProbes } = require("./bugDetector");

// Helper to extract function name and parameter list
function extractFunctionDetails(code) {
  if (!code || typeof code !== "string") {
    return { name: "solution", params: [] };
  }

  // 1. function foo(a, b)
  const fnMatch = code.match(/function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
  if (fnMatch) {
    const name = fnMatch[1];
    const params = fnMatch[2].split(",").map(p => p.trim()).filter(Boolean);
    return { name, params };
  }

  // 2. const foo = (a, b) => or const foo = function(a, b)
  const constMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function)?\s*\(?([^)=]*)\)?\s*=>/);
  if (constMatch) {
    const name = constMatch[1];
    const params = constMatch[2].split(",").map(p => p.trim()).filter(Boolean);
    return { name, params };
  }

  return { name: "solution", params: ["input"] };
}

/**
 * Intelligent Code Inference & Analysis
 */
async function analyzeCode({ code, language = "javascript", contextClarification = "", runIsolatedProcess = null }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    return {
      success: false,
      message: "Please enter or paste some code to analyze.",
    };
  }

  const fnInfo = extractFunctionDetails(code);
  const fnName = fnInfo.name;
  const lowerCode = code.toLowerCase();
  const lowerName = fnName.toLowerCase();

  // 1. Deterministic Structural Complexity Analysis (Actual Source Inspection)
  const complexity = analyzeComplexity(code, fnName, fnInfo.params);

  // 2. Evidence-Based Bug Detection (Static & Live Sandboxed Probes)
  const staticBugs = inspectStaticBugs(code, fnName);
  let potentialBugs = staticBugs;

  if (runIsolatedProcess) {
    try {
      potentialBugs = await verifyBugsWithProbes(code, fnName, staticBugs, runIsolatedProcess);
    } catch (probeErr) {
      console.warn("Probe verification error:", probeErr.message);
    }
  }

  const analyzedAt = new Date().toISOString();
  function enrichResult(res) {
    return {
      ...res,
      analyzedAt,
      analyzedCode: code,
      codeLength: code.length,
    };
  }

  const hasLoops = code.includes("for") || code.includes("while");

  // 3. Algorithmic Pattern Inference & Pedagogical Explanations

  // Pattern A: Add Two Numbers / Sum (only when no iterative loops exist)
  if (!hasLoops && (lowerName.includes("add") || lowerName.includes("sum") || (fnInfo.params.length === 2 && (code.includes("+") || code.includes("-"))))) {
    return enrichResult({
      success: true,
      source: "deterministic_engine",
      functionName: fnName || "addTwoNumbers",
      inferredTitle: "Add Two Numbers",
      inferredPurpose: "Computes the arithmetic sum of two numeric values.",
      isAmbiguous: false,
      clarificationPrompt: null,
      explanation: {
        overview: "Evaluates the mathematical summation of the provided inputs.",
        breakdown: [
          { section: "Parameters", detail: `Accepts arguments: \`${fnInfo.params.join(", ") || "a, b"}\`.` },
          { section: "Operation", detail: "Performs arithmetic evaluation on the inputs." },
          { section: "Return Value", detail: "Yields the numeric result to the caller." },
        ],
      },
      complexity,
      potentialBugs,
      edgeCases: [
        { inputDescription: "Identity with Zero", input: [0, 42], reason: "Adding zero must yield the other operand." },
        { inputDescription: "Negative numbers", input: [-5, -7], reason: "Verifies negative sign handling." },
        { inputDescription: "Opposite signs cancellation", input: [15, -15], reason: "Summing additive inverses yields zero." },
      ],
      alternativeSolution: {
        code: `function ${fnName || "addTwoNumbers"}(a, b) {\n  let x = a, y = b;\n  while (y !== 0) {\n    let carry = x & y;\n    x = x ^ y;\n    y = carry << 1;\n  }\n  return x;\n}`,
        explanation: "Implements a binary half-adder simulation using bitwise XOR for carryless addition and bitwise AND with left-shift for carry propagation.",
        complexity: { time: "O(1)", space: "O(1)" },
        source: "deterministic_engine",
      },
      suggestedTestCases: [
        { id: 1, name: "Positive Integers", input: [5, 7], expected: 12, category: "normal", isSuggested: true },
        { id: 2, name: "Negative Sum", input: [-3, -8], expected: -11, category: "normal", isSuggested: true },
        { id: 3, name: "Identity with Zero", input: [0, 42], expected: 42, category: "boundary", isSuggested: true },
        { id: 4, name: "Opposite Signs", input: [15, -5], expected: 10, category: "edge", isSuggested: true },
        { id: 5, name: "Zeros Pair", input: [0, 0], expected: 0, category: "edge", isSuggested: true },
      ],
    });
  }

  // Pattern B: Reverse an Array
  if (lowerName.includes("reverse") || (lowerCode.includes("reverse") && lowerCode.includes("array")) || (code.includes("nums[nums.length") || (code.includes("swap") && code.includes("length")))) {
    return enrichResult({
      success: true,
      source: "deterministic_engine",
      functionName: fnName || "reverseArray",
      inferredTitle: "Reverse an Array",
      inferredPurpose: "Inverts the order of elements in an array, returning a reversed copy or mutating in-place.",
      isAmbiguous: false,
      clarificationPrompt: null,
      explanation: {
        overview: "Traverses array elements and swaps or reorders them from tail to head.",
        breakdown: [
          { section: "Input Array", detail: `Accepts array parameter \`${fnInfo.params[0] || "nums"}\`.` },
          { section: "Iteration", detail: "Traverses indices to reposition values in inverted sequence." },
          { section: "Output", detail: "Returns the inverted array." },
        ],
      },
      complexity,
      potentialBugs,
      edgeCases: [
        { inputDescription: "Empty array", input: [[]], reason: "Must handle zero-length without out-of-bounds error." },
        { inputDescription: "Single element array", input: [[42]], reason: "Single element array is symmetric." },
        { inputDescription: "Odd vs Even length", input: [[1, 2, 3, 4, 5]], reason: "Middle element in odd arrays must not be double-swapped." },
      ],
      alternativeSolution: {
        code: `function ${fnName || "reverseArray"}(nums) {\n  return nums && Array.isArray(nums) ? [...nums].reverse() : [];\n}`,
        explanation: "Uses modern ES6 spread notation with Array.prototype.reverse() to construct an immutable, pure reversed copy.",
        complexity: { time: "O(n)", space: "O(n)" },
        source: "deterministic_engine",
      },
      suggestedTestCases: [
        { id: 1, name: "Odd Length Array", input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], category: "normal", isSuggested: true },
        { id: 2, name: "Even Length Array", input: [[10, 20]], expected: [20, 10], category: "normal", isSuggested: true },
        { id: 3, name: "Single Element", input: [[42]], expected: [42], category: "boundary", isSuggested: true },
        { id: 4, name: "Empty Array Edge Case", input: [[]], expected: [], category: "edge", isSuggested: true },
        { id: 5, name: "Negative Numbers", input: [[-1, -2, -3]], expected: [-3, -2, -1], category: "edge", isSuggested: true },
      ],
    });
  }

  // Pattern C: Second Largest Element
  if (lowerName.includes("second") || lowerCode.includes("secondlargest") || lowerCode.includes("second_largest")) {
    return enrichResult({
      success: true,
      source: "deterministic_engine",
      functionName: fnName || "findSecondLargest",
      inferredTitle: "Find Second Largest Element",
      inferredPurpose: "Locates the second distinct maximum value in an array of numbers.",
      isAmbiguous: false,
      clarificationPrompt: null,
      explanation: {
        overview: "Maintains trackers for the highest and second-highest values during array traversal.",
        breakdown: [
          { section: "Trackers", detail: "Maintains variables representing largest and second-largest candidates." },
          { section: "Comparison Logic", detail: "Compares each element against current maximums, updating both as needed." },
          { section: "Return Value", detail: "Yields the second largest distinct number, or null/undefined if nonexistent." },
        ],
      },
      complexity,
      potentialBugs,
      edgeCases: [
        { inputDescription: "Empty array", input: [[]], reason: "Must handle zero-length without TypeError on index 0." },
        { inputDescription: "Array with all equal values [5, 5, 5]", input: [[5, 5, 5]], reason: "No distinct second largest exists; should return null or handle gracefully." },
        { inputDescription: "Single element array [2]", input: [[2]], reason: "An array of length 1 cannot possess a second element." },
        { inputDescription: "Negative values [-8, -3, -1, -6]", input: [[-8, -3, -1, -6]], reason: "Verifies trackers are not initialized to 0." },
      ],
      alternativeSolution: {
        code: `function ${fnName || "findSecondLargest"}(nums) {\n  if (!nums || nums.length < 2) return null;\n  const uniqueSorted = Array.from(new Set(nums)).sort((a, b) => b - a);\n  return uniqueSorted.length >= 2 ? uniqueSorted[1] : null;\n}`,
        explanation: "Deduplicates elements with Set, then sorts in descending order to extract index 1.",
        complexity: { time: "O(n log n)", space: "O(n)" },
        source: "deterministic_engine",
      },
      suggestedTestCases: [
        { id: 1, name: "Standard Unsorted", input: [[3, 1, 2]], expected: 2, category: "normal", isSuggested: true },
        { id: 2, name: "Negative Values", input: [[-8, -3, -1, -6]], expected: -3, category: "edge", isSuggested: true },
        { id: 3, name: "Identical Elements Trap", input: [[5, 5, 5]], expected: null, category: "edge", isSuggested: true },
        { id: 4, name: "Single Element", input: [[2]], expected: null, category: "boundary", isSuggested: true },
        { id: 5, name: "Empty Array Edge Case", input: [[]], expected: null, category: "edge", isSuggested: true },
      ],
    });
  }

  // Pattern D: Binary Search / Halving
  if (lowerName.includes("search") || lowerName.includes("binary") || complexity.time === "O(log n)") {
    return enrichResult({
      success: true,
      source: "deterministic_engine",
      functionName: fnName || "binarySearch",
      inferredTitle: "Binary Search / Interval Halving",
      inferredPurpose: "Searches an ordered collection by repeatedly halving the inspection interval.",
      isAmbiguous: false,
      clarificationPrompt: null,
      explanation: {
        overview: "Maintains lower and upper boundary pointers, calculating the mid-point to discard half the search range per iteration.",
        breakdown: [
          { section: "Boundary Pointers", detail: "Initializes left/lo and right/hi pointers bounding the active search segment." },
          { section: "Midpoint Probe", detail: "Computes mid = Math.floor((lo + hi) / 2) to probe the median element." },
          { section: "Range Elimination", detail: "Adjusts boundary pointers, reducing candidate space logarithmically." },
        ],
      },
      complexity,
      potentialBugs,
      edgeCases: [
        { inputDescription: "Element at first index", input: [[1, 3, 5, 7, 9], 1], reason: "Verifies lower boundary edge condition." },
        { inputDescription: "Element at last index", input: [[1, 3, 5, 7, 9], 9], reason: "Verifies upper boundary edge condition." },
        { inputDescription: "Element absent", input: [[1, 3, 5, 7, 9], 4], reason: "Verifies termination when target does not exist." },
      ],
      alternativeSolution: {
        code: `function ${fnName || "binarySearch"}(nums, target) {\n  let lo = 0, hi = nums.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
        explanation: "Iterative binary search with bitwise shift for mid calculation.",
        complexity: { time: "O(log n)", space: "O(1)" },
        source: "deterministic_engine",
      },
      suggestedTestCases: [
        { id: 1, name: "Target Present", input: [[1, 3, 5, 7, 9], 7], expected: 3, category: "normal", isSuggested: true },
        { id: 2, name: "Target Absent", input: [[1, 3, 5, 7, 9], 4], expected: -1, category: "boundary", isSuggested: true },
        { id: 3, name: "Single Element Match", input: [[5], 5], expected: 0, category: "boundary", isSuggested: true },
      ],
    });
  }

  // Fallback: General Arbitrary Code (Honest Analysis)
  return enrichResult({
    success: true,
    source: "structural_analyzer",
    functionName: fnName,
    inferredTitle: fnName !== "solution" ? `Algorithm: ${fnName}` : "Custom Code Analysis",
    inferredPurpose: `Analyzed ${code.split('\n').length}-line function with parameters (${fnInfo.params.join(", ") || "none"}).`,
    isAmbiguous: false,
    clarificationPrompt: null,
    explanation: {
      overview: `The submitted code declares \`${fnName}\`. Complexity and bug inspections were evaluated from the concrete source structure.`,
      breakdown: [
        { section: "Signature", detail: `Function named \`${fnName}\` with parameters: \`${fnInfo.params.join(", ") || "none"}\`.` },
        { section: "Complexity Basis", detail: complexity.explanation },
      ],
    },
    complexity,
    potentialBugs,
    edgeCases: [
      { inputDescription: "Empty input", input: [[]], reason: "Tests boundary behavior on minimal input size." },
      { inputDescription: "Single value", input: [[1]], reason: "Tests minimal non-empty input." },
      { inputDescription: "Null/undefined input", input: [null], reason: "Checks whether input validation guards exist." },
    ],
    alternativeSolution: {
      code: `// To generate an optimized alternative solution for novel or custom code patterns,\n// configure a GEMINI_API_KEY on the backend.\n// Alternatively, write or paste an alternative directly in the editor to benchmark in the Arena.`,
      explanation: "Synthesizing an alternative implementation for novel unrecognized patterns requires an active AI connection (GEMINI_API_KEY).",
      complexity: { time: complexity.time, space: complexity.space },
      source: "honest_notice",
    },
    suggestedTestCases: [
      { id: 1, name: "Sample Input 1", input: [[1, 2, 3]], expected: undefined, category: "normal", isSuggested: true },
      { id: 2, name: "Boundary Input", input: [[]], expected: undefined, category: "boundary", isSuggested: true },
    ],
  });
}

module.exports = {
  extractFunctionDetails,
  analyzeCode,
};
