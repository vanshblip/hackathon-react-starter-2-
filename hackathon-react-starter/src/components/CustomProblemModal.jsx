import React, { useState } from 'react';

const QUICK_STARTS = [
  {
    title: 'Reverse an Array',
    category: 'Arrays & Pointers',
    functionName: 'reverseArray',
    description: 'Given an array of integers nums, reverse the array in place or return a new array with the elements in reverse order.',
    inputFormat: 'nums: Array of integers',
    outputFormat: 'Array of integers in reversed order',
    constraints: '0 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9',
    sampleInput: '[1, 2, 3, 4, 5]',
    sampleOutput: '[5, 4, 3, 2, 1]',
    starterCode: `function reverseArray(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n  const result = [...nums];\n  while (left < right) {\n    const temp = result[left];\n    result[left] = result[right];\n    result[right] = temp;\n    left++;\n    right--;\n  }\n  return result;\n}`,
    alternativeCode: `function reverseArray(nums) {\n  return nums && Array.isArray(nums) ? [...nums].reverse() : [];\n}`,
    testCases: [
      { id: 1, name: 'General Array', input: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], category: 'normal' },
      { id: 2, name: 'Even Length', input: [[10, 20]], expected: [20, 10], category: 'normal' },
      { id: 3, name: 'Single Element', input: [[42]], expected: [42], category: 'boundary' },
      { id: 4, name: 'Empty Array', input: [[]], expected: [], category: 'edge' },
      { id: 5, name: 'Negative Numbers', input: [[-1, -2, -3]], expected: [-3, -2, -1], category: 'edge' },
    ],
  },
  {
    title: 'Add Two Numbers',
    category: 'Math & Basics',
    functionName: 'addTwoNumbers',
    description: 'Given two numbers a and b, compute and return their arithmetic sum.',
    inputFormat: 'a: number, b: number',
    outputFormat: 'number: arithmetic sum',
    constraints: '-10^9 <= a, b <= 10^9',
    sampleInput: '5, 7',
    sampleOutput: '12',
    starterCode: `function addTwoNumbers(a, b) {\n  return a + b;\n}`,
    alternativeCode: `function addTwoNumbers(a, b) {\n  let x = a, y = b;\n  while (y !== 0) {\n    let carry = x & y;\n    x = x ^ y;\n    y = carry << 1;\n  }\n  return x;\n}`,
    testCases: [
      { id: 1, name: 'Positive Numbers', input: [5, 7], expected: 12, category: 'normal' },
      { id: 2, name: 'Negative Numbers', input: [-3, -8], expected: -11, category: 'normal' },
      { id: 3, name: 'With Zero', input: [0, 42], expected: 42, category: 'boundary' },
      { id: 4, name: 'Opposite Signs', input: [15, -5], expected: 10, category: 'edge' },
    ],
  },
  {
    title: 'Find the Second Largest Element',
    category: 'Arrays & Invariants',
    functionName: 'findSecondLargest',
    description: 'Given an array of integers nums, find the second distinct largest element in the array. If no second largest distinct element exists, return null.',
    inputFormat: 'nums: Array of integers',
    outputFormat: 'Second distinct largest integer, or null if none exists',
    constraints: '1 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9',
    sampleInput: '[12, 35, 1, 10, 34, 1]',
    sampleOutput: '34',
    starterCode: `function findSecondLargest(nums) {\n  if (!nums || nums.length < 2) return null;\n  let first = -Infinity;\n  let second = -Infinity;\n  for (let num of nums) {\n    if (num > first) {\n      second = first;\n      first = num;\n    } else if (num > second && num < first) {\n      second = num;\n    }\n  }\n  return second === -Infinity ? null : second;\n}`,
    alternativeCode: `function findSecondLargest(nums) {\n  if (!nums || nums.length < 2) return null;\n  const uniqueSorted = Array.from(new Set(nums)).sort((a, b) => b - a);\n  return uniqueSorted.length >= 2 ? uniqueSorted[1] : null;\n}`,
    testCases: [
      { id: 1, name: 'Standard Array', input: [[12, 35, 1, 10, 34, 1]], expected: 34, category: 'normal' },
      { id: 2, name: 'All Equal Trap', input: [[10, 10, 10]], expected: null, category: 'edge' },
      { id: 3, name: 'Two Elements', input: [[5, 2]], expected: 2, category: 'boundary' },
      { id: 4, name: 'Negative Values', input: [[-10, -5, -2, -1]], expected: -2, category: 'edge' },
    ],
  },
  {
    title: 'Check Prime Number',
    category: 'Math & Number Theory',
    functionName: 'isPrime',
    description: 'Given an integer n, determine whether n is a prime number (greater than 1 and having no positive divisors other than 1 and itself).',
    inputFormat: 'n: integer',
    outputFormat: 'boolean: true if n is prime, false otherwise',
    constraints: '-10^9 <= n <= 10^9',
    sampleInput: '7',
    sampleOutput: 'true',
    starterCode: `function isPrime(n) {\n  if (n <= 1) return false;\n  for (let i = 2; i < n; i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}`,
    alternativeCode: `function isPrime(n) {\n  if (n <= 1) return false;\n  if (n <= 3) return true;\n  if (n % 2 === 0 || n % 3 === 0) return false;\n  for (let i = 5; i * i <= n; i += 6) {\n    if (n % i === 0 || n % (i + 2) === 0) return false;\n  }\n  return true;\n}`,
    testCases: [
      { id: 1, name: 'Small Prime', input: [7], expected: true, category: 'normal' },
      { id: 2, name: 'Small Composite', input: [12], expected: false, category: 'normal' },
      { id: 3, name: 'Boundary: 1', input: [1], expected: false, category: 'boundary' },
      { id: 4, name: 'Boundary: 2 (Even Prime)', input: [2], expected: true, category: 'boundary' },
      { id: 5, name: 'Negative Number', input: [-7], expected: false, category: 'edge' },
    ],
  },
];

