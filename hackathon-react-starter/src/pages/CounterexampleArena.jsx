import React from 'react';

export default function CounterexampleArena({
  problem,
  studentCode,
  alternativeCode,
  onChallenge,
  challengeResult,
  isChallenging,
  onNavigate,
}) {
  return (
    <div className="space-y-5">
      {/* Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="breadcrumbs">
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Counterexample Arena</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 1 }}>
            Counterexample Arena
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Fuzz both implementations side-by-side in isolated worker sandboxes to identify discrepancies and boundary failures.
          </p>
        </div>

        {/* Primary Action Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('solution-studio')}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Edit Test Cases in Studio</span>
          </button>

          <button
            className="btn-primary"
            onClick={() => onChallenge()}
            disabled={isChallenging}
          >
            <span className={`material-symbols-outlined text-[16px] ${isChallenging ? 'animate-spin' : ''}`}>
              {isChallenging ? 'sync' : 'gpp_maybe'}
            </span>
            <span>{isChallenging ? 'Fuzzing Solutions...' : 'Run Arena Challenge'}</span>
          </button>
        </div>
      </div>

      {/* Test Execution Telemetry Banner */}
      {challengeResult && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Total Executed Tests
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
              {challengeResult.totalTested}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Child-process sandbox</div>
          </div>

          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
              Student Solution
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
              {challengeResult.studentPassed} / {challengeResult.totalTested}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Tests passed</div>
          </div>

          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              Alternative Solution
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
              {challengeResult.alternativePassed} / {challengeResult.totalTested}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Tests passed</div>
          </div>

          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: challengeResult.hasCounterexample ? 'var(--error)' : 'var(--success)', textTransform: 'uppercase' }}>
              Confirmed Discrepancies
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: challengeResult.hasCounterexample ? 'var(--error)' : 'var(--success)', marginTop: 2 }}>
              {challengeResult.hasCounterexample ? '1 Detected' : '0 (None)'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Fuzzing verdict</div>
          </div>
        </div>
      )}

      {/* Side-by-Side Solution Codes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Student Solution Card */}
        <div className="card" style={{ borderLeft: '3px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#0284c7' }}>terminal</span>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-main)' }}>Your Solution</h3>
            </div>
            <span className="badge badge-tag">Student Code</span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, backgroundColor: 'var(--editor-bg)', color: 'var(--editor-text)', padding: 10, borderRadius: 6, maxHeight: 180, overflowY: 'auto' }}>
            <pre style={{ margin: 0 }}><code>{studentCode}</code></pre>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>Execution Status:</span>
            <span style={{ fontWeight: 700, fontSize: 12, color: challengeResult ? (challengeResult.studentPassed === challengeResult.totalTested ? 'var(--success-text)' : 'var(--error)') : 'var(--text-muted)' }}>
              {challengeResult ? `${challengeResult.studentPassed} / ${challengeResult.totalTested} Passed` : 'Pending execution'}
            </span>
          </div>
        </div>

        {/* Alternative Solution Card */}
        <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>auto_awesome</span>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-main)' }}>Alternative Solution</h3>
            </div>
            <span className="badge badge-tag">Reference Oracle</span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, backgroundColor: 'var(--editor-bg)', color: 'var(--editor-text)', padding: 10, borderRadius: 6, maxHeight: 180, overflowY: 'auto' }}>
            <pre style={{ margin: 0 }}><code>{alternativeCode || problem?.alternativeCode || '// No alternative solution entered'}</code></pre>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>Execution Status:</span>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--success-text)' }}>
              {challengeResult ? `${challengeResult.alternativePassed} / ${challengeResult.totalTested} Passed` : 'Pending execution'}
            </span>
          </div>
        </div>
      </div>

      {/* Discrepancy Findings Banner */}
      {challengeResult && challengeResult.hasCounterexample && challengeResult.counterexample ? (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--error)', marginBottom: 8 }}>
            <span className="material-symbols-outlined text-[20px]">bug_report</span>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              Confirmed Discrepancy: {challengeResult.counterexample.name}
            </h3>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--error-text)', marginBottom: 12, lineHeight: 1.5 }}>
            {challengeResult.counterexample.explanation}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              gap: 12,
              backgroundColor: '#ffffff',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--error-border)',
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                Failing Test Input
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                {challengeResult.counterexample.input}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase' }}>
                Your Output
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--error)', marginTop: 2 }}>
                {JSON.stringify(challengeResult.counterexample.studentOutput)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
                Alternative Output
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>
                {JSON.stringify(
                  challengeResult.counterexample.expected !== undefined
                    ? challengeResult.counterexample.expected
                    : challengeResult.counterexample.alternativeOutput
                )}
              </div>
            </div>
          </div>
        </div>
      ) : challengeResult && !challengeResult.hasCounterexample ? (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
            <span className="material-symbols-outlined text-[20px]">verified</span>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              No Discrepancies Observed
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--success-text)', marginTop: 4 }}>
            Both implementations produced compatible results on all {challengeResult.totalTested} executed test benches.
          </p>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px 18px', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--primary)', marginBottom: 6 }}>
            security
          </span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
            Ready to Challenge Solutions in Isolated Sandbox
          </h3>
          <p style={{ fontSize: 12.5, maxWidth: 500, margin: '0 auto 14px' }}>
            Runs both implementations in separate worker processes against the configured test suite. Concrete discrepancies between implementations or against expected outputs will be reported.
          </p>
          <button
            className="btn-primary"
            onClick={() => onChallenge()}
            disabled={isChallenging}
          >
            Launch Challenge
          </button>
        </div>
      )}
    </div>
  );
}
