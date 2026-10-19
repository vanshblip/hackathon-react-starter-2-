import React, { useState, useEffect } from 'react';

export default function MyAttempts({ onRestoreAttempt, onNavigate }) {
  const [attempts, setAttempts] = useState([]);
  const [existingTasks, setExistingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attempts');

  useEffect(() => {
    // 1. Fetch saved attempts from SQLite
    fetch('http://localhost:5000/api/attempts')
      .then((r) => r.json())
      .then((data) => {
        if (data.attempts) {
          setAttempts(data.attempts);
        }
      })
      .catch((err) => console.error('Attempts fetch error:', err))
      .finally(() => setLoading(false));

    // 2. Fetch existing tasks table to demonstrate backward compatibility & data preservation
    fetch('http://localhost:5000/api/tasks')
      .then((r) => r.json())
      .then((data) => {
        if (data.tasks) {
          setExistingTasks(data.tasks);
        }
      })
      .catch((err) => console.error('Tasks fetch error:', err));
  }, []);

  return (
    <div className="space-y-5">
      {/* Breadcrumb & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="breadcrumbs">
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>My Attempts</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 1 }}>
            Submission History &amp; Preserved Records
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Persisted SQLite database history. Inspect past execution verdicts and restore prior code versions to Solution Studio.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => onNavigate('solution-studio')}
        >
          <span className="material-symbols-outlined text-[16px]">code</span>
          <span>Open Solution Studio</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: 18 }}>
        <div className="tabs-header" style={{ marginBottom: 14 }}>
          <button
            className={`tab-btn ${activeTab === 'attempts' ? 'active' : ''}`}
            onClick={() => setActiveTab('attempts')}
          >
            Saved Submissions ({attempts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Preserved SQLite Database ({existingTasks.length} tasks)
          </button>
        </div>

        {/* Tab 1: CodeLens Attempts */}
        {activeTab === 'attempts' && (
          <div>
            {loading ? (
              <p style={{ padding: 16, color: 'var(--text-subtle)', fontSize: 13 }}>Loading submissions from SQLite...</p>
            ) : attempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--primary)', marginBottom: 6 }}>
                  history
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                  No Submissions Saved Yet
                </h3>
                <p style={{ fontSize: 12.5, maxWidth: 420, margin: '0 auto 14px' }}>
                  Write and test your solution in Solution Studio, then click &quot;Save&quot; to persist your attempt in the SQLite database.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => onNavigate('solution-studio')}
                  style={{ fontSize: 12 }}
                >
                  Go to Solution Studio
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {attempts.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      border: '1px solid var(--border-card)',
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: 'var(--surface-low)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 14,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                          {att.problem_title || att.problem_id}
                        </span>
                        <span className={`badge ${att.verdict === 'ALL_PASSED' ? 'badge-easy' : 'badge-tag'}`}>
                          {att.verdict}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                          {att.language}
                        </span>
                      </div>

                      <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 3 }}>
                        Passed {att.passed_count} / {att.total_count} test cases &bull; Submitted on {att.created_at}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        className="btn-secondary"
                        onClick={() => onRestoreAttempt(att)}
                        style={{ fontSize: 11.5, padding: '4px 10px' }}
                      >
                        <span className="material-symbols-outlined text-[14px]">restore</span>
                        <span>Restore in Studio</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Existing Tasks Table (Preserved Data) */}
        {activeTab === 'tasks' && (
          <div>
            <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              These records represent your existing database table (<code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>tasks</code>) which has been preserved without loss or alteration:
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-subtle)', backgroundColor: 'var(--surface-low)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Priority</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Reason</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {existingTasks.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>#{t.id}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.title}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${t.priority === 'HIGH' ? 'badge-hard' : 'badge-tag'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{t.reason}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {t.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
