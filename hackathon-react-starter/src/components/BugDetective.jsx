import React, { useState } from 'react';

export default function BugDetective({
  findings = [],
  studentCode = '',
  onApplyCodeFix,
  onHighlightLine,
  functionName = null,
  isOutdated = false,
  onReanalyze,
}) {
  const [selectedBugId, setSelectedBugId] = useState(findings[0]?.id || null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'confirmed' | 'static_warning' | 'suspected_risk'
  const [reproduceState, setReproduceState] = useState({}); // { [id]: { isRunning, hasRun, passed, actual, expected, input, error } }
  const [diffPreviewId, setDiffPreviewId] = useState(null);
  const [fixState, setFixState] = useState({}); // { [id]: { isApplied, originalCode, fixedCode } }
  const [verifyState, setVerifyState] = useState({}); // { [id]: { isVerifying, result: 'fixed' | 'failing' | 'unverified', message, actual } }

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (activeFilter === 'all') return true;
    return f.kind === activeFilter;
  });

  const selectedBug = findings.find((f) => f.id === selectedBugId) || filteredFindings[0] || findings[0];

  // Count by kind
  const confirmedCount = findings.filter((f) => f.kind === 'confirmed').length;
  const staticCount = findings.filter((f) => f.kind === 'static_warning').length;
  const riskCount = findings.filter((f) => f.kind === 'suspected_risk').length;

  // 1. REPRODUCE BUG: Run minimal input via safe backend isolated runner
  async function handleReproduceBug(bug) {
    if (!bug) return;

    setReproduceState((prev) => ({
      ...prev,
      [bug.id]: { isRunning: true, hasRun: false },
    }));

    try {
      const inputArgs = bug.rawInput !== null && bug.rawInput !== undefined ? bug.rawInput : [];
      const testPayload = [
        {
          id: 1,
          name: bug.title,
          input: inputArgs,
          expected: bug.expectedOutput,
        },
      ];

      const res = await fetch('http://localhost:5000/api/solve/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: studentCode,
          functionName,
          testCases: testPayload,
        }),
      });

      const data = await res.json();

      if (data.success && data.tests && data.tests.length > 0) {
        const testResult = data.tests[0];
        setReproduceState((prev) => ({
          ...prev,
          [bug.id]: {
            isRunning: false,
            hasRun: true,
            passed: testResult.passed,
            actual: testResult.actual,
            expected: testResult.expected,
            input: JSON.stringify(testResult.input),
            error: null,
          },
        }));
      } else {
        // Fallback direct execution
        const directRes = await fetch('http://localhost:5000/api/code/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: studentCode }),
        });
        const directData = await directRes.json();
        setReproduceState((prev) => ({
          ...prev,
          [bug.id]: {
            isRunning: false,
            hasRun: true,
            passed: directData.success,
            actual: directData.result,
            expected: bug.expectedOutput,
            input: bug.concreteInput,
            error: directData.error || null,
          },
        }));
      }
    } catch (err) {
      setReproduceState((prev) => ({
        ...prev,
        [bug.id]: {
          isRunning: false,
          hasRun: true,
          passed: false,
          actual: 'Execution Error',
          expected: bug.expectedOutput,
          input: bug.concreteInput,
          error: err.message,
        },
      }));
    }
  }

  // 2. APPLY FIX: Safely replace targeted snippet in editor without overwriting unrelated code
  function handleApplyFix(bug) {
    if (!bug || !bug.suggestedFix || !onApplyCodeFix) return;

    const { originalSnippet, replacementSnippet } = bug.suggestedFix;
    const originalCode = studentCode;

    let patchedCode = studentCode;
    if (studentCode.includes(originalSnippet)) {
      patchedCode = studentCode.replace(originalSnippet, replacementSnippet);
    } else {
      // Line-based replacement fallback
      const lines = studentCode.split('\n');
      const targetIdx = bug.line - 1;
      if (targetIdx >= 0 && targetIdx < lines.length) {
        lines[targetIdx] = replacementSnippet;
        patchedCode = lines.join('\n');
      }
    }

    onApplyCodeFix(patchedCode);

    setFixState((prev) => ({
      ...prev,
      [bug.id]: {
        isApplied: true,
        originalCode,
        fixedCode: patchedCode,
      },
    }));

    // Reset verify state for fresh testing
    setVerifyState((prev) => ({
      ...prev,
      [bug.id]: null,
    }));
  }

  // 3. REVERT FIX: Restore original code if student wishes to undo
  function handleRevertFix(bug) {
    const saved = fixState[bug.id];
    if (saved && saved.originalCode && onApplyCodeFix) {
      onApplyCodeFix(saved.originalCode);
      setFixState((prev) => ({
        ...prev,
        [bug.id]: { isApplied: false },
      }));
      setVerifyState((prev) => ({
        ...prev,
        [bug.id]: null,
      }));
    }
  }

  // 4. VERIFY FIX: Re-run failing reproducible test on the patched code
  async function handleVerifyFix(bug) {
    if (!bug) return;

    setVerifyState((prev) => ({
      ...prev,
      [bug.id]: { isVerifying: true },
    }));

    try {
      const inputArgs = bug.rawInput !== null && bug.rawInput !== undefined ? bug.rawInput : [];
      const testPayload = [
        {
          id: 1,
          name: bug.title,
          input: inputArgs,
          expected: bug.expectedOutput,
        },
      ];

      const res = await fetch('http://localhost:5000/api/solve/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: studentCode,
          functionName,
          testCases: testPayload,
        }),
      });

      const data = await res.json();

      if (data.success && data.tests && data.tests.length > 0) {
        const testResult = data.tests[0];
        if (testResult.passed === true) {
          setVerifyState((prev) => ({
            ...prev,
            [bug.id]: {
              isVerifying: false,
              result: 'fixed',
              message: 'Fixed for this test! The reproduced test now passes with matching expected output.',
              actual: testResult.actual,
            },
          }));
        } else if (testResult.passed === false) {
          setVerifyState((prev) => ({
            ...prev,
            [bug.id]: {
              isVerifying: false,
              result: 'failing',
              message: `Still failing: Output ${JSON.stringify(testResult.actual)} does not match expected ${JSON.stringify(testResult.expected)}.`,
              actual: testResult.actual,
            },
          }));
        } else {
          setVerifyState((prev) => ({
            ...prev,
            [bug.id]: {
              isVerifying: false,
              result: 'unverified',
              message: 'Not verified: Test executed without defined expected value for conclusive comparison.',
              actual: testResult.actual,
            },
          }));
        }
      } else {
        setVerifyState((prev) => ({
          ...prev,
          [bug.id]: {
            isVerifying: false,
            result: 'failing',
            message: data.message || 'Execution failed during verification.',
          },
        }));
      }
    } catch (err) {
      setVerifyState((prev) => ({
        ...prev,
        [bug.id]: {
          isVerifying: false,
          result: 'unverified',
          message: `Verification check failed: ${err.message}`,
        },
      }));
    }
  }

  // Kind badge component
  function renderKindBadge(kind) {
    if (kind === 'confirmed') {
      return (
        <span className="badge-confirmed">
          <span className="material-symbols-outlined text-[12px]">verified</span>
          Confirmed Failure
        </span>
      );
    }
    if (kind === 'static_warning') {
      return (
        <span className="badge-static-warning">
          <span className="material-symbols-outlined text-[12px]">warning</span>
          Static Warning
        </span>
      );
    }
    return (
      <span className="badge-suspected-risk">
        <span className="material-symbols-outlined text-[12px]">help_outline</span>
        Suspected Risk
      </span>
    );
  }

  return (
    <div className="space-y-3">
      {/* Outdated Warning */}
      {isOutdated && (
        <div className="outdated-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined text-[16px]">update</span>
            <span>
              <strong>Code modified:</strong> Findings below reflect previous code.
            </span>
          </div>
          {onReanalyze && (
            <button
              type="button"
              className="btn-primary"
              onClick={onReanalyze}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              Refresh Findings
            </button>
          )}
        </div>
      )}

      {/* Top Filter & Summary Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 6,
          backgroundColor: 'var(--surface-low)',
          border: '1px solid var(--border-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
            bug_report
          </span>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
            Bug Detective
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
            ({findings.length} findings)
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className={activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveFilter('all')}
            style={{ fontSize: 10.5, padding: '2px 7px' }}
          >
            All ({findings.length})
          </button>
          {confirmedCount > 0 && (
            <button
              type="button"
              className={activeFilter === 'confirmed' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveFilter('confirmed')}
              style={{ fontSize: 10.5, padding: '2px 7px' }}
            >
              Confirmed ({confirmedCount})
            </button>
          )}
          {staticCount > 0 && (
            <button
              type="button"
              className={activeFilter === 'static_warning' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveFilter('static_warning')}
              style={{ fontSize: 10.5, padding: '2px 7px' }}
            >
              Static ({staticCount})
            </button>
          )}
          {riskCount > 0 && (
            <button
              type="button"
              className={activeFilter === 'suspected_risk' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveFilter('suspected_risk')}
              style={{ fontSize: 10.5, padding: '2px 7px' }}
            >
              Suspected ({riskCount})
            </button>
          )}
        </div>
      </div>

      {findings.length === 0 ? (
        /* Zero Bugs Clean State */
        <div
          className="card"
          style={{
            padding: 30,
            textAlign: 'center',
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success-border)',
          }}
        >
          <span className="material-symbols-outlined text-[36px]" style={{ color: 'var(--success)', display: 'block', marginBottom: 6 }}>
            check_circle
          </span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--success-text)', marginBottom: 2 }}>
            No Defects Detected
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--success-text)', maxWidth: 400, margin: '0 auto' }}>
            Static analysis and probe tests found no off-by-one loops, accidental assignments, tracker initialization errors, or operator inversions.
          </p>
        </div>
      ) : (
        /* Main Two-Column Workflow */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 12 }}>
          {/* Left: Findings List */}
          <div className="space-y-2" style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 2 }}>
            {filteredFindings.map((bug) => {
              const isSelected = selectedBug?.id === bug.id;
              const isApplied = fixState[bug.id]?.isApplied;
              const rep = reproduceState[bug.id];

              return (
                <div
                  key={bug.id}
                  onClick={() => {
                    setSelectedBugId(bug.id);
                    if (onHighlightLine && bug.line) {
                      onHighlightLine({ startLine: bug.line, endLine: bug.line, type: 'bug' });
                    }
                  }}
                  className="card"
                  style={{
                    padding: 10,
                    cursor: 'pointer',
                    borderRadius: 8,
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-card)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                    {renderKindBadge(bug.kind)}
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                      L{bug.line}{bug.column ? `:${bug.column}` : ''}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                    {bug.title}
                  </h4>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      backgroundColor: 'var(--editor-bg)',
                      color: 'var(--editor-text)',
                      padding: '3px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 6,
                    }}
                  >
                    {bug.expression}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-subtle)' }}>
                      Severity: <strong>{bug.severity}</strong>
                    </span>

                    {isApplied && (
                      <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', fontSize: 9.5, fontWeight: 700 }}>
                        Fix Applied
                      </span>
                    )}
                    {rep?.hasRun && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: rep.passed ? 'var(--success-bg)' : 'var(--error-bg)',
                          color: rep.passed ? 'var(--success-text)' : 'var(--error-text)',
                          fontSize: 9.5,
                          fontWeight: 700,
                        }}
                      >
                        {rep.passed ? 'Passed' : 'Failed'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Bug 6-Step Consistent Inspection Format */}
          {selectedBug && (
            <div
              className="card"
              style={{
                padding: 14,
                maxHeight: 520,
                overflowY: 'auto',
                border: '1px solid var(--border-card)',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* (1) ISSUE: Title, Kind Badge, Severity */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {renderKindBadge(selectedBug.kind)}
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                      {selectedBug.confidence}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedBug.title}
                  </h3>
                </div>

                {/* (2) RELEVANT SOURCE LINE */}
                {onHighlightLine && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onHighlightLine({ startLine: selectedBug.line, endLine: selectedBug.line, type: 'bug' })}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    <span className="material-symbols-outlined text-[13px]">my_location</span>
                    <span>Line {selectedBug.line} in Editor</span>
                  </button>
                )}
              </div>

              {/* (3) WHY IT MATTERS */}
              <div style={{ padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-low)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 2 }}>
                  Why This Matters
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.45 }}>
                  {selectedBug.whyIncorrect || selectedBug.whatCodeDoes}
                </div>
              </div>

              {/* (4) EVIDENCE OR REPRODUCTION */}
              <div
                style={{
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: 'var(--surface-low)',
                  border: '1px solid var(--border-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                    Evidence &amp; Reproduction
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleReproduceBug(selectedBug)}
                    disabled={reproduceState[selectedBug.id]?.isRunning}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    <span className={`material-symbols-outlined text-[13px] ${reproduceState[selectedBug.id]?.isRunning ? 'animate-spin' : ''}`}>
                      {reproduceState[selectedBug.id]?.isRunning ? 'sync' : 'play_arrow'}
                    </span>
                    <span>{reproduceState[selectedBug.id]?.isRunning ? 'Executing...' : 'Reproduce in Sandbox'}</span>
                  </button>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Concrete Input: <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedBug.concreteInput}</code>
                </div>

                {/* Reproduction Execution Results */}
                {reproduceState[selectedBug.id]?.hasRun && (
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 4,
                      backgroundColor: reproduceState[selectedBug.id].passed ? 'var(--success-bg)' : 'var(--error-bg)',
                      border: `1px solid ${reproduceState[selectedBug.id].passed ? 'var(--success-border)' : 'var(--error-border)'}`,
                      fontSize: 11.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 2 }}>
                      <span style={{ color: reproduceState[selectedBug.id].passed ? 'var(--success-text)' : 'var(--error-text)' }}>
                        {reproduceState[selectedBug.id].passed ? 'Test Passed' : 'Confirmed Defect: Output Mismatch'}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#334155' }}>
                      <div>Observed: <strong>{JSON.stringify(reproduceState[selectedBug.id].actual)}</strong></div>
                      <div>Expected: <strong>{JSON.stringify(reproduceState[selectedBug.id].expected)}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* (5) SUGGESTED FIX & DIFF PREVIEW */}
              {selectedBug.suggestedFix ? (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: 'var(--surface-low)',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                      Suggested Fix &amp; Diff Preview
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setDiffPreviewId(diffPreviewId === selectedBug.id ? null : selectedBug.id)}
                      style={{ fontSize: 10.5, padding: '2px 6px' }}
                    >
                      <span>{diffPreviewId === selectedBug.id ? 'Hide Diff' : 'Toggle Diff'}</span>
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-main)', marginBottom: 6 }}>
                    {selectedBug.suggestedFix.explanation}
                  </p>

                  {/* Diff View Box */}
                  <div className="diff-box">
                    <div className="diff-line-removed">
                      <span>-</span>
                      <span>{selectedBug.suggestedFix.originalSnippet}</span>
                    </div>
                    <div className="diff-line-added">
                      <span>+</span>
                      <span>{selectedBug.suggestedFix.replacementSnippet}</span>
                    </div>
                  </div>

                  {/* Actions: Apply Fix vs Revert */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {!fixState[selectedBug.id]?.isApplied ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleApplyFix(selectedBug)}
                        style={{ fontSize: 11.5, padding: '4px 10px' }}
                      >
                        <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                        <span>Apply Fix into Editor</span>
                      </button>
                    ) : (
                      <>
                        <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', fontSize: 10.5, fontWeight: 700 }}>
                          Fix Applied to Editor
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleRevertFix(selectedBug)}
                          style={{ fontSize: 11, padding: '3px 8px' }}
                        >
                          Revert Changes
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {/* (6) TEST AGAIN (VERIFY FIX) */}
              {fixState[selectedBug.id]?.isApplied && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: 'var(--surface-low)',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                      Test Again &amp; Verify Fix
                    </div>
                    <button
                      type="button"
                      className="btn-run"
                      onClick={() => handleVerifyFix(selectedBug)}
                      disabled={verifyState[selectedBug.id]?.isVerifying}
                      style={{ fontSize: 11, padding: '3px 10px' }}
                    >
                      <span className={`material-symbols-outlined text-[13px] ${verifyState[selectedBug.id]?.isVerifying ? 'animate-spin' : ''}`}>
                        {verifyState[selectedBug.id]?.isVerifying ? 'sync' : 'check'}
                      </span>
                      <span>{verifyState[selectedBug.id]?.isVerifying ? 'Testing...' : 'Test Again'}</span>
                    </button>
                  </div>

                  {verifyState[selectedBug.id] && (
                    <div
                      style={{
                        padding: 8,
                        borderRadius: 4,
                        backgroundColor:
                          verifyState[selectedBug.id].result === 'fixed'
                            ? 'var(--success-bg)'
                            : verifyState[selectedBug.id].result === 'failing'
                            ? 'var(--error-bg)'
                            : 'var(--warning-bg)',
                        border: `1px solid ${
                          verifyState[selectedBug.id].result === 'fixed'
                            ? 'var(--success-border)'
                            : verifyState[selectedBug.id].result === 'failing'
                            ? 'var(--error-border)'
                            : 'var(--warning-border)'
                        }`,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        {verifyState[selectedBug.id].result === 'fixed' && (
                          <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            Fixed for this test!
                          </span>
                        )}
                        {verifyState[selectedBug.id].result === 'failing' && (
                          <span style={{ color: 'var(--error-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="material-symbols-outlined text-[15px]">cancel</span>
                            Still failing
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-main)', fontSize: 11.5 }}>
                        {verifyState[selectedBug.id].message}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Educational Details (Available on Demand) */}
              <details
                style={{
                  border: '1px solid var(--border-card)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11.5,
                  backgroundColor: '#ffffff',
                }}
              >
                <summary style={{ fontWeight: 600, color: 'var(--text-subtle)', cursor: 'pointer' }}>
                  Educational CS Concept &amp; Root Cause Trace
                </summary>
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <strong style={{ color: 'var(--text-main)' }}>Concept:</strong> {selectedBug.conceptExplanation}
                  </div>
                  {selectedBug.chainOfCause && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                      {selectedBug.chainOfCause}
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
