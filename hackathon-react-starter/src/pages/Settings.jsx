import React, { useState } from 'react';

export default function Settings({ onNavigate, showToast }) {
  const [backendHealth, setBackendHealth] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);

  function testConnection() {
    setTestingHealth(true);
    fetch('http://localhost:5000/api/health')
      .then((r) => r.json())
      .then((data) => {
        setBackendHealth(data);
        showToast('Backend connection verified successfully.');
      })
      .catch((err) => {
        setBackendHealth({ success: false, error: err.message });
        showToast('Could not reach backend.');
      })
      .finally(() => setTestingHealth(false));
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="breadcrumbs">
          <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Settings</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Settings & Environment
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>
          Manage AI providers, execution sandbox parameters, and verify backend database connectivity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Backend & Database Health */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              Backend & Database Connection
            </h3>
            <span className="badge badge-easy">Port 5000</span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            CodeLens Express backend is connected to SQLite at <code style={{ fontFamily: 'var(--font-mono)' }}>server/data/hackathon.db</code>.
          </p>

          <button
            className="btn-primary"
            onClick={testConnection}
            disabled={testingHealth}
          >
            <span className="material-symbols-outlined text-[18px]">electrical_services</span>
            <span>{testingHealth ? 'Testing...' : 'Test Backend Connection'}</span>
          </button>

          {backendHealth && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                backgroundColor: backendHealth.success ? '#ecfdf5' : '#fee2e2',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: backendHealth.success ? '#065f46' : '#991b1b',
              }}
            >
              <pre style={{ margin: 0 }}><code>{JSON.stringify(backendHealth, null, 2)}</code></pre>
            </div>
          )}
        </div>

        {/* AI & Fallback Strategy */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              AI Engine & Fallback Strategy
            </h3>
            <span className="badge badge-tag">Deterministic Ready</span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Per the hackathon specification, CodeLens includes a high-fidelity <strong>Deterministic Fallback Engine</strong>. Even with no API key or during network downtime, all problem alternatives, complexity metrics, and counterexample test benches operate reliably without breaking.
          </p>

          <div style={{ marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-low)', fontSize: 12.5 }}>
            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Environment Configuration:</div>
            <p style={{ color: 'var(--text-subtle)', marginTop: 4 }}>
              To enable live Gemini models, set <code style={{ fontFamily: 'var(--font-mono)' }}>GEMINI_API_KEY</code> in the backend environment. Secrets are kept server-side and never exposed to React.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
