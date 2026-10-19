/**
 * CodeLens Bug Hunt — Deterministic Debugging Challenges Library
 * Contains 10 tested challenges across Easy, Medium, and Hard difficulty tiers.
 */

const CHALLENGES = [
  // ==========================================
  // EASY TIER (100 XP)
  // ==========================================
  {
    id: "sum-array-bound",
    title: "Off-by-One Array Bound",
    difficulty: "Easy",
    category: "Off-by-One Loop Bound",
    xp: 100,
    functionName: "sumArray",
    taskDescription: "Calculate and return the sum of all numbers in the array `nums`. If the array is empty, return 0.",
    expectedBehavior: "Iterate through all valid elements from index 0 to nums.length - 1 and return the sum.",
    starterBuggyCode: `function sumArray(nums) {
  if (!nums || nums.length === 0) return 0;
  let total = 0;
  for (let i = 0; i <= nums.length; i++) {
    total += nums[i];
  }
  return total;
}`,
    faultyLine: 4,
    bugExplanation: "Line 4 uses `i <= nums.length` which accesses `nums[nums.length]` (undefined). Adding undefined to a number produces `NaN`.",
    referenceSolution: `function sumArray(nums) {
  if (!nums || nums.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
  }
  return total;
}`,
    hints: [
      "Check how many iterations the `for` loop executes.",
      "Arrays are 0-indexed: the last valid element is at `nums.length - 1`. When `i == nums.length`, `nums[i]` is undefined.",
      "On line 4, change `i <= nums.length` to `i < nums.length`."
    ],
    testCases: [
      { id: 1, name: "Positive Integers", input: [[1, 2, 3, 4, 5]], expected: 15, isEdgeCase: false },
      { id: 2, name: "Negative & Positive Mix", input: [[-2, 5, 7]], expected: 10, isEdgeCase: false },
      { id: 3, name: "Single Element Array", input: [[42]], expected: 42, isEdgeCase: true },
      { id: 4, name: "Empty Array Guard", input: [[]], expected: 0, isEdgeCase: true }
    ]
  },
  {
    id: "check-prime-one",
    title: "Prime Number Boundary Trap",
    difficulty: "Easy",
    category: "Boundary Condition",
    xp: 100,
    functionName: "isPrime",
    taskDescription: "Given an integer `n`, return `true` if `n` is prime, and `false` otherwise. Note: 1 and numbers <= 0 are not prime.",
    expectedBehavior: "Primes must be strictly greater than 1 and divisible only by 1 and themselves.",
    starterBuggyCode: `function isPrime(n) {
  if (n < 1) return false;
  for (let i = 2; i < n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
    faultyLine: 2,
    bugExplanation: "Line 2 checks `n < 1` instead of `n <= 1`. This allows `n = 1` to skip the loop and incorrectly return `true`.",
    referenceSolution: `function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`,
    hints: [
      "By mathematical definition, prime numbers must be strictly greater than 1.",
      "Trace the function with input `n = 1`.",
      "On line 2, replace `if (n < 1)` with `if (n <= 1)`."
    ],
    testCases: [
      { id: 1, name: "Small Prime 7", input: [7], expected: true, isEdgeCase: false },
      { id: 2, name: "Edge Case: Number 1", input: [1], expected: false, isEdgeCase: true },
      { id: 3, name: "Small Composite 12", input: [12], expected: false, isEdgeCase: false },
      { id: 4, name: "Smallest Prime 2", input: [2], expected: true, isEdgeCase: true },
      { id: 5, name: "Negative Number -5", input: [-5], expected: false, isEdgeCase: true }
    ]
  },
  {
    id: "count-occurrences",
    title: "Accumulator Variable Misuse",
    difficulty: "Easy",
    category: "Wrong Variable Accumulation",
    xp: 100,
    functionName: "countOccurrences",
    taskDescription: "Count how many times the value `target` occurs in the array `arr`.",
    expectedBehavior: "Increment the count accumulator by 1 for each matching element found.",
    starterBuggyCode: `function countOccurrences(arr, target) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      count = count + i;
    }
  }
  return count;
}`,
    faultyLine: 5,
    bugExplanation: "Line 5 adds the loop index `i` instead of 1 to `count`, resulting in a sum of matching indices rather than a count of occurrences.",
    referenceSolution: `function countOccurrences(arr, target) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      count = count + 1;
    }
  }
  return count;
}`,
    hints: [
      "Check the accumulator update inside the `if` block.",
      "Notice whether you are tallying occurrences or adding array indices.",
      "On line 5, replace `count = count + i` with `count = count + 1`."
    ],
    testCases: [
      { id: 1, name: "Multiple Occurrences", input: [[1, 2, 2, 3, 2], 2], expected: 3, isEdgeCase: false },
      { id: 2, name: "All Identical Elements", input: [[5, 5, 5], 5], expected: 3, isEdgeCase: false },
      { id: 3, name: "Target Not Present", input: [[1, 2, 3], 9], expected: 0, isEdgeCase: true },
      { id: 4, name: "Empty Array", input: [[], 42], expected: 0, isEdgeCase: true }
    ]
  },
  {
    id: "sum-range-missing-return",
    title: "Missing Return Value",
    difficulty: "Easy",
    category: "Missing Return",
    xp: 100,
    functionName: "sumRange",
    taskDescription: "Calculate the sum of all integers from `start` to `end` inclusive.",
    expectedBehavior: "Compute the accumulated sum and return it to the caller.",
    starterBuggyCode: `function sumRange(start, end) {
  let total = 0;
  for (let i = start; i <= end; i++) {
    total += i;
  }
}`,
    faultyLine: 6,
    bugExplanation: "The function calculates `total` in the loop but omits `return total;`, causing JavaScript to return `undefined`.",
    referenceSolution: `function sumRange(start, end) {
  let total = 0;
  for (let i = start; i <= end; i++) {
    total += i;
  }
  return total;
}`,
    hints: [
      "Check the return value of the function.",
      "What does JavaScript return when no return statement is specified?",
      "Add `return total;` before the closing brace of `sumRange`."
    ],
    testCases: [
      { id: 1, name: "Range 1 to 5", input: [1, 5], expected: 15, isEdgeCase: false },
      { id: 2, name: "Single Integer Range", input: [3, 3], expected: 3, isEdgeCase: true },
      { id: 3, name: "Symmetric Negative Range", input: [-2, 2], expected: 0, isEdgeCase: true }
    ]
  },

  // ==========================================
  // MEDIUM TIER (150 XP)
  // ==========================================
  {
    id: "reverse-array-overswap",
    title: "Double-Swap Array Mirror",
    difficulty: "Medium",
    category: "Faulty Loop Boundary",
    xp: 150,
    functionName: "reverseArray",
    taskDescription: "Return a new array with elements in reversed order.",
    expectedBehavior: "Swap symmetrical elements up to the midpoint so elements end up inverted.",
    starterBuggyCode: `function reverseArray(nums) {
  if (!nums || !Array.isArray(nums)) return [];
  let res = [...nums];
  for (let i = 0; i < res.length; i++) {
    let temp = res[i];
    res[i] = res[res.length - 1 - i];
    res[res.length - 1 - i] = temp;
  }
  return res;
}`,
    faultyLine: 4,
    bugExplanation: "Line 4 runs the loop for the full length of `res`. The second half of iterations unswaps every element back to its starting location.",
    referenceSolution: `function reverseArray(nums) {
  if (!nums || !Array.isArray(nums)) return [];
  let res = [...nums];
  let half = Math.floor(res.length / 2);
  for (let i = 0; i < half; i++) {
    let temp = res[i];
    res[i] = res[res.length - 1 - i];
    res[res.length - 1 - i] = temp;
  }
  return res;
}`,
    hints: [
      "Notice what happens after the loop counter passes the middle of the array.",
      "Swapping elements twice returns them to their original positions.",
      "Change line 4 so the loop only iterates up to `Math.floor(res.length / 2)`."
    ],
    testCases: [
      { id: 1, name: "Odd Length Array", input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], isEdgeCase: false },
      { id: 2, name: "Even Length Array", input: [[10, 20]], expected: [20, 10], isEdgeCase: false },
      { id: 3, name: "Single Element", input: [[42]], expected: [42], isEdgeCase: true },
      { id: 4, name: "Empty Array Guard", input: [[]], expected: [], isEdgeCase: true }
    ]
  },
  {
    id: "second-largest-dup",
    title: "Second Largest Duplicate Trap",
    difficulty: "Medium",
    category: "Duplicate Handling",
    xp: 150,
    functionName: "findSecondLargest",
    taskDescription: "Given an array `nums`, return the second distinct largest number. If no distinct second largest exists, return `null`.",
    expectedBehavior: "Identify the largest value and the strictly smaller second largest value, ignoring duplicate maximums.",
    starterBuggyCode: `function findSecondLargest(nums) {
  if (!nums || nums.length < 2) return null;
  let first = -Infinity, second = -Infinity;
  for (let x of nums) {
    if (x > first) {
      second = first;
      first = x;
    } else if (x >= second) {
      second = x;
    }
  }
  return second === -Infinity ? null : second;
}`,
    faultyLine: 8,
    bugExplanation: "Line 8 uses `x >= second` without verifying that `x < first`. When duplicate copies of the maximum element appear (e.g. `[10, 10, 10]`), `second` is erroneously assigned equal to `first`.",
    referenceSolution: `function findSecondLargest(nums) {
  if (!nums || nums.length < 2) return null;
  let first = -Infinity, second = -Infinity;
  for (let x of nums) {
    if (x > first) {
      second = first;
      first = x;
    } else if (x > second && x < first) {
      second = x;
    }
  }
  return second === -Infinity ? null : second;
}`,
    hints: [
      "Test what happens with an array of identical values like `[10, 10, 10]`.",
      "The second largest number must be strictly less than `first`.",
      "On line 8, change `else if (x >= second)` to `else if (x > second && x < first)`."
    ],
    testCases: [
      { id: 1, name: "General Case", input: [[12, 35, 1, 10, 34, 1]], expected: 34, isEdgeCase: false },
      { id: 2, name: "Identical Elements Trap", input: [[10, 10, 10]], expected: null, isEdgeCase: true },
      { id: 3, name: "Two Elements", input: [[5, 2]], expected: 2, isEdgeCase: false },
      { id: 4, name: "Negative Numbers", input: [[-10, -5, -2, -1]], expected: -2, isEdgeCase: true },
      { id: 5, name: "Single Element Array", input: [[7]], expected: null, isEdgeCase: true }
    ]
  },
  {
    id: "binary-search-inf",
    title: "Binary Search Infinite Loop",
    difficulty: "Medium",
    category: "Loop Convergence Invariant",
    xp: 150,
    functionName: "binarySearch",
    taskDescription: "Given a sorted array `arr` and a `target`, return the index of `target`, or `-1` if target is not found.",
    expectedBehavior: "Narrow the search space logarithmically until `lo > hi` or `arr[mid] === target`.",
    starterBuggyCode: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}`,
    faultyLine: 7,
    bugExplanation: "Line 7 sets `lo = mid` instead of `lo = mid + 1`. When `hi - lo === 1` and `arr[mid] < target`, `lo` fails to advance, causing an infinite loop.",
    referenceSolution: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}`,
    hints: [
      "If `arr[mid]` is strictly less than target, `mid` itself cannot be the target.",
      "Setting `lo = mid` causes `lo` to stall when `lo + 1 === hi`.",
      "On line 7, change `lo = mid;` to `lo = mid + 1;`."
    ],
    testCases: [
      { id: 1, name: "Target Present in Array", input: [[1, 3, 5, 7, 9], 7], expected: 3, isEdgeCase: false },
      { id: 2, name: "Two Element Boundary Trap", input: [[2, 4], 4], expected: 1, isEdgeCase: true },
      { id: 3, name: "Target Below Minimum", input: [[1, 2, 3], 0], expected: -1, isEdgeCase: true },
      { id: 4, name: "Empty Array Search", input: [[], 5], expected: -1, isEdgeCase: true }
    ]
  },

  // ==========================================
  // HARD TIER (200 XP)
  // ==========================================
  {
    id: "two-sum-self-pair",
    title: "Two Sum Self-Pair Collision",
    difficulty: "Hard",
    category: "Self-Pairing Hash Collision",
    xp: 200,
    functionName: "twoSum",
    taskDescription: "Given an array `nums` and integer `target`, return indices `[i, j]` whose values add up to `target`. Each element may only be used once. Return `null` if no pair exists.",
    expectedBehavior: "Pair two distinct index positions whose values sum to the target.",
    starterBuggyCode: `function twoSum(nums, target) {
  let map = {};
  for (let i = 0; i < nums.length; i++) {
    map[nums[i]] = i;
    let complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
  }
  return null;
}`,
    faultyLine: 4,
    bugExplanation: "Line 4 registers `nums[i]` into `map` before checking the complement. If `nums[i] * 2 === target`, the element pairs with itself at the same index `[i, i]`.",
    referenceSolution: `function twoSum(nums, target) {
  let map = {};
  for (let i = 0; i < nums.length; i++) {
    let complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
  return null;
}`,
    hints: [
      "Can the same single index be used twice to form the sum?",
      "Consider `nums = [3, 2, 4]` and `target = 6`. Does element 3 at index 0 pair with itself?",
      "Move `map[nums[i]] = i;` to after the complement check so an element never pairs with itself."
    ],
    testCases: [
      { id: 1, name: "Standard Pair", input: [[2, 7, 11, 15], 9], expected: [0, 1], isEdgeCase: false },
      { id: 2, name: "Self-Pairing Trap [3, 2, 4], 6", input: [[3, 2, 4], 6], expected: [1, 2], isEdgeCase: true },
      { id: 3, name: "No Valid Pair", input: [[1, 2, 3], 7], expected: null, isEdgeCase: true }
    ]
  },
  {
    id: "flatten-array-spread",
    title: "Recursive Array Flattening Depth",
    difficulty: "Hard",
    category: "Recursion Concatenation",
    xp: 200,
    functionName: "flattenArray",
    taskDescription: "Given a nested array of arbitrary depth, return a 1D flattened array containing all values.",
    expectedBehavior: "Recursively unpack inner array structures and append elements directly to the result array.",
    starterBuggyCode: `function flattenArray(arr) {
  let result = [];
  for (let item of arr) {
    if (Array.isArray(item)) {
      result.push(flattenArray(item));
    } else {
      result.push(item);
    }
  }
  return result;
}`,
    faultyLine: 5,
    bugExplanation: "Line 5 pushes the returned array as a single element, creating another level of nesting instead of merging the unpacked elements.",
    referenceSolution: `function flattenArray(arr) {
  let result = [];
  for (let item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenArray(item));
    } else {
      result.push(item);
    }
  }
  return result;
}`,
    hints: [
      "Look at how the recursive return value is merged into `result`.",
      "`result.push(array)` inserts the array as a nested element.",
      "On line 5, spread the recursive result: `result.push(...flattenArray(item));`."
    ],
    testCases: [
      { id: 1, name: "Multi-level Nesting", input: [[1, [2, [3, 4], 5], 6]], expected: [1, 2, 3, 4, 5, 6], isEdgeCase: false },
      { id: 2, name: "Shallow Two Sub-arrays", input: [[[1], [2]]], expected: [1, 2], isEdgeCase: false },
      { id: 3, name: "Already Flat Array", input: [[1, 2, 3]], expected: [1, 2, 3], isEdgeCase: true },
      { id: 4, name: "Empty Array", input: [[]], expected: [], isEdgeCase: true }
    ]
  },
  {
    id: "palindrome-pointer-inversion",
    title: "Two-Pointer Inversion in Helper",
    difficulty: "Hard",
    category: "Pointer Direction Inversion",
    xp: 200,
    functionName: "isPalindromeWithOneSkip",
    taskDescription: "Return `true` if string `s` can be a palindrome after deleting at most one character.",
    expectedBehavior: "Validate string symmetry and check both skip branches on the first mismatch.",
    starterBuggyCode: `function isPalindromeWithOneSkip(s) {
  function isSubPal(str, left, right) {
    while (left < right) {
      if (str[left] !== str[right]) return false;
      left++;
      right++;
    }
    return true;
  }
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) {
      return isSubPal(s, l + 1, r) || isSubPal(s, l, r - 1);
    }
    l++;
    r--;
  }
  return true;
}`,
    faultyLine: 6,
    bugExplanation: "In helper function `isSubPal`, line 6 increments `right++` instead of decrementing `right--`. This diverges the right pointer away from the center.",
    referenceSolution: `function isPalindromeWithOneSkip(s) {
  function isSubPal(str, left, right) {
    while (left < right) {
      if (str[left] !== str[right]) return false;
      left++;
      right--;
    }
    return true;
  }
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) {
      return isSubPal(s, l + 1, r) || isSubPal(s, l, r - 1);
    }
    l++;
    r--;
  }
  return true;
}`,
    hints: [
      "Trace the pointer movement inside the `isSubPal` helper function.",
      "Two-pointer palindrome verification moves the left pointer inward (`left++`). Which direction must the right pointer move?",
      "On line 6, change `right++` to `right--`."
    ],
    testCases: [
      { id: 1, name: "Already Palindrome 'aba'", input: ["aba"], expected: true, isEdgeCase: false },
      { id: 2, name: "Skip Right Char 'abca'", input: ["abca"], expected: true, isEdgeCase: false },
      { id: 3, name: "Sub-palindrome Traversal 'axbba'", input: ["axbba"], expected: true, isEdgeCase: false },
      { id: 4, name: "Unfixable 'abc'", input: ["abc"], expected: false, isEdgeCase: false },
      { id: 5, name: "Middle Skip 'raceacar'", input: ["raceacar"], expected: true, isEdgeCase: true }
    ]
  }
];

module.exports = {
  CHALLENGES
};