export default function CustomProblemModal({ isOpen, onClose, onCreateCustomProblem }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [category, setCategory] = useState('Custom Problem');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [alternativeCode, setAlternativeCode] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  function handleSelectQuickStart(qs) {
    setTitle(qs.title);
    setDescription(qs.description);
    setFunctionName(qs.functionName);
    setCategory(qs.category);
    setInputFormat(qs.inputFormat);
    setOutputFormat(qs.outputFormat);
    setConstraints(qs.constraints);
    setSampleInput(qs.sampleInput);
    setSampleOutput(qs.sampleOutput);
    setStarterCode(qs.starterCode);
    setAlternativeCode(qs.alternativeCode || '');
    setTestCases(qs.testCases || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please provide both a Problem Title and a Problem Statement.');
      return;
    }

    setSubmitting(true);

    const fnName = (functionName.trim() || 'solution').replace(/[^a-zA-Z0-9_$]/g, '');

    // Parse sample input/output into test case if available and no test cases exist
    let initialTests = testCases;
    if (initialTests.length === 0 && sampleInput.trim()) {
      let parsedInput = sampleInput.trim();
      let parsedExpected = sampleOutput.trim();
      try { parsedInput = JSON.parse(sampleInput); } catch (e) {}
      try { parsedExpected = JSON.parse(sampleOutput); } catch (e) {}

      initialTests = [
        {
          id: 1,
          name: 'Sample Example Test',
          input: Array.isArray(parsedInput) ? parsedInput : [parsedInput],
          expected: parsedExpected,
          category: 'normal',
        },
      ];
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      functionName: fnName,
      difficulty,
      category: category.trim() || 'Custom Problem',
      inputFormat: inputFormat.trim() || 'Standard Arguments',
      outputFormat: outputFormat.trim() || 'Return Value',
      constraints: constraints ? constraints.split(',').map((c) => c.trim()).filter(Boolean) : [],
      examples: sampleInput ? [{ input: sampleInput, output: sampleOutput, explanation: 'Sample demonstration' }] : [],
      testCases: initialTests,
      starterCode: starterCode.trim() || `function ${fnName}(input) {\n  // Write your custom algorithm here\n  return input;\n}`,
      alternativeCode: alternativeCode.trim() || '',
    };

    try {
      await onCreateCustomProblem(payload);
      onClose();
    } catch (err) {
      alert(`Could not create problem: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'var(--primary-dark)',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>
                Create Your Own Problem
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                Define a custom problem statement, test cases, and analyze your solution.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-subtle)' }}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Quick-Start Suggestions */}
        <div style={{ marginBottom: 20, padding: 14, backgroundColor: 'var(--surface-low)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase' }}>
            ⚡ Or Quick-Start with a Pre-configured Template:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_STARTS.map((qs, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectQuickStart(qs)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = '#faf5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--primary)' }}>
                  bolt
                </span>
                <span>{qs.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Supported Language Banner */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#ede9fe',
            border: '1px solid #c4b5fd',
            fontSize: 12,
            color: '#5b21b6',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>
            <strong>Execution Engine:</strong> CodeLens currently supports pure algorithmic <strong>JavaScript (ES6+)</strong> in isolated out-of-process worker sandboxes.
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title & Difficulty */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Problem Title *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="e.g. Reverse an Array"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Difficulty
              </label>
              <select
                className="search-input"
                style={{ width: '100%', padding: '9px 12px' }}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
              Problem Statement / Description *
            </label>
            <textarea
              className="search-input"
              style={{ width: '100%', padding: 12, minHeight: 90, fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="State the problem clearly, describing expected input parameters, transformations, and return values..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Function Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Function Name (Optional)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px', fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. reverseArray or solution"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Category / Topic (Optional)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="e.g. Arrays, Strings, Math"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Input Format & Output Format */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Input Format (Optional)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="e.g. nums: Array of numbers"
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Output Format (Optional)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px' }}
                placeholder="e.g. Reversed array of numbers"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              />
            </div>
          </div>

          {/* Constraints */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
              Constraints (Optional, comma-separated)
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', padding: '9px 12px' }}
              placeholder="e.g. 1 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
            />
          </div>

          {/* Sample Input & Expected Output */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Sample Input Arguments (JSON format)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px', fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. [1, 2, 3, 4, 5]"
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Sample Expected Output (JSON format)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '9px 12px', fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. [5, 4, 3, 2, 1]"
                value={sampleOutput}
                onChange={(e) => setSampleOutput(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span>{submitting ? 'Creating Problem...' : 'Create & Open in Studio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
