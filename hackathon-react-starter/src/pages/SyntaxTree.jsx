import React, { useState } from 'react';
import SyntaxTreeViewer from '../components/SyntaxTreeViewer';
import CodeEditor from '../components/CodeEditor';

export default function SyntaxTree({ problem, studentCode = '', setStudentCode, onNavigate }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightRange, setHighlightRange] = useState(null);

  function handleSelectNode(node) {
    setSelectedNode(node);
    if (node) {
      setHighlightRange({
        startLine: node.startLine,
        endLine: node.endLine,
        startCol: node.startCol,
        endCol: node.endCol,
        type: 'ast',
      });
    }
  }

  function handleNavigateToEditor(range) {
    setHighlightRange(range);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="breadcrumbs">
          <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Interactive Syntax Tree</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Interactive Syntax Tree (AST)
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Explore concrete JavaScript syntax structures, scope hierarchies, and grammar semantics. Click any node to highlight in the editor.
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={() => onNavigate('solution-studio')}
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            <span>Return to Studio</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Tree on Left, Synchronized Monaco Editor on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        <div>
          <SyntaxTreeViewer
            code={studentCode}
            onSelectNode={handleSelectNode}
            selectedNode={selectedNode}
            onNavigateToEditor={handleNavigateToEditor}
            isEmbedded={false}
          />
        </div>

        <div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
                  code
                </span>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-main)' }}>
                  Synchronized Code Editor
                </span>
              </div>
              {highlightRange && (
                <span className="badge badge-tag" style={{ fontSize: 11 }}>
                  Highlighting L{highlightRange.startLine}:{highlightRange.startCol} – L{highlightRange.endLine}:{highlightRange.endCol}
                </span>
              )}
            </div>

            <CodeEditor
              code={studentCode}
              onChange={setStudentCode}
              height="500px"
              highlightRange={highlightRange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
