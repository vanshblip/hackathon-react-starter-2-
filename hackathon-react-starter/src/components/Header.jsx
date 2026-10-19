import React from 'react';

export default function Header({ problems = [], selectedProblemId, onSelectProblem, onSearch }) {
  return (
    <header className="top-header">
      <div className="header-search-wrap">
        <div className="search-input-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search problems, AST concepts, or solutions..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
          <span className="kbd-shortcut">Ctrl K</span>
        </div>

        {problems.length > 0 && (
          <div className="problem-selector-pill" title="Optionally load a predefined curriculum lab or example problem">
            <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--primary)' }}>
              menu_book
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Labs:
            </span>
            <select
              value={selectedProblemId || ''}
              onChange={(e) => onSelectProblem && onSelectProblem(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontWeight: 600,
                fontSize: '12px',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="header-right-actions">
        <div className="streak-pill" title="Workspace Runtime Environment">
          <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--success)' }}>
            terminal
          </span>
          <span>Node.js Sandbox Active</span>
        </div>

        <button className="icon-button" aria-label="Documentation" title="Developer Docs">
          <span className="material-symbols-outlined text-[18px]">help_outline</span>
        </button>

        <div className="avatar-img" style={{ width: 30, height: 30, fontSize: 11 }} title="Student Profile">
          EV
        </div>
      </div>
    </header>
  );
}
