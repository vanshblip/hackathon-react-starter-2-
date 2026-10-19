import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import SolutionStudio from './pages/SolutionStudio';
import CounterexampleArena from './pages/CounterexampleArena';
import SolutionComparison from './pages/SolutionComparison';
import SyntaxTree from './pages/SyntaxTree';
import BreakAndRun from './pages/BreakAndRun';
import MyAttempts from './pages/MyAttempts';
import Settings from './pages/Settings';
import './styles.css';

export default function App() {
  // 1. Code-First Default: opens directly to clean editor in Solution Studio
  const [currentPage, setCurrentPage] = useState('solution-studio');
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState('find-max');

  // Code-first state: starts with a clear starter function
  const [studentCode, setStudentCode] = useState(
    `function addTwoNumbers(a, b) {\n  return a + b;\n}`
  );
  const [alternativeCode, setAlternativeCode] = useState(
    `function addTwoNumbers(a, b) {\n  let x = a, y = b;\n  while (y !== 0) {\n    let carry = x & y;\n    x = x ^ y;\n    y = carry << 1;\n  }\n  return x;\n}`
  );
  const [alternativeData, setAlternativeData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [runResults, setRunResults] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);

  // Candidate tests initialized without requiring a predefined problem
  const [activeTestCases, setActiveTestCases] = useState([
    { id: 1, name: 'Positive Sum', input: [5, 7], expected: 12, category: 'normal', isSuggested: true },
    { id: 2, name: 'Negative Sum', input: [-3, -8], expected: -11, category: 'normal', isSuggested: true },
    { id: 3, name: 'Identity with Zero', input: [0, 42], expected: 42, category: 'boundary', isSuggested: true },
    { id: 4, name: 'Opposite Signs', input: [15, -5], expected: 10, category: 'edge', isSuggested: true },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChallenging, setIsChallenging] = useState(false);
  const [toast, setToast] = useState('');
  const analysisReqSeq = useRef(0);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  // Load existing problems for optional exploration/reference
  function refreshProblems() {
    return fetch('http://localhost:5000/api/problems')
      .then((r) => r.json())
      .then((data) => {
        if (data.problems && data.problems.length > 0) {
          setProblems(data.problems);
        }
      })
      .catch((err) => {
        console.error('Failed to load problems from backend:', err);
      });
  }

  useEffect(() => {
    refreshProblems();
    // Auto-analyze initial code on startup
    handleAnalyzeCode(`function addTwoNumbers(a, b) {\n  return a + b;\n}`);
  }, []);

  const activeProblem = problems.find((p) => p.id === selectedProblemId) || problems[0];

  function handleSelectProblem(problemId) {
    setSelectedProblemId(problemId);
    const p = problems.find((item) => item.id === problemId);
    if (p) {
      setStudentCode(p.starterCode);
      setAlternativeCode(p.alternativeCode || '');
      if (p.testCases && p.testCases.length > 0) {
        setActiveTestCases(p.testCases);
      }
      setRunResults(null);
      setChallengeResult(null);
      handleAnalyzeCode(p.starterCode);
    }
  }

  // 1. PRIMARY ACTION: Intelligent Code-First Analysis with Race-Condition Guard
  async function handleAnalyzeCode(codeToAnalyze, clarification) {
    const code = codeToAnalyze !== undefined ? codeToAnalyze : studentCode;
    if (!code || !code.trim()) return;

    const reqId = ++analysisReqSeq.current;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('http://localhost:5000/api/code/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: 'javascript',
          contextClarification: clarification || '',
        }),
      });

      const data = await res.json();

      // Guard against older, slower requests overwriting newer analyses
      if (reqId !== analysisReqSeq.current) {
        return;
      }

      if (data.success) {
        setAnalysisData(data);
        setAnalysisError(null);
        if (data.alternativeSolution && data.alternativeSolution.code) {
          setAlternativeCode(data.alternativeSolution.code);
          setAlternativeData(data.alternativeSolution);
        }
        if (data.suggestedTestCases && data.suggestedTestCases.length > 0) {
          setActiveTestCases(data.suggestedTestCases);
        }
        showToast(`Analyzed: ${data.inferredTitle} (${data.complexity?.time || ''})`);
      } else {
        setAnalysisError(data.message || 'Analysis could not be completed.');
        showToast(data.message || 'Analysis could not be completed.');
      }
    } catch (err) {
      if (reqId === analysisReqSeq.current) {
        console.error('Analysis error:', err);
        setAnalysisError(`Network error: ${err.message}`);
        showToast('Could not reach backend analysis service.');
      }
    } finally {
      if (reqId === analysisReqSeq.current) {
        setIsAnalyzing(false);
      }
    }
  }

  // 2. Safe execution runner in isolated child process
  async function handleRunCode(customTests) {
    if (!studentCode.trim()) return;
    setIsRunning(true);
    try {
      const testsToRun = customTests && customTests.length > 0 ? customTests : activeTestCases;
      const res = await fetch('http://localhost:5000/api/solve/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: activeProblem?.id || null,
          code: studentCode,
          functionName: analysisData?.functionName || null,
          testCases: testsToRun,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRunResults(data);
        if (data.evaluated > 0) {
          showToast(
            data.allPassed
              ? `All ${data.passed}/${data.evaluated} evaluated test cases passed!`
              : `${data.passed}/${data.evaluated} tests passed (${data.failed} failed).`
          );
        } else {
          showToast(`Executed ${data.total} test benches in isolated worker process.`);
        }
      } else {
        showToast(`Execution error: ${data.message}`);
      }
    } catch (err) {
      console.error('Run code failed:', err);
      showToast('Could not execute code against backend.');
    } finally {
      setIsRunning(false);
    }
  }

  // 3. Alternative solution generation
  async function handleGenerateAlternative() {
    if (!studentCode.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:5000/api/solve/alternative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: activeProblem?.id || null,
          problemTitle: analysisData?.inferredTitle || 'Custom Problem',
          problemDescription: analysisData?.inferredPurpose || '',
          functionName: analysisData?.functionName || null,
          userCode: studentCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlternativeCode(data.alternativeCode);
        setAlternativeData(data);
        showToast(`Alternative synthesized via ${data.source.replace('_', ' ')}.`);
      } else {
        showToast(data.message || 'AI alternative synthesis requires a GEMINI_API_KEY.');
      }
    } catch (err) {
      console.error('Alternative synthesis failed:', err);
      showToast('Synthesis failed. You can write your own alternative in the editor.');
    } finally {
      setIsGenerating(false);
    }
  }

  // 4. Counterexample Arena Challenge
  async function handleChallenge(customTests) {
    if (!studentCode.trim()) return;
    setIsChallenging(true);
    try {
      const testsToRun = customTests && customTests.length > 0 ? customTests : activeTestCases;
      const res = await fetch('http://localhost:5000/api/solve/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: activeProblem?.id || null,
          studentCode,
          alternativeCode: alternativeCode || (analysisData?.alternativeSolution?.code || ''),
          testCases: testsToRun,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChallengeResult(data);
        setCurrentPage('counterexample-arena');
        showToast(
          data.hasCounterexample
            ? 'Confirmed discrepancy detected in isolated sandbox!'
            : 'Both solutions passed all compatible test benches!'
        );
      } else {
        showToast(data.message || 'Arena challenge could not complete.');
      }
    } catch (err) {
      console.error('Challenge failed:', err);
      showToast('Could not run arena challenge.');
    } finally {
      setIsChallenging(false);
    }
  }

  // 5. Submit solution to SQLite
  async function handleSubmitSolution(currentTests) {
    if (!studentCode.trim()) return;
    try {
      const verdict = runResults
        ? runResults.allPassed
          ? 'ALL_PASSED'
          : 'PARTIAL_FAIL'
        : 'SUBMITTED';

      const res = await fetch('http://localhost:5000/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: activeProblem?.id || 'code-analysis',
          problemTitle: analysisData?.inferredTitle || 'Custom Code Analysis',
          language: 'javascript',
          studentCode,
          alternativeCode: alternativeCode || '',
          passedCount: runResults ? runResults.passed : 0,
          totalCount: runResults ? runResults.total : (currentTests ? currentTests.length : activeTestCases.length),
          verdict,
          timeTakenMs: runResults ? parseFloat(runResults.executionTimeMs) : 0,
          testResults: runResults ? runResults.tests : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Solution & test verdict saved to SQLite.');
        setCurrentPage('my-attempts');
      } else {
        showToast(data.message || 'Could not save attempt.');
      }
    } catch (err) {
      console.error('Submit solution error:', err);
      showToast('Could not save attempt to database.');
    }
  }

  // 6. Restore attempt from history
  function handleRestoreAttempt(attempt) {
    setStudentCode(attempt.student_code);
    if (attempt.alternative_code) {
      setAlternativeCode(attempt.alternative_code);
    }
    handleAnalyzeCode(attempt.student_code);
    setCurrentPage('solution-studio');
    showToast(`Restored submission: ${attempt.problem_title || 'Code Analysis'}.`);
  }

  return (
    <div className="app-container">
      {/* Persistent Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          problems={problems}
          selectedProblemId={selectedProblemId}
          onSelectProblem={handleSelectProblem}
        />

        {/* Page Views */}
        <main className="content-inner">
          {currentPage === 'home' && (
            <Home
              onNavigate={setCurrentPage}
              onSelectProblem={handleSelectProblem}
              problems={problems}
            />
          )}

          {currentPage === 'solution-studio' && (
            <SolutionStudio
              studentCode={studentCode}
              setStudentCode={setStudentCode}
              alternativeCode={alternativeCode}
              setAlternativeCode={setAlternativeCode}
              analysisData={analysisData}
              isAnalyzing={isAnalyzing}
              onAnalyzeCode={handleAnalyzeCode}
              onRunCode={handleRunCode}
              onGenerateAlternative={handleGenerateAlternative}
              onChallenge={handleChallenge}
              onSubmitSolution={handleSubmitSolution}
              runResults={runResults}
              isRunning={isRunning}
              isGenerating={isGenerating}
              onNavigate={setCurrentPage}
              activeTestCases={activeTestCases}
              setActiveTestCases={setActiveTestCases}
              analysisError={analysisError}
            />
          )}

          {currentPage === 'counterexample-arena' && (
            <CounterexampleArena
              problem={activeProblem}
              studentCode={studentCode}
              alternativeCode={alternativeCode}
              onChallenge={handleChallenge}
              challengeResult={challengeResult}
              isChallenging={isChallenging}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'solution-comparison' && (
            <SolutionComparison
              problem={activeProblem}
              studentCode={studentCode}
              alternativeCode={alternativeCode}
              alternativeData={alternativeData}
              runResults={runResults}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'syntax-tree' && (
            <SyntaxTree
              problem={activeProblem}
              studentCode={studentCode}
              setStudentCode={setStudentCode}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'break-and-run' && (
            <BreakAndRun
              problem={activeProblem}
              onNavigate={setCurrentPage}
              onSelectProblem={handleSelectProblem}
            />
          )}

          {currentPage === 'my-attempts' && (
            <MyAttempts
              onRestoreAttempt={handleRestoreAttempt}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              onNavigate={setCurrentPage}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notice">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
