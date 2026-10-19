import React, { useState, useEffect } from 'react';

// Restrained, developer-friendly category metadata
const CATEGORY_META = {
  function: { label: 'fn', fullLabel: 'Function', tagClass: 'ast-tag-function', color: '#6d28d9' },
  loop: { label: 'loop', fullLabel: 'Loop', tagClass: 'ast-tag-loop', color: '#0891b2' },
  condition: { label: 'if', fullLabel: 'Condition', tagClass: 'ast-tag-condition', color: '#b45309' },
  declaration: { label: 'var', fullLabel: 'Declaration', tagClass: 'ast-tag-declaration', color: '#1d4ed8' },
  call: { label: 'call', fullLabel: 'Function Call', tagClass: 'ast-tag-call', color: '#15803d' },
  return: { label: 'ret', fullLabel: 'Return', tagClass: 'ast-tag-return', color: '#be123c' },
  operator: { label: 'op', fullLabel: 'Operator', tagClass: 'ast-tag-operator', color: '#c2410c' },
  identifier: { label: 'id', fullLabel: 'Identifier', tagClass: 'ast-tag-identifier', color: '#475569' },
  literal: { label: 'lit', fullLabel: 'Literal', tagClass: 'ast-tag-literal', color: '#334155' },
  root: { label: 'prog', fullLabel: 'Program', tagClass: 'ast-tag-declaration', color: '#4f46e5' },
  structure: { label: 'expr', fullLabel: 'Expression', tagClass: 'ast-tag-identifier', color: '#64748b' },
};

