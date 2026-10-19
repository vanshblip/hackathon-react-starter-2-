import React from 'react';

export default function Home({ onNavigate, onSelectProblem, problems = [] }) {
  return (
    <div className="space-y-6">
      {/* 1. Hero Banner: Clean, Authoritative, Developer-Focused */}
      <div className="hero-banner">
        <div>
          <div className="hero-pill">
            <span className="material-symbols-outlined text-[15px]">code_blocks</span>
            <span>Developer Learning &amp; Analysis Platform</span>
          </div>

          <h1 className="hero-title">
            Understand your code.<br />
            Inspect structure, complexity, and defects.
          </h1>

          <p className="hero-subtitle">
            Write or paste arbitrary JavaScript to inspect real-time AST structure, evaluate time and space complexity, detect boundary bugs with reproducible test inputs, and verify fixes in an isolated sandbox.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => onNavigate('solution-studio')}
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Open Solution Studio</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => onNavigate('syntax-tree')}
            >
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              <span>Explore Code Structure</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => onNavigate('break-and-run')}
            >
              <span className="material-symbols-outlined text-[18px]">pest_control</span>
              <span>Play Bug Hunt</span>
            </button>
          </div>
        </div>

        {/* Right: Real Engine Capabilities Card */}
        <div>
          <div className="card" style={{ backgroundColor: 'var(--surface-low)', borderColor: 'var(--border-card)', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', letterSpacing: '0.04em' }}>
                System Architecture
              </span>
              <span className="badge badge-tag" style={{ fontSize: 10 }}>
                ES2022 Engine
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)', marginTop: 1 }}>
                  account_tree
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-main)' }}>
                    Acorn AST Structure Explorer
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Hierarchical syntax breakdown with source coordinate synchronization.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#059669', marginTop: 1 }}>
                  speed
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-main)' }}>
                    Deterministic Complexity Analyzer
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Nested loop invariants O(1) through O(N³), sequential loop separation, and memory profiling.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#d97706', marginTop: 1 }}>
                  bug_report
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-main)' }}>
                    Bug Detective &amp; Fix Studio
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Confirmed failures vs static warnings, diff preview, and one-click test verification.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#2563eb', marginTop: 1 }}>
                  security
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-main)' }}>
                    Isolated Process Sandbox
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Out-of-process execution with 1500ms safety timeout and console log interception.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Workbenches & Exploration Tools */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>Core Workbenches</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>Dedicated tools for analyzing, testing, and understanding programs</p>
          </div>
        </div>

        <div className="features-grid">
          {/* Card 1: Solution Studio */}
          <div className="feature-card" onClick={() => onNavigate('solution-studio')}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="feature-icon-box" style={{ backgroundColor: '#eef2ff', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined text-[22px]">code</span>
                </div>
                <span className="badge badge-tag">Primary Workbench</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Solution Studio</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Write code with Monaco Editor, run with live console output, and analyze complexity and bugs instantly.
              </p>
            </div>
            <div className="feature-footer-action">
              <span>Code-First Workspace</span>
              <span>Open Studio &rarr;</span>
            </div>
          </div>

          {/* Card 2: Structure Explorer */}
          <div className="feature-card" onClick={() => onNavigate('syntax-tree')}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="feature-icon-box" style={{ backgroundColor: '#f0fdf4', color: '#059669' }}>
                  <span className="material-symbols-outlined text-[22px]">account_tree</span>
                </div>
                <span className="badge badge-tag">AST Inspector</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Structure Explorer</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Inspect the genuine Abstract Syntax Tree, examine node roles, and navigate synchronized source lines.
              </p>
            </div>
            <div className="feature-footer-action">
              <span>Live Tree View</span>
              <span>View Structure &rarr;</span>
            </div>
          </div>

          {/* Card 3: Counterexample Arena */}
          <div className="feature-card" onClick={() => onNavigate('counterexample-arena')}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="feature-icon-box" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
                  <span className="material-symbols-outlined text-[22px]">gpp_maybe</span>
                </div>
                <span className="badge badge-tag">Discrepancy Fuzzing</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Counterexample Arena</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Fuzz student and alternative implementations side-by-side to discover boundary condition failures.
              </p>
            </div>
            <div className="feature-footer-action">
              <span>Automated Testing</span>
              <span>Enter Arena &rarr;</span>
            </div>
          </div>

          {/* Card 4: Solution Comparison */}
          <div className="feature-card" onClick={() => onNavigate('solution-comparison')}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="feature-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <span className="material-symbols-outlined text-[22px]">compare_arrows</span>
                </div>
                <span className="badge badge-tag">Side-by-Side</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Solution Comparison</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Compare your algorithm against alternative patterns: time complexity, auxiliary space, and code density.
              </p>
            </div>
            <div className="feature-footer-action">
              <span>Asymptotic Matrix</span>
              <span>Compare &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Curriculum Labs & Quick-Start Problem Sets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 20, marginTop: 12 }}>
        {/* Left: Example Problem Library */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>Curriculum Labs &amp; Examples</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>Preset algorithmic problems ready for immediate analysis and experimentation</p>
            </div>
            <button
              onClick={() => onNavigate('solution-studio')}
              style={{ background: 'transparent', color: 'var(--primary)', fontWeight: 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>Custom Problem in Studio</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {problems.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--surface-low)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {p.id.toUpperCase()}
                    </span>
                    <span className={`badge ${p.difficulty === 'Easy' ? 'badge-easy' : p.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
                      {p.difficulty || 'Normal'}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                      {p.testCases ? `${p.testCases.length} Test Benches` : 'Algorithmic Problem'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      onSelectProblem(p.id);
                      onNavigate('solution-studio');
                    }}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    <span>Load in Studio</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Persisted Attempts & System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>Platform Summary</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>Runtime engine status and persisted history</p>
          </div>

          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#059669', marginTop: 2 }}>
                check_circle
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>Execution Sandbox Online</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 1 }}>Node.js isolated process with stdout/stderr capture</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)', marginTop: 2 }}>
                storage
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>SQLite Database Active</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 1 }}>Attempts, versions, and test verdicts preserved locally</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#d97706', marginTop: 2 }}>
                analytics
              </span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>Structural Complexity Engine</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 1 }}>Deterministic loop nesting &amp; space classification</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 12, marginTop: 4 }}>
              <button
                className="btn-secondary"
                onClick={() => onNavigate('my-attempts')}
                style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>View Saved Attempts &amp; History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
