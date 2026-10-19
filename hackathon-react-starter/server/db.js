
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dataDirectory = path.join(__dirname, "data");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, "hackathon.db");
const db = new Database(databasePath);

// Create the tasks table if it doesn't exist yet (preserving existing schema & data)
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    priority TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create problems table
db.exec(`
  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    alternative_code TEXT NOT NULL,
    constraints TEXT NOT NULL,
    examples TEXT NOT NULL,
    test_cases TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create attempts table
db.exec(`
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id TEXT NOT NULL,
    language TEXT NOT NULL,
    student_code TEXT NOT NULL,
    alternative_code TEXT,
    passed_count INTEGER NOT NULL,
    total_count INTEGER NOT NULL,
    verdict TEXT NOT NULL,
    time_taken_ms REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed default problems if none exist
const problemCount = db.prepare("SELECT COUNT(*) as count FROM problems").get().count;

if (problemCount === 0) {
  const insertProblem = db.prepare(`
    INSERT INTO problems (id, title, difficulty, category, description, starter_code, alternative_code, constraints, examples, test_cases)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProblems = [
    {
      id: "find-max",
      title: "Find the Maximum Element",
      difficulty: "Easy",
      category: "Arrays",
      description: "Given an array of integers nums, find and return the maximum element in the array.",
      starter_code: `function findMax(nums) {\n  if (!nums || nums.length === 0) {\n    return null;\n  }\n  let maxVal = nums[0];\n  for (let i = 0; i < nums.length; i++) {\n    if (nums[i] > maxVal) {\n      maxVal = nums[i];\n    }\n  }\n  return maxVal;\n}`,
      alternative_code: `function findMax(nums) {\n  // Built-in V8 engine optimized single pass\n  return nums && nums.length > 0 ? Math.max(...nums) : null;\n}`,
      constraints: JSON.stringify([
        "1 <= nums.length <= 10^5",
        "-10^9 <= nums[i] <= 10^9",
        "Array may contain negative, zero, and duplicate elements."
      ]),
      examples: JSON.stringify([
        {
          input: "nums = [3, 1, 4, 1, 5, 9, 2, 6]",
          output: "9",
          explanation: "The maximum element is 9 located at index 5."
        },
        {
          input: "nums = [-5, -1, -10]",
          output: "-1",
          explanation: "The maximum of negative elements is -1."
        }
      ]),
      test_cases: JSON.stringify([
        { id: 1, name: "General Case", input: [3, 1, 4, 1, 5, 9, 2, 6], expected: 9 },
        { id: 2, name: "Negative Numbers", input: [-5, -1, -10], expected: -1 },
        { id: 3, name: "Single Element", input: [42], expected: 42 },
        { id: 4, name: "Identical Elements", input: [7, 7, 7, 7], expected: 7 },
        { id: 5, name: "Empty Array Edge Case", input: [], expected: null }
      ])
    },
    {
      id: "valid-palindrome",
      title: "Valid Palindrome II (Edge Case Variations)",
      difficulty: "Easy",
      category: "Strings & Two Pointers",
      description: "Given a string s, return true if the s can be palindrome after deleting at most one character from it.",
      starter_code: `function validPalindrome(s) {\n  let left = 0;\n  let right = s.length - 1;\n  \n  function isSubPalin(str, l, r) {\n    while (l < r) {\n      if (str[l] !== str[r]) return false;\n      l++;\n      r--;\n    }\n    return true;\n  }\n  \n  while (left < right) {\n    if (s[left] !== s[right]) {\n      return isSubPalin(s, left + 1, right) || isSubPalin(s, left, right - 1);\n    }\n    left++;\n    right--;\n  }\n  return true;\n}`,
      alternative_code: `function validPalindrome(s) {\n  // Early branch recursive verification\n  const check = (l, r, skipped) => {\n    while (l < r) {\n      if (s[l] !== s[r]) {\n        if (skipped) return false;\n        return check(l + 1, r, true) || check(l, r - 1, true);\n      }\n      l++;\n      r--;\n    }\n    return true;\n  };\n  return check(0, s.length - 1, false);\n}`,
      constraints: JSON.stringify([
        "1 <= s.length <= 10^5",
        "s consists of lowercase English letters only."
      ]),
      examples: JSON.stringify([
        { input: "s = 'aba'", output: "true", explanation: "String is already a palindrome." },
        { input: "s = 'abca'", output: "true", explanation: "You could delete the character 'c'." }
      ]),
      test_cases: JSON.stringify([
        { id: 1, name: "Standard Palindrome", input: ["aba"], expected: true },
        { id: 2, name: "Delete One Character", input: ["abca"], expected: true },
        { id: 3, name: "Cannot Form Palindrome", input: ["abc"], expected: false },
        { id: 4, name: "Single Character", input: ["a"], expected: true },
        { id: 5, name: "Repeated Characters with mismatch", input: ["deeee"], expected: true }
      ])
    },
    {
      id: "two-sum",
      title: "Two Sum Target Pair",
      difficulty: "Easy",
      category: "Arrays & Hash Map",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      starter_code: `function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}`,
      alternative_code: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      constraints: JSON.stringify([
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "Exactly one valid answer exists."
      ]),
      examples: JSON.stringify([
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9, so return [0, 1]." }
      ]),
      test_cases: JSON.stringify([
        { id: 1, name: "Standard Pair", input: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { id: 2, name: "Non-adjacent pair", input: [[3, 2, 4], 6], expected: [1, 2] },
        { id: 3, name: "Same value elements", input: [[3, 3], 6], expected: [0, 1] },
        { id: 4, name: "Negative values", input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] }
      ])
    },
    {
      id: "binary-search",
      title: "Binary Search & Recursion",
      difficulty: "Medium",
      category: "Binary Search",
      description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
      starter_code: `function binarySearch(nums, target) {\n  let lo = 0;\n  let hi = nums.length - 1;\n  while (lo <= hi) {\n    let mid = Math.floor(lo + (hi - lo) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
      alternative_code: `function binarySearch(nums, target) {\n  const search = (lo, hi) => {\n    if (lo > hi) return -1;\n    const mid = (lo + hi) >> 1;\n    if (nums[mid] === target) return mid;\n    return nums[mid] < target ? search(mid + 1, hi) : search(lo, mid - 1);\n  };\n  return search(0, nums.length - 1);\n}`,
      constraints: JSON.stringify([
        "1 <= nums.length <= 10^4",
        "All integers in nums are unique",
        "nums is sorted in ascending order"
      ]),
      examples: JSON.stringify([
        { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4" }
      ]),
      test_cases: JSON.stringify([
        { id: 1, name: "Element Found", input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
        { id: 2, name: "Element Not Found", input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
        { id: 3, name: "Single Element Match", input: [[5], 5], expected: 0 },
        { id: 4, name: "Single Element Miss", input: [[5], 10], expected: -1 }
      ])
    }
  ];

  initialProblems.forEach((p) => {
    insertProblem.run(
      p.id,
      p.title,
      p.difficulty,
      p.category,
      p.description,
      p.starter_code,
      p.alternative_code,
      p.constraints,
      p.examples,
      p.test_cases
    );
  });
  console.log("Seeded initial CodeLens problems.");
}

// Safe schema migration for problems table
const existingProblemCols = db.prepare("PRAGMA table_info(problems)").all().map(c => c.name);
if (!existingProblemCols.includes("is_custom")) {
  db.exec("ALTER TABLE problems ADD COLUMN is_custom INTEGER DEFAULT 0");
}
if (!existingProblemCols.includes("function_name")) {
  db.exec("ALTER TABLE problems ADD COLUMN function_name TEXT");
}
if (!existingProblemCols.includes("input_format")) {
  db.exec("ALTER TABLE problems ADD COLUMN input_format TEXT");
}
if (!existingProblemCols.includes("output_format")) {
  db.exec("ALTER TABLE problems ADD COLUMN output_format TEXT");
}

// Safe schema migration for attempts table
const existingAttemptCols = db.prepare("PRAGMA table_info(attempts)").all().map(c => c.name);
if (!existingAttemptCols.includes("problem_title")) {
  db.exec("ALTER TABLE attempts ADD COLUMN problem_title TEXT");
}
if (!existingAttemptCols.includes("test_results_json")) {
  db.exec("ALTER TABLE attempts ADD COLUMN test_results_json TEXT");
}

// Safe schema creation for Bug Hunt game_progress table
db.exec(`
  CREATE TABLE IF NOT EXISTS game_progress (
    id TEXT PRIMARY KEY,
    score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    completed_challenges TEXT DEFAULT '[]',
    hints_used INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const defaultProgress = db.prepare("SELECT * FROM game_progress WHERE id = 'user-default'").get();
if (!defaultProgress) {
  db.prepare(`
    INSERT INTO game_progress (id, score, streak, completed_challenges, hints_used)
    VALUES ('user-default', 0, 0, '[]', 0)
  `).run();
}

// Helper to seed a problem if it doesn't exist
const insertProblemStmt = db.prepare(`
  INSERT INTO problems (id, title, difficulty, category, description, starter_code, alternative_code, constraints, examples, test_cases, is_custom, function_name, input_format, output_format)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function seedProblemIfNotExists(p) {
  const existing = db.prepare("SELECT id FROM problems WHERE id = ?").get(p.id);
  if (!existing) {
    insertProblemStmt.run(
      p.id,
      p.title,
      p.difficulty,
      p.category,
      p.description,
      p.starter_code,
      p.alternative_code,
      p.constraints,
      p.examples,
      p.test_cases,
      p.is_custom || 0,
      p.function_name || null,
      p.input_format || null,
      p.output_format || null
    );
  }
}

// Quick-start example problems
const quickStartProblems = [
  {
    id: "quick-reverse-array",
    title: "Reverse an Array",
    difficulty: "Easy",
    category: "Arrays & Pointers",
    function_name: "reverseArray",
    input_format: "nums: Array of integers",
    output_format: "Array of integers in reversed order",
    description: "Given an array of integers nums, reverse the array in place or return a new array with the elements in reverse order.",
    starter_code: `function reverseArray(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n  const result = [...nums];\n  while (left < right) {\n    const temp = result[left];\n    result[left] = result[right];\n    result[right] = temp;\n    left++;\n    right--;\n  }\n  return result;\n}`,
    alternative_code: `function reverseArray(nums) {\n  // Built-in V8 array reverse\n  return nums && Array.isArray(nums) ? [...nums].reverse() : [];\n}`,
    constraints: JSON.stringify([
      "0 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9"
    ]),
    examples: JSON.stringify([
      { input: "nums = [1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]", explanation: "Elements swapped from ends toward center." },
      { input: "nums = [42]", output: "[42]", explanation: "Single element array remains unchanged." }
    ]),
    test_cases: JSON.stringify([
      { id: 1, name: "General Array", input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { id: 2, name: "Even Length", input: [[10, 20]], expected: [20, 10] },
      { id: 3, name: "Single Element", input: [[42]], expected: [42] },
      { id: 4, name: "Empty Array", input: [[]], expected: [] },
      { id: 5, name: "Negative Numbers", input: [[-1, -2, -3]], expected: [-3, -2, -1] }
    ]),
    is_custom: 0,
  },
  {
    id: "quick-add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Easy",
    category: "Math & Basics",
    function_name: "addTwoNumbers",
    input_format: "a: number, b: number",
    output_format: "number: arithmetic sum of a and b",
    description: "Given two numbers a and b, compute and return their arithmetic sum.",
    starter_code: `function addTwoNumbers(a, b) {\n  return a + b;\n}`,
    alternative_code: `function addTwoNumbers(a, b) {\n  // Bitwise half-adder simulation\n  let x = a, y = b;\n  while (y !== 0) {\n    let carry = x & y;\n    x = x ^ y;\n    y = carry << 1;\n  }\n  return x;\n}`,
    constraints: JSON.stringify([
      "-10^9 <= a, b <= 10^9"
    ]),
    examples: JSON.stringify([
      { input: "a = 5, b = 7", output: "12", explanation: "5 + 7 = 12." },
      { input: "a = -3, b = 8", output: "5", explanation: "-3 + 8 = 5." }
    ]),
    test_cases: JSON.stringify([
      { id: 1, name: "Positive Numbers", input: [5, 7], expected: 12 },
      { id: 2, name: "Negative Numbers", input: [-3, -8], expected: -11 },
      { id: 3, name: "With Zero", input: [0, 42], expected: 42 },
      { id: 4, name: "Opposite Signs", input: [15, -5], expected: 10 },
      { id: 5, name: "Zeroes", input: [0, 0], expected: 0 }
    ]),
    is_custom: 0,
  },
  {
    id: "quick-second-largest",
    title: "Find the Second Largest Element",
    difficulty: "Medium",
    category: "Arrays & Invariants",
    function_name: "findSecondLargest",
    input_format: "nums: Array of integers",
    output_format: "Second distinct largest integer, or null if none exists",
    description: "Given an array of integers nums, find the second distinct largest element in the array. If no second largest distinct element exists, return null.",
    starter_code: `function findSecondLargest(nums) {\n  if (!nums || nums.length < 2) return null;\n  let first = -Infinity;\n  let second = -Infinity;\n  for (let num of nums) {\n    if (num > first) {\n      second = first;\n      first = num;\n    } else if (num > second && num < first) {\n      second = num;\n    }\n  }\n  return second === -Infinity ? null : second;\n}`,
    alternative_code: `function findSecondLargest(nums) {\n  if (!nums || nums.length < 2) return null;\n  const uniqueSorted = Array.from(new Set(nums)).sort((a, b) => b - a);\n  return uniqueSorted.length >= 2 ? uniqueSorted[1] : null;\n}`,
    constraints: JSON.stringify([
      "1 <= nums.length <= 10^5",
      "-10^9 <= nums[i] <= 10^9"
    ]),
    examples: JSON.stringify([
      { input: "nums = [12, 35, 1, 10, 34, 1]", output: "34", explanation: "Largest is 35, second largest is 34." },
      { input: "nums = [10, 10, 10]", output: "null", explanation: "All elements are equal, no second largest distinct element exists." }
    ]),
    test_cases: JSON.stringify([
      { id: 1, name: "Distinct Elements", input: [[12, 35, 1, 10, 34, 1]], expected: 34 },
      { id: 2, name: "Identical Elements Trap", input: [[10, 10, 10]], expected: null },
      { id: 3, name: "Two Elements", input: [[5, 2]], expected: 2 },
      { id: 4, name: "Negative Numbers", input: [[-10, -5, -2, -1]], expected: -2 },
      { id: 5, name: "Single Element Boundary", input: [[42]], expected: null }
    ]),
    is_custom: 0,
  },
  {
    id: "quick-check-prime",
    title: "Check Prime Number",
    difficulty: "Easy",
    category: "Math & Number Theory",
    function_name: "isPrime",
    input_format: "n: integer",
    output_format: "boolean: true if n is prime, false otherwise",
    description: "Given an integer n, determine whether n is a prime number (greater than 1 and having no positive divisors other than 1 and itself).",
    starter_code: `function isPrime(n) {\n  if (n <= 1) return false;\n  for (let i = 2; i < n; i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}`,
    alternative_code: `function isPrime(n) {\n  if (n <= 1) return false;\n  if (n <= 3) return true;\n  if (n % 2 === 0 || n % 3 === 0) return false;\n  for (let i = 5; i * i <= n; i += 6) {\n    if (n % i === 0 || n % (i + 2) === 0) return false;\n  }\n  return true;\n}`,
    constraints: JSON.stringify([
      "-10^9 <= n <= 10^9"
    ]),
    examples: JSON.stringify([
      { input: "n = 7", output: "true", explanation: "7 is only divisible by 1 and 7." },
      { input: "n = 12", output: "false", explanation: "12 is divisible by 2, 3, 4, 6." }
    ]),
    test_cases: JSON.stringify([
      { id: 1, name: "Small Prime", input: [7], expected: true },
      { id: 2, name: "Small Composite", input: [12], expected: false },
      { id: 3, name: "Boundary: 1", input: [1], expected: false },
      { id: 4, name: "Boundary: 2 (Even Prime)", input: [2], expected: true },
      { id: 5, name: "Negative Number", input: [-7], expected: false }
    ]),
    is_custom: 0,
  }
];

quickStartProblems.forEach(seedProblemIfNotExists);

console.log("SQLite database ready:", databasePath);

module.exports = db;