export default function SyntaxTreeViewer({
  code = '',
  onSelectNode,
  selectedNode,
  onNavigateToEditor,
  isEmbedded = false,
}) {
  const [nodes, setNodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [syntaxError, setSyntaxError] = useState(null);
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Fetch real parsed AST from Acorn parser backend
  async function fetchTree(codeToParse) {
    const targetCode = codeToParse !== undefined ? codeToParse : code;
    if (!targetCode || !targetCode.trim()) {
      setNodes([]);
      setStats(null);
      setErrorMessage(null);
      setSyntaxError(null);
      setLastAnalyzedCode('');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSyntaxError(null);

    try {
      const res = await fetch('http://localhost:5000/api/solve/ast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode }),
      });

      const data = await res.json();
      setLastAnalyzedCode(targetCode);

      if (data.success && data.nodes && data.nodes.length > 0) {
        setNodes(data.nodes);
        setStats(data.stats || null);
        setSyntaxError(null);

        // Auto-expand root and first 2 levels
        const initialExpanded = {};
        function autoExpand(nodeList, depth = 0) {
          if (!nodeList) return;
          for (const n of nodeList) {
            if (depth <= 2) initialExpanded[n.id] = true;
            if (n.children) autoExpand(n.children, depth + 1);
          }
        }
        autoExpand(data.nodes, 0);
        setExpandedNodes(initialExpanded);

        // Auto-select first meaningful function or statement
        if (!selectedNode && data.nodes[0]) {
          const firstMeaningful = data.nodes[0].children?.[0] || data.nodes[0];
          if (onSelectNode) onSelectNode(firstMeaningful);
        }
      } else if (data.hasSyntaxError) {
        setSyntaxError({
          line: data.line,
          column: data.column,
          error: data.error,
          message: data.message,
        });
        setNodes([]);
      } else {
        setErrorMessage(data.message || 'Could not parse JavaScript syntax tree.');
        setNodes([]);
      }
    } catch (err) {
      console.error('Failed to fetch AST:', err);
      setErrorMessage(`Network error: Could not reach AST service (${err.message}).`);
    } finally {
      setIsLoading(false);
    }
  }

  // Load tree initially or when code changes
  useEffect(() => {
    fetchTree(code);
  }, []);

  const isOutdated = lastAnalyzedCode && code && lastAnalyzedCode.trim() !== code.trim();

  // Find ancestry path for selected node to render breadcrumb
  function findAncestry(targetId, currentList = nodes, path = []) {
    if (!targetId || !currentList) return null;
    for (const node of currentList) {
      const currentPath = [...path, node];
      if (node.id === targetId) return currentPath;
      if (node.children) {
        const found = findAncestry(targetId, node.children, currentPath);
        if (found) return found;
      }
    }
    return null;
  }

  const ancestryTrail = selectedNode ? findAncestry(selectedNode.id) : null;

  // Toggle single node expansion
  function toggleNode(nodeId, e) {
    e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }

  // Global expand all
  function handleExpandAll() {
    const all = {};
    function collectAll(nodeList) {
      if (!nodeList) return;
      for (const n of nodeList) {
        all[n.id] = true;
        if (n.children) collectAll(n.children);
      }
    }
    collectAll(nodes);
    setExpandedNodes(all);
  }

  // Collapse to root
  function handleCollapseAll() {
    const rootOnly = {};
    if (nodes[0]) rootOnly[nodes[0].id] = true;
    setExpandedNodes(rootOnly);
  }

  // Recursive tree renderer with clean connector lines and restrained glyphs
  function renderTreeNode(node, depth = 0) {
    if (!node) return null;
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    const meta = CATEGORY_META[node.category] || CATEGORY_META.structure;

    return (
      <div key={node.id} style={{ position: 'relative' }}>
        <div
          onClick={() => onSelectNode && onSelectNode(node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '5px 8px',
            marginLeft: depth * 14,
            marginBottom: 2,
            borderRadius: 6,
            backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
            border: isSelected ? '1px solid var(--primary-border)' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'background-color 0.12s ease',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
          onMouseOver={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-low)';
          }}
          onMouseOut={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
            {/* Expand / Collapse Toggle Chevron */}
            {hasChildren ? (
              <span
                onClick={(e) => toggleNode(node.id, e)}
                className="material-symbols-outlined text-[14px]"
                style={{
                  color: '#64748b',
                  userSelect: 'none',
                  cursor: 'pointer',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              >
                chevron_right
              </span>
            ) : (
              <span style={{ width: 14, display: 'inline-block' }} />
            )}

            {/* Restrained Category Monospace Glyphs [fn], [loop], etc. */}
            <span
              className={`badge ${meta.tagClass}`}
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 3,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                flexShrink: 0,
              }}
              title={meta.fullLabel}
            >
              {meta.label}
            </span>

            {/* Node Name */}
            <span
              style={{
                color: isSelected ? 'var(--primary-hover)' : 'var(--text-main)',
                fontWeight: isSelected ? 700 : 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={node.name}
            >
              {node.name}
            </span>
          </div>

          {/* Line Range Coordinates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              L{node.startLine}:{node.startCol}
            </span>
          </div>
        </div>

        {/* Recursive Children with Vertical Connector Line */}
        {hasChildren && isExpanded && (
          <div style={{ borderLeft: '1px solid var(--border-card)', marginLeft: depth * 14 + 12 }}>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Outdated Notice Banner */}
      {isOutdated && (
        <div className="outdated-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined text-[16px]">update</span>
            <span>Code modified: AST below reflects previous code.</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => fetchTree(code)}
            style={{ fontSize: 11, padding: '3px 8px' }}
          >
            Refresh AST
          </button>
        </div>
      )}

      {/* Syntax Error Alert */}
      {syntaxError && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error-border)',
            padding: 14,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--error)' }}>
            error
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--error-text)', marginBottom: 2 }}>
              JavaScript Syntax Error at Line {syntaxError.line}, Column {syntaxError.column}
            </div>
            <div style={{ fontSize: 12, color: 'var(--error-text)', fontFamily: 'var(--font-mono)' }}>
              {syntaxError.error}
            </div>
            <div style={{ fontSize: 11.5, color: '#7f1d1d', marginTop: 4 }}>
              The AST parser cannot build a syntax tree while syntax errors exist.
            </div>
            {onNavigateToEditor && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigateToEditor({ startLine: syntaxError.line, startCol: syntaxError.column, type: 'bug' })}
                style={{ marginTop: 6, fontSize: 11, padding: '3px 8px' }}
              >
                Jump to Line {syntaxError.line} in Editor
              </button>
            )}
          </div>
        </div>
      )}

      {/* General Error */}
      {errorMessage && !syntaxError && (
        <div className="card" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)', padding: 12 }}>
          <div style={{ color: 'var(--warning-text)', fontSize: 12.5 }}>{errorMessage}</div>
        </div>
      )}

      {/* Program Overview & Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 6,
          backgroundColor: 'var(--surface-low)',
          border: '1px solid var(--border-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)' }}>
            Code Structure
          </span>
          {stats && (
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              {stats.total} nodes &bull; {stats.functions} fn &bull; {stats.loops} loop &bull; depth {stats.maxDepth}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExpandAll}
            disabled={nodes.length === 0}
            style={{ fontSize: 11, padding: '2px 7px' }}
            title="Expand all nodes"
          >
            Expand All
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleCollapseAll}
            disabled={nodes.length === 0}
            style={{ fontSize: 11, padding: '2px 7px' }}
            title="Collapse to root"
          >
            Collapse
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => fetchTree(code)}
            disabled={isLoading}
            style={{ fontSize: 11, padding: '2px 9px' }}
          >
            <span className={`material-symbols-outlined text-[13px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isLoading ? 'Parsing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Navigable Tree Surface (Left) & Node Inspector (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isEmbedded ? '1.15fr 1fr' : '1.2fr 1fr',
          gap: 12,
        }}
      >
        {/* Left: Navigable Hierarchical Tree */}
        <div
          className="card"
          style={{
            padding: 8,
            maxHeight: isEmbedded ? 380 : 540,
            overflowY: 'auto',
            border: '1px solid var(--border-card)',
            backgroundColor: '#ffffff',
          }}
        >
          {nodes.length > 0 ? (
            <div>{nodes.map((n) => renderTreeNode(n, 0))}</div>
          ) : !isLoading && !syntaxError ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 12 }}>
              <span className="material-symbols-outlined text-[28px]" style={{ display: 'block', marginBottom: 4 }}>
                account_tree
              </span>
              <span>No syntax nodes available. Write JavaScript code and click Refresh.</span>
            </div>
          ) : null}
        </div>

        {/* Right: Selected Node Details Inspector */}
        <div
          className="card"
          style={{
            padding: 14,
            maxHeight: isEmbedded ? 380 : 540,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {selectedNode ? (
            <div className="space-y-3">
              {/* Header with Title and "View in Editor" button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span
                      className={`badge ${(CATEGORY_META[selectedNode.category] || CATEGORY_META.structure).tagClass}`}
                      style={{ fontSize: 10, fontWeight: 700 }}
                    >
                      {(CATEGORY_META[selectedNode.category] || CATEGORY_META.structure).fullLabel}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                      {selectedNode.type}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedNode.name}
                  </h4>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (onNavigateToEditor) {
                      onNavigateToEditor({
                        startLine: selectedNode.startLine,
                        endLine: selectedNode.endLine,
                        startCol: selectedNode.startCol,
                        endCol: selectedNode.endCol,
                        type: 'ast',
                      });
                    }
                  }}
                  style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}
                  title="Highlight and scroll to this line range in the Monaco editor"
                >
                  <span className="material-symbols-outlined text-[13px]">my_location</span>
                  <span>Inspect in Editor</span>
                </button>
              </div>

              {/* Hierarchy Breadcrumb Trail */}
              {ancestryTrail && ancestryTrail.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-subtle)' }}>
                  <span style={{ fontWeight: 600 }}>Path:</span>
                  {ancestryTrail.map((ancestor, idx) => (
                    <React.Fragment key={ancestor.id}>
                      {idx > 0 && <span>&rsaquo;</span>}
                      <span
                        onClick={() => onSelectNode && onSelectNode(ancestor)}
                        style={{
                          cursor: 'pointer',
                          color: ancestor.id === selectedNode.id ? 'var(--primary)' : 'inherit',
                          fontWeight: ancestor.id === selectedNode.id ? 700 : 400,
                        }}
                      >
                        {ancestor.name}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Source Coordinates */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '5px 8px',
                  borderRadius: 4,
                  backgroundColor: 'var(--surface-low)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                <div>
                  <strong>Start:</strong> Line {selectedNode.startLine}:{selectedNode.startCol}
                </div>
                <div>
                  <strong>End:</strong> Line {selectedNode.endLine}:{selectedNode.endCol}
                </div>
              </div>

              {/* Concise Pedagogical Role */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 2 }}>
                  Role in Program
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.45 }}>
                  {selectedNode.description}
                </p>
              </div>

              {/* Matched Source Snippet */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 2 }}>
                  Matched Source Code
                </div>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--editor-bg)',
                    color: 'var(--editor-text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    maxHeight: 110,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedNode.snippet || '(empty)'}
                </div>
              </div>

              {/* Collapsible Technical AST Properties */}
              <details
                open={showTechnicalDetails}
                onToggle={(e) => setShowTechnicalDetails(e.currentTarget.open)}
                style={{
                  border: '1px solid var(--border-card)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11.5,
                }}
              >
                <summary style={{ fontWeight: 600, color: 'var(--text-subtle)', cursor: 'pointer' }}>
                  Technical AST Properties
                </summary>
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-card)', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)' }}>
                  <div><strong>Acorn Type:</strong> {selectedNode.type}</div>
                  <div><strong>AST Category:</strong> {selectedNode.category}</div>
                  <div><strong>Line Span:</strong> {selectedNode.endLine - selectedNode.startLine + 1} lines</div>
                  {selectedNode.loc && (
                    <div><strong>Byte Offset:</strong> {selectedNode.loc.start?.line}:{selectedNode.loc.start?.column}</div>
                  )}
                </div>
              </details>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 12 }}>
              <span className="material-symbols-outlined text-[24px]" style={{ display: 'block', marginBottom: 4 }}>
                touch_app
              </span>
              <span>Select any node in the tree to inspect its code coordinates and pedagogical role.</span>
            </div>
          )}

          {/* Category Glyphs Legend */}
          <div
            style={{
              paddingTop: 8,
              borderTop: '1px solid var(--border-card)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            {['function', 'loop', 'condition', 'declaration', 'call', 'return'].map((k) => {
              const m = CATEGORY_META[k];
              return (
                <span
                  key={k}
                  className={`badge ${m.tagClass}`}
                  style={{ fontSize: 9.5, padding: '1px 5px', fontFamily: 'var(--font-mono)' }}
                >
                  [{m.label}] {m.fullLabel}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
