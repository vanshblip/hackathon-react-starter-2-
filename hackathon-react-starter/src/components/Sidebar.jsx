import React from 'react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'solution-studio', label: 'Solution Studio', icon: 'code' },
  { id: 'counterexample-arena', label: 'Counterexample Arena', icon: 'gpp_maybe' },
  { id: 'solution-comparison', label: 'Solution Comparison', icon: 'compare_arrows' },
  { id: 'syntax-tree', label: 'Syntax Tree', icon: 'account_tree' },
  { id: 'break-and-run', label: 'Bug Hunt', icon: 'pest_control' },
  { id: 'my-attempts', label: 'My Attempts', icon: 'history_edu' },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </div>
            <span>CodeLens</span>
          </div>
          <span className="badge-edu">Edu</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="nav-divider" />

          <button
            onClick={() => onNavigate('settings')}
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar-img">EV</div>
          <div className="user-info">
            <p className="user-name">Elena Vance</p>
            <p className="user-subtitle">CS 106B Student</p>
          </div>
        </div>
        <span className="status-badge">Active</span>
      </div>
    </aside>
  );
}
