import React, { useState } from 'react';

export default function TestCaseManager({
  testCases = [],
  onUpdateTestCases,
  onGenerateTests,
  isGenerating,
  runResults,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInput, setNewInput] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [newCategory, setNewCategory] = useState('custom');

  // Match test result by ID or index
  function getResultForTest(tc, idx) {
    if (!runResults || !runResults.tests) return null;
    return runResults.tests.find((t) => t.id === tc.id) || runResults.tests[idx];
  }

  function handleAddTest(e) {
    e.preventDefault();
    if (!newInput.trim()) {
      alert('Please specify input arguments in JSON format.');
      return;
    }

    let parsedInput = newInput.trim();
    let parsedExpected = newExpected.trim();

    try {
      parsedInput = JSON.parse(newInput);
    } catch (err) {
      alert(`Invalid JSON in Input: ${err.message}. Example: [1, 2, 3] or 42`);
      return;
    }

    if (newExpected.trim() !== '') {
      try {
        parsedExpected = JSON.parse(newExpected);
      } catch (err) {
        // If not valid JSON, treat as raw string
        parsedExpected = newExpected.trim();
      }
    } else {
      parsedExpected = undefined;
    }

    const newTest = {
      id: Date.now(),
      name: newName.trim() || `Custom Test ${testCases.length + 1}`,
      input: Array.isArray(parsedInput) ? parsedInput : [parsedInput],
      expected: parsedExpected,
      category: newCategory,
    };

    onUpdateTestCases([...testCases, newTest]);
    setIsAdding(false);
    setNewName('');
    setNewInput('');
    setNewExpected('');
  }

  function handleDeleteTest(testId) {
    onUpdateTestCases(testCases.filter((t) => t.id !== testId));
  }

  function handleFieldChange(testId, field, value) {
    onUpdateTestCases(
      testCases.map((t) => {
        if (t.id === testId) {
          if (field === 'input' || field === 'expected') {
            try {
              const parsed = JSON.parse(value);
              return { ...t, [field]: parsed };
            } catch (e) {
              return { ...t, [field]: value };
            }
          }
          return { ...t, [field]: value };
        }
        return t;
      })
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
            checklist
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
            Test Benches ({testCases.length})
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
            Editable candidate suites (normal, boundary & edge)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onGenerateTests}
            disabled={isGenerating}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>{isGenerating ? 'Generating Tests...' : 'Auto-Generate Tests'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAdding(!isAdding)}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <span className="material-symbols-outlined text-[16px]">{isAdding ? 'close' : 'add'}</span>
            <span>{isAdding ? 'Cancel' : 'Add Test Case'}</span>
          </button>
        </div>
      </div>

      {/* Inline Test Case Adder */}
      {isAdding && (
        <form
          onSubmit={handleAddTest}
          style={{
            backgroundColor: 'var(--surface-low)',
            border: '1px solid var(--border-card)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              New Test Case Definition
            </span>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="normal">Normal Case</option>
              <option value="boundary">Boundary Case</option>
              <option value="edge">Edge Case</option>
              <option value="custom">Custom Case</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.5fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 2 }}>
                Test Name
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                placeholder="e.g. Negative Values"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 2 }}>
                Input Args (JSON Array) *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. [[1, 2, 3]] or [5, 7]"
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 2 }}>
                Expected Output (JSON)
              </label>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. 12 or [3, 2, 1]"
                value={newExpected}
                onChange={(e) => setNewExpected(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAdding(false)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              Save Test Case
            </button>
          </div>
        </form>
      )}

      {/* Test Cases List */}
      {testCases.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
          No test cases configured yet. Click "Auto-Generate Tests" or "+ Add Test Case" to specify inputs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {testCases.map((tc, idx) => {
            const res = getResultForTest(tc, idx);
            const isPassed = res ? res.passed : null;

            return (
              <div
                key={tc.id || idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: 'var(--surface-low)',
                  border: isPassed === true ? '1px solid #a7f3d0' : isPassed === false ? '1px solid #fecaca' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      #{idx + 1} {tc.name}
                    </span>
                    {tc.isSuggested && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                        }}
                      >
                        Suggested
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor:
                          tc.category === 'edge' ? '#fee2e2' :
                          tc.category === 'boundary' ? '#fef3c7' :
                          '#ede9fe',
                        color:
                          tc.category === 'edge' ? '#991b1b' :
                          tc.category === 'boundary' ? '#92400e' :
                          '#5b21b6',
                      }}
                    >
                      {tc.category || 'test'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-subtle)' }}>Input:</strong> {JSON.stringify(tc.input)}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-subtle)' }}>Expected:</strong>{' '}
                      {tc.expected !== undefined && tc.expected !== null && tc.expected !== '' ? (
                        JSON.stringify(tc.expected)
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None (Inspect Output)</span>
                      )}
                    </div>
                    {res && (
                      <div>
                        <strong style={{ color: res.status === 'PASSED' ? '#059669' : res.status === 'FAILED' ? '#dc2626' : '#2563eb' }}>
                          Actual:
                        </strong>{' '}
                        {JSON.stringify(res.actual)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {res && (
                    <span
                      className={`badge ${
                        res.status === 'PASSED'
                          ? 'badge-easy'
                          : res.status === 'FAILED'
                          ? 'badge-hard'
                          : 'badge-tag'
                      }`}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        backgroundColor: res.status === 'EXECUTED' ? '#f1f5f9' : undefined,
                        color: res.status === 'EXECUTED' ? '#334155' : undefined,
                        border: res.status === 'EXECUTED' ? '1px solid #cbd5e1' : undefined,
                      }}
                    >
                      {res.status === 'EXECUTED' ? 'Executed' : res.status === 'PASSED' ? 'Passed' : 'Failed'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTest(tc.id)}
                    title="Delete Test Case"
                    style={{ background: 'transparent', color: '#94a3b8', display: 'flex' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
