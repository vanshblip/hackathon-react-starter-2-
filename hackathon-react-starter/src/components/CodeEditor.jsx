import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({
  code = '',
  onChange,
  onReset,
  height = '420px',
  readOnly = false,
  language = 'javascript',
  highlightRange = null,
}) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Sync AST / Bug Detective highlight range to Monaco Editor
  useEffect(() => {
    if (!editorRef.current) return;
    if (!highlightRange || !highlightRange.startLine) {
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    try {
      const { startLine, endLine = startLine, startCol = 1, endCol = 100, type = 'ast' } = highlightRange;
      editorRef.current.revealLineInCenter(startLine);
      editorRef.current.setSelection({
        startLineNumber: startLine,
        startColumn: startCol,
        endLineNumber: endLine,
        endColumn: endCol,
      });

      const isBug = type === 'bug';
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: {
            startLineNumber: startLine,
            startColumn: 1,
            endLineNumber: endLine,
            endColumn: 1000,
          },
          options: {
            isWholeLine: true,
            className: isBug ? 'monaco-bug-line-highlight' : 'monaco-ast-line-highlight',
          },
        },
      ]);
    } catch (e) {
      console.warn('Monaco line highlight warning:', e);
    }
  }, [highlightRange]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Set editor options
    editor.updateOptions({
      fontSize: 13.5,
      fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
      padding: { top: 14, bottom: 14 },
      cursorBlinking: 'smooth',
      smoothScrolling: true,
      wordWrap: 'on',
    });
  }

  // Formatting action
  function handleFormatCode() {
    if (editorRef.current) {
      try {
        editorRef.current.getAction('editor.action.formatDocument')?.run();
      } catch (err) {
        // Fallback basic formatting
        basicFormat();
      }
    } else {
      basicFormat();
    }
  }

  function basicFormat() {
    if (!code) return;
    const lines = code.split('\n');
    let indentLevel = 0;
    const formatted = lines.map((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith('}')) indentLevel = Math.max(0, indentLevel - 1);
      const padded = '  '.repeat(indentLevel) + trimmed;
      if (trimmed.endsWith('{')) indentLevel++;
      return padded;
    }).join('\n');
    onChange(formatted);
  }

  function handleClear() {
    onChange('');
  }

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #1e293b',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)',
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Polished Editor Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          backgroundColor: '#090d16',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 6,
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined text-[14px]" style={{ color: '#facc15' }}>
              javascript
            </span>
            <span>editor.js</span>
          </div>

          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: '#172554',
              color: '#93c5fd',
              border: '1px solid #1d4ed8',
              fontFamily: 'var(--font-mono)',
            }}
          >
            JavaScript (ES6+)
          </span>
        </div>

        {/* Toolbar Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleFormatCode}
                title="Auto-format code indentation"
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  color: '#94a3b8',
                  padding: '3px 8px',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#f8fafc';
                  e.currentTarget.style.borderColor = '#475569';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <span className="material-symbols-outlined text-[13px]">format_align_left</span>
                <span>Format</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                title="Clear code"
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  color: '#94a3b8',
                  padding: '3px 8px',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#f8fafc';
                  e.currentTarget.style.borderColor = '#475569';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <span className="material-symbols-outlined text-[13px]">delete</span>
                <span>Clear</span>
              </button>

              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  title="Reset to starter template"
                  style={{
                    background: 'transparent',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#94a3b8',
                    padding: '3px 8px',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#f8fafc';
                    e.currentTarget.style.borderColor = '#475569';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.borderColor = '#334155';
                  }}
                >
                  <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Surface */}
      <div style={{ height, position: 'relative' }}>
        {!loadError ? (
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(val) => onChange && onChange(val || '')}
            onMount={handleEditorDidMount}
            loading={
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: '#0f172a',
                }}
              >
                <span className="material-symbols-outlined text-[18px] animate-spin" style={{ marginRight: 8 }}>
                  sync
                </span>
                <span>Initializing Code Editor...</span>
              </div>
            }
          />
        ) : (
          /* High-quality resilient fallback if Monaco CDN fails */
          <div style={{ display: 'flex', height: '100%', backgroundColor: '#0f172a' }}>
            <textarea
              value={code}
              onChange={(e) => onChange && onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const updated = code.substring(0, start) + '  ' + code.substring(end);
                  onChange(updated);
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                color: '#f8fafc',
                border: 'none',
                outline: 'none',
                padding: 16,
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                fontSize: 13.5,
                lineHeight: '22px',
                resize: 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 14px',
          backgroundColor: '#090d16',
          borderTop: '1px solid #1e293b',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <span>Lines: {code.split('\n').length}</span>
          <span>Length: {code.length}</span>
          <span>Spaces: 2</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
