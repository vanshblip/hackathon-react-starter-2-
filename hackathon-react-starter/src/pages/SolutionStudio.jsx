import React, { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import TestCaseManager from '../components/TestCaseManager';
import BugDetective from '../components/BugDetective';
import SyntaxTreeViewer from '../components/SyntaxTreeViewer';

const QUICK_EXAMPLES = [
  {
    id: 'add-two',
    label: 'Add Two Numbers',
    code: `function addTwoNumbers(a, b) {\n  return a + b;\n}`,
  },
  {
    id: 'reverse-array',
    label: 'Reverse an Array',
    code: `function reverseArray(nums) {\n  return nums && Array.isArray(nums) ? [...nums].reverse() : [];\n}`,
  },
  {
    id: 'second-largest',
    label: 'Find Second Largest',
    code: `function findSecondLargest(nums) {\n  let first = 0, second = 0;\n  for (let i = 0; i < nums.length; i++) {\n    if (nums[i] > first) {\n      second = first;\n      first = nums[i];\n    } else if (nums[i] > second) {\n      second = nums[i];\n    }\n  }\n  return second;\n}`,
  },
  {
    id: 'binary-search',
    label: 'Binary Search (O(log n))',
    code: `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`,
  },
  {
    id: 'sequential-loops',
    label: 'Sequential Loops (O(n))',
    code: `function findRange(arr) {\n  let maxVal = arr[0];\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] > maxVal) maxVal = arr[i];\n  }\n  let minVal = arr[0];\n  for (let j = 0; j < arr.length; j++) {\n    if (arr[j] < minVal) minVal = arr[j];\n  }\n  return maxVal - minVal;\n}`,
  },
  {
    id: 'nested-pairs',
    label: 'Nested Loops (O(n²))',
    code: `function pairs(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length; j++) {\n      console.log(arr[i], arr[j]);\n    }\n  }\n}`,
  },
  {
    id: 'three-nested',
    label: 'Three Nested Loops (O(n³))',
    code: `function triplets(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length; j++) {\n      for (let k = 0; k < arr.length; k++) {\n        console.log(i, j, k);\n      }\n    }\n  }\n}`,
  },
];

export default function SolutionStudio({
  studentCode = '',
  setStudentCode,
  alternativeCode = '',
  setAlternativeCode,
  analysisData,
  isAnalyzing = false,
  onAnalyzeCode,
  onRunCode,
  onGenerateAlternative,
  onChallenge,
  onSubmitSolution,
  runResults,
  isRunning = false,
  isGenerating = false,
  onNavigate,
  activeTestCases = [],
  setActiveTestCases,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bugs' | 'structure' | 'tests' | 'alternative'
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [clarificationInput, setClarificationInput] = useState('');
  const [showClarification, setShowClarification] = useState(false);
  const [copied, setCopied] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState(null);
  const [highlightRange, setHighlightRange] = useState(null);
  const [selectedAstNode, setSelectedAstNode] = useState(null);

  // Check if code has changed since last analysis
  const isOutdated = Boolean(
    analysisData &&
    analysisData.analyzedCode &&
    studentCode &&
    analysisData.analyzedCode.trim() !== studentCode.trim()
  );

  const bugFindings = analysisData?.potentialBugs || [];
  const bugCount = bugFindings.length;

  function handleCopyAlternative() {
    if (!alternativeCode) return;
    navigator.clipboard.writeText(alternativeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSelectExample(ex) {
    setStudentCode(ex.code);
    setHighlightRange(null);
    if (onAnalyzeCode) {
      onAnalyzeCode(ex.code);
    }
  }

  function handleTriggerAnalyze() {
    if (onAnalyzeCode) {
      onAnalyzeCode(studentCode, clarificationInput);
    }
  }

  function handleTriggerRun() {
    if (onRunCode) {
      onRunCode(activeTestCases);
    }
  }

  function handleTriggerChallenge() {
    if (onChallenge) {
      onChallenge(activeTestCases);
    }
  }

  // Execute current code directly via isolated backend sandbox
  async function handleRunCodeDirect() {
    if (!studentCode || !studentCode.trim()) {
      setConsoleOutput({
        hasRun: true,
        isLoading: false,
        success: false,
        logs: [],
        result: undefined,
        hasResult: false,
        error: 'Please enter or paste some JavaScript code before running.',
        executionTimeMs: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    setConsoleOutput({
      hasRun: true,
      isLoading: true,
      success: true,
      logs: [],
      result: undefined,
      hasResult: false,
      error: null,
      executionTimeMs: 0,
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      const res = await fetch('http://localhost:5000/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: studentCode,
          timeoutMs: 1500,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConsoleOutput({
          hasRun: true,
          isLoading: false,
          success: true,
          logs: Array.isArray(data.logs) ? data.logs : [],
          result: data.result,
          hasResult: data.result !== undefined,
          error: null,
          executionTimeMs: data.executionTimeMs || 0,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setConsoleOutput({
          hasRun: true,
          isLoading: false,
          success: false,
          logs: Array.isArray(data.logs) ? data.logs : [],
          result: undefined,
          hasResult: false,
          error: data.error || data.message || 'Execution failed.',
          executionTimeMs: data.executionTimeMs || 0,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      setConsoleOutput({
        hasRun: true,
        isLoading: false,
        success: false,
        logs: [],
        result: undefined,
        hasResult: false,
        error: `Network error: Could not reach execution server (${err.message}).`,
        executionTimeMs: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }

  function handleClearConsole() {
    setConsoleOutput(null);
  }

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar with Clear Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="breadcrumbs">
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Solution Studio</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 1 }}>
            Solution Studio
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Write or paste code. Run instantly, analyze complexity, and investigate AST structure and edge cases.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Action 1: Run Code (Primary Runner) */}
          <button
            className="btn-run"
            onClick={handleRunCodeDirect}
            disabled={(consoleOutput && consoleOutput.isLoading) || !studentCode.trim()}
            title="Execute code in isolated child process and view output in Output Console"
          >
            <span className="material-symbols-outlined text-[17px]">
              {consoleOutput && consoleOutput.isLoading ? 'hourglass_top' : 'play_arrow'}
            </span>
            <span>{consoleOutput && consoleOutput.isLoading ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Action 2: Analyze My Code (Primary Analyzer) */}
          <button
            className="btn-primary"
            onClick={handleTriggerAnalyze}
            disabled={isAnalyzing || !studentCode.trim()}
            title="Perform structural AST and asymptotic complexity analysis"
          >
            <span className="material-symbols-outlined text-[17px]">
              {isAnalyzing ? 'sync' : 'auto_awesome'}
            </span>
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze My Code'}</span>
          </button>

          {/* Action 3: Run Tests */}
          <button
            className="btn-secondary"
            onClick={handleTriggerRun}
            disabled={isRunning || !studentCode.trim()}
            title="Execute test benches in isolated child process"
          >
            <span className="material-symbols-outlined text-[17px]">
              {isRunning ? 'hourglass_top' : 'checklist'}
            </span>
            <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
          </button>

          {/* Action 4: Challenge in Arena */}
          <button
            className="btn-secondary"
            onClick={handleTriggerChallenge}
            disabled={!studentCode.trim()}
            title="Challenge student and alternative solutions in Counterexample Arena"
          >
            <span className="material-symbols-outlined text-[17px]" style={{ color: 'var(--primary)' }}>
              swords
            </span>
            <span>Arena</span>
          </button>

          {/* Action 5: Save Attempt */}
          <button
            className="btn-secondary"
            onClick={() => onSubmitSolution(activeTestCases)}
            disabled={!studentCode.trim()}
            title="Save attempt and test verdicts to SQLite database"
          >
            <span className="material-symbols-outlined text-[17px]">save</span>
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* 2. Controls & Quick-Start Examples Bar */}
      <div
        className="card"
        style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          backgroundColor: '#ffffff',
        }}
      >
        {/* Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: 'var(--primary)' }}>
              javascript
            </span>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Engine:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface-low)',
                border: '1px solid var(--border-card)',
                borderRadius: 6,
                padding: '3px 8px',
                outline: 'none',
              }}
            >
              <option value="javascript">JavaScript (ES2022)</option>
            </select>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Sandbox Active</span>
          </span>
        </div>

        {/* Quick Example Snippets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-subtle)' }}>
            Try an example:
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleSelectExample(ex)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 4,
                  backgroundColor: 'var(--surface-low)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-card)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#eef2ff';
                  e.currentTarget.style.borderColor = '#c7d2fe';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-low)';
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional Context Clarification */}
      {showClarification && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px dashed var(--primary)',
            borderRadius: 8,
            padding: 10,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="search-input"
            style={{ flex: 1, padding: '6px 10px', fontSize: 12.5 }}
            placeholder="e.g. 'This function finds the second largest distinct number in an array'"
            value={clarificationInput}
            onChange={(e) => setClarificationInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={handleTriggerAnalyze}
          >
            Re-Analyze with Context
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Code-First Dual Column */}
      <div className="editors-grid" style={{ minHeight: 520, margin: 0 }}>
        {/* LEFT COLUMN: Monaco Editor + Output Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Monaco Editor Container */}
          <div>
            <CodeEditor
              code={studentCode}
              onChange={(newCode) => {
                setStudentCode(newCode);
                setHighlightRange(null);
              }}
              onReset={() => {
                setStudentCode('function solution(input) {\n  // Write or paste your code here\n  return input;\n}');
                setHighlightRange(null);
              }}
              height="360px"
              highlightRange={highlightRange}
            />
          </div>

          {/* Dedicated Output Console Panel */}
          <div
            className="card"
            style={{
              padding: 0,
              backgroundColor: 'var(--editor-bg)',
              color: 'var(--editor-text)',
              borderRadius: 8,
              border: '1px solid var(--editor-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 180,
            }}
          >
            {/* Console Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                backgroundColor: 'var(--editor-header)',
                borderBottom: '1px solid var(--editor-border)',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: '#38bdf8' }}>
                  terminal
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  Output Console
                </span>

                {consoleOutput && !consoleOutput.isLoading && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      backgroundColor: consoleOutput.success ? '#064e3b' : '#7f1d1d',
                      color: consoleOutput.success ? '#6ee7b7' : '#fca5a5',
                    }}
                  >
                    {consoleOutput.success ? 'Exit 0' : 'Exit 1'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {consoleOutput && consoleOutput.executionTimeMs !== undefined && (
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {consoleOutput.executionTimeMs}ms
                  </span>
                )}

                {consoleOutput && (
                  <button
                    type="button"
                    onClick={handleClearConsole}
                    style={{
                      background: 'transparent',
                      border: '1px solid #334155',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                    title="Clear console output"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Console Body */}
            <div
              style={{
                padding: '12px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.55,
                minHeight: 130,
                maxHeight: 240,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {/* Empty state */}
              {consoleOutput === null && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    padding: '20px 10px',
                    gap: 4,
                    textAlign: 'center',
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ color: '#475569' }}>
                    terminal
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>Console ready.</span>
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    Click <strong>&quot;Run Code&quot;</strong> above to compile, capture console.log(), and inspect returned values.
                  </span>
                </div>
              )}

              {/* Running state */}
              {consoleOutput && consoleOutput.isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', padding: '16px 0', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ animation: 'spin 1s linear infinite' }}>
                    sync
                  </span>
                  <span style={{ fontSize: 12 }}>Executing in isolated sandbox...</span>
                </div>
              )}

              {/* Logs */}
              {consoleOutput && !consoleOutput.isLoading && consoleOutput.logs && consoleOutput.logs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {consoleOutput.logs.map((logLine, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#475569', userSelect: 'none', minWidth: 18, textAlign: 'right', fontSize: 10.5 }}>
                        {idx + 1}
                      </span>
                      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#f8fafc' }}>
                        {logLine}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Returned Result */}
              {consoleOutput && !consoleOutput.isLoading && consoleOutput.hasResult && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '5px 8px',
                    backgroundColor: 'rgba(6, 78, 59, 0.35)',
                    border: '1px solid #059669',
                    borderRadius: 4,
                    color: '#6ee7b7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11.5,
                  }}
                >
                  <span className="material-symbols-outlined text-[14px]">subdirectory_arrow_right</span>
                  <span>
                    Returned:{' '}
                    <strong>
                      {typeof consoleOutput.result === 'object' && consoleOutput.result !== null
                        ? JSON.stringify(consoleOutput.result)
                        : String(consoleOutput.result)}
                    </strong>
                  </span>
                </div>
              )}

              {/* Execution Error */}
              {consoleOutput && !consoleOutput.isLoading && consoleOutput.error && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '7px 10px',
                    backgroundColor: 'rgba(76, 5, 25, 0.45)',
                    border: '1px solid #e11d48',
                    borderRadius: 4,
                    color: '#fda4af',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    fontSize: 11.5,
                  }}
                >
                  <span className="material-symbols-outlined text-[15px]" style={{ color: '#fb7185', marginTop: 1 }}>
                    error
                  </span>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: 2 }}>Runtime Error</div>
                    {consoleOutput.error}
                  </div>
                </div>
              )}

              {/* Clean execution with no logs */}
              {consoleOutput &&
                !consoleOutput.isLoading &&
                !consoleOutput.error &&
                (!consoleOutput.logs || consoleOutput.logs.length === 0) &&
                !consoleOutput.hasResult && (
                  <div style={{ color: '#10b981', padding: '8px 0', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Executed cleanly with 0 console logs and undefined return value.</span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Intelligence Deck */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            minHeight: 520,
          }}
        >
          {/* Tab Bar Header */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-card)',
              backgroundColor: 'var(--surface-low)',
              overflowX: 'auto',
            }}
          >
            {/* Tab 1: Overview */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'overview' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'overview' ? 700 : 500,
                color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined text-[15px]">insights</span>
              <span>Complexity &amp; Overview</span>
            </button>

            {/* Tab 2: Bug Detective */}
            <button
              type="button"
              onClick={() => setActiveTab('bugs')}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'bugs' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'bugs' ? 700 : 500,
                color: activeTab === 'bugs' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'bugs' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined text-[15px]">bug_report</span>
              <span>Bug Detective</span>
              {bugCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 9999,
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                  }}
                >
                  {bugCount}
                </span>
              )}
            </button>

            {/* Tab 3: Structure Explorer */}
            <button
              type="button"
              onClick={() => setActiveTab('structure')}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'structure' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'structure' ? 700 : 500,
                color: activeTab === 'structure' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'structure' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined text-[15px]">account_tree</span>
              <span>Structure Explorer</span>
            </button>

            {/* Tab 4: Test Bench */}
            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'tests' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'tests' ? 700 : 500,
                color: activeTab === 'tests' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'tests' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined text-[15px]">science</span>
              <span>Test Bench ({activeTestCases.length})</span>
            </button>

            {/* Tab 5: Alternative */}
            <button
              type="button"
              onClick={() => setActiveTab('alternative')}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                background: activeTab === 'alternative' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'alternative' ? 700 : 500,
                color: activeTab === 'alternative' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'alternative' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined text-[15px]">compare_arrows</span>
              <span>Alternative</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            {/* PANE 1: COMPLEXITY & OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Outdated Warning Notice */}
                {isOutdated && (
                  <div className="outdated-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined text-[16px]">update</span>
                      <span>Code modified since last analysis. Click Analyze to refresh findings.</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleTriggerAnalyze}
                      style={{ fontSize: 11, padding: '3px 8px' }}
                    >
                      Refresh
                    </button>
                  </div>
                )}

                {!analysisData ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined text-[36px]" style={{ color: '#cbd5e1', marginBottom: 8 }}>
                      insights
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                      No Analysis Generated Yet
                    </h3>
                    <p style={{ fontSize: 12.5, maxWidth: 360, margin: '0 auto 14px' }}>
                      Click <strong>&quot;Analyze My Code&quot;</strong> to evaluate time and space complexity, identify edge cases, and inspect AST structures.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleTriggerAnalyze}
                      disabled={!studentCode.trim()}
                      style={{ fontSize: 12 }}
                    >
                      Analyze My Code
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Compact Complexity Metrics Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {/* Time Complexity Card */}
                      <div
                        style={{
                          backgroundColor: 'var(--surface-low)',
                          border: '1px solid var(--border-card)',
                          padding: '12px 14px',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                          Time Complexity
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: analysisData.complexity?.time?.includes('uncertain') ? '#b45309' : 'var(--primary)',
                            marginTop: 2,
                          }}
                        >
                          {analysisData.complexity?.time || 'O(1)'}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {analysisData.complexity?.explanation || 'Evaluated from AST loop nesting.'}
                        </div>
                      </div>

                      {/* Auxiliary Space Card */}
                      <div
                        style={{
                          backgroundColor: 'var(--surface-low)',
                          border: '1px solid var(--border-card)',
                          padding: '12px 14px',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                          Auxiliary Space
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: '#0284c7',
                            marginTop: 2,
                          }}
                        >
                          {analysisData.complexity?.space || 'O(1)'}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {analysisData.complexity?.spaceDetail || 'Heap & stack memory allocations.'}
                        </div>
                      </div>
                    </div>

                    {/* Algorithmic Overview & Inferred Purpose */}
                    <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-low)', border: '1px solid var(--border-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                          Inferred Purpose: {analysisData.inferredTitle || 'Custom Algorithm'}
                        </span>
                        {analysisData.analyzedAt && (
                          <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                            {analysisData.analyzedAt}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {analysisData.inferredPurpose || analysisData.explanation?.overview}
                      </p>
                    </div>

                    {/* Quick Navigation Action Chips */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {bugCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('bugs')}
                          className="btn-secondary"
                          style={{ fontSize: 11.5, padding: '5px 10px', borderColor: '#fca5a5', color: '#991b1b', backgroundColor: '#fef2f2' }}
                        >
                          <span className="material-symbols-outlined text-[14px]">bug_report</span>
                          <span>Investigate {bugCount} {bugCount === 1 ? 'Finding' : 'Findings'} in Bug Detective &rarr;</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveTab('structure')}
                        className="btn-secondary"
                        style={{ fontSize: 11.5, padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined text-[14px]">account_tree</span>
                        <span>Inspect AST Structure &rarr;</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('tests')}
                        className="btn-secondary"
                        style={{ fontSize: 11.5, padding: '5px 10px' }}
                      >
                        <span className="material-symbols-outlined text-[14px]">science</span>
                        <span>Open Test Benches &rarr;</span>
                      </button>
                    </div>

                    {/* Expandable Section: Algorithmic Breakdown */}
                    {analysisData.explanation?.breakdown && analysisData.explanation.breakdown.length > 0 && (
                      <details style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 8, padding: '10px 12px' }}>
                        <summary style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-main)', cursor: 'pointer' }}>
                          Structural Code Breakdown ({analysisData.explanation.breakdown.length} sections)
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border-card)' }}>
                          {analysisData.explanation.breakdown.map((item, idx) => (
                            <div key={idx} style={{ fontSize: 12, lineHeight: 1.45 }}>
                              <strong style={{ color: 'var(--primary)' }}>{item.section}:</strong> {item.detail}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Expandable Section: Boundary Edge Cases */}
                    {analysisData.edgeCases && analysisData.edgeCases.length > 0 && (
                      <details style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 8, padding: '10px 12px' }}>
                        <summary style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-main)', cursor: 'pointer' }}>
                          Suggested Boundary Test Cases ({analysisData.edgeCases.length})
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border-card)' }}>
                          {analysisData.edgeCases.map((ec, idx) => (
                            <div key={idx} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span><strong>{ec.inputDescription}:</strong> <span style={{ color: 'var(--text-muted)' }}>{ec.reason}</span></span>
                              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--primary)' }}>
                                {JSON.stringify(ec.input)}
                              </code>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}

            {/* PANE 2: BUG DETECTIVE */}
            {activeTab === 'bugs' && (
              <BugDetective
                findings={bugFindings}
                studentCode={studentCode}
                onApplyCodeFix={(fixedCode) => {
                  setStudentCode(fixedCode);
                  setHighlightRange(null);
                }}
                onHighlightLine={(range) => setHighlightRange(range)}
                isOutdated={isOutdated}
                onReanalyze={handleTriggerAnalyze}
                functionName={analysisData?.functionName}
              />
            )}

            {/* PANE 3: STRUCTURE EXPLORER */}
            {activeTab === 'structure' && (
              <SyntaxTreeViewer
                code={studentCode}
                isEmbedded={true}
                onSelectNode={(node) => {
                  setSelectedAstNode(node);
                  setHighlightRange({
                    startLine: node.startLine,
                    endLine: node.endLine,
                    startCol: node.startCol,
                    endCol: node.endCol,
                    type: 'ast',
                  });
                }}
                selectedNode={selectedAstNode}
                onNavigateToEditor={(range) => setHighlightRange(range)}
              />
            )}

            {/* PANE 4: TEST BENCH */}
            {activeTab === 'tests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Add custom inputs with optional expected outputs. Isolated execution evaluates outputs without hardcoded mockups.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleTriggerRun}
                    disabled={isRunning || !studentCode.trim()}
                    style={{ fontSize: 11.5, padding: '5px 12px' }}
                  >
                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                    <span>{isRunning ? 'Running...' : 'Run All Tests'}</span>
                  </button>
                </div>

                <TestCaseManager
                  testCases={activeTestCases}
                  onUpdateTestCases={setActiveTestCases}
                  onGenerateTests={() => onAnalyzeCode(studentCode)}
                  isGenerating={isAnalyzing}
                  runResults={runResults}
                />
              </div>
            )}

            {/* PANE 5: ALTERNATIVE IMPLEMENTATION */}
            {activeTab === 'alternative' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      Inferred Alternative Approach
                    </h4>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Compare your implementation against an alternative algorithmic approach.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCopyAlternative}
                      style={{ fontSize: 11.5, padding: '4px 8px' }}
                      disabled={!alternativeCode}
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onGenerateAlternative}
                      disabled={isGenerating || !studentCode.trim()}
                      style={{ fontSize: 11.5, padding: '4px 10px' }}
                    >
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      <span>{isGenerating ? 'Synthesizing...' : 'Regenerate'}</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--editor-bg)',
                    borderRadius: 6,
                    padding: 10,
                    border: '1px solid var(--editor-border)',
                  }}
                >
                  <textarea
                    value={alternativeCode}
                    onChange={(e) => setAlternativeCode(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 200,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--editor-text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      lineHeight: 1.55,
                      resize: 'vertical',
                    }}
                    placeholder="// Alternative code will appear here after clicking 'Analyze My Code' or 'Regenerate'..."
                  />
                </div>

                {analysisData?.alternativeSolution?.explanation && (
                  <div style={{ backgroundColor: 'var(--surface-low)', padding: 10, borderRadius: 6, fontSize: 12, lineHeight: 1.45 }}>
                    <strong style={{ color: 'var(--primary)' }}>Approach Notes:</strong>{' '}
                    {analysisData.alternativeSolution.explanation}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleTriggerChallenge}
                    disabled={!studentCode.trim() || !alternativeCode.trim()}
                    style={{ fontSize: 12 }}
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--primary)' }}>swords</span>
                    <span>Challenge in Counterexample Arena &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
