const { analyzeComplexity } = require('./server/complexityAnalyzer');

const testCases = [
  {
    id: 1,
    name: 'One loop',
    code: `function singleLoop(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
    fnName: 'singleLoop',
    params: ['arr'],
    expected: 'O(n)',
  },
  {
    id: 2,
    name: 'Two sequential loops',
    code: `function sequentialLoops(arr) {
  let maxVal = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > maxVal) maxVal = arr[i];
  }
  let minVal = arr[0];
  for (let j = 0; j < arr.length; j++) {
    if (arr[j] < minVal) minVal = arr[j];
  }
  return maxVal - minVal;
}`,
    fnName: 'sequentialLoops',
    params: ['arr'],
    expected: 'O(n)',
  },
  {
    id: 3,
    name: 'Two nested loops over n',
    code: `function nestedLoops(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      count++;
    }
  }
  return count;
}`,
    fnName: 'nestedLoops',
    params: ['arr'],
    expected: 'O(n²)',
  },
  {
    id: 4,
    name: 'Three nested loops over n',
    code: `function threeNested(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      for (let k = 0; k < arr.length; k++) {
        count++;
      }
    }
  }
  return count;
}`,
    fnName: 'threeNested',
    params: ['arr'],
    expected: 'O(n³)',
  },
  {
    id: 5,
    name: 'Exact pairs(arr) example',
    code: `function pairs(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}`,
    fnName: 'pairs',
    params: ['arr'],
    expected: 'O(n²)',
  },
  {
    id: 6,
    name: 'Binary search',
    code: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    fnName: 'binarySearch',
    params: ['arr', 'target'],
    expected: 'O(log n)',
  },
  {
    id: 7,
    name: 'Nested loops with different bounds',
    code: `function diffBounds(n, m) {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      console.log(i, j);
    }
  }
}`,
    fnName: 'diffBounds',
    params: ['n', 'm'],
    expected: 'O(n * m)',
  },
];

console.log('=== MANDATORY REGRESSION TEST SUITE ===\n');

let failed = 0;
for (const tc of testCases) {
  const result = analyzeComplexity(tc.code, tc.fnName, tc.params);
  const pass = result.time === tc.expected;
  if (!pass) failed++;

  console.log(`Test ${tc.id}: ${tc.name}`);
  console.log(`  Actual Time:     ${result.time}`);
  console.log(`  Expected Time:   ${tc.expected}`);
  console.log(`  Actual Space:    ${result.space}`);
  console.log(`  Explanation:     ${result.explanation}`);
  console.log(`  Status:          ${pass ? 'PASSED' : 'FAILED'}\n`);
}

if (failed > 0) {
  console.error(`FAILED: ${failed} tests failed!`);
  process.exit(1);
} else {
  console.log('ALL MANDATORY REGRESSION TESTS PASSED (0 failures).\n');
}
