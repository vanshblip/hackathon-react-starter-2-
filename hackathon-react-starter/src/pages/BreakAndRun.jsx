import React, { useState, useEffect, useRef, useMemo } from 'react';
import CodeEditor from '../components/CodeEditor';

export default function BreakAndRun({ problem, onNavigate, onSelectProblem }) {
  // Mode toggle: 'game' (Bug Hunt Interactive Game) vs 'classic' (Classic Trace Stepper)
  const [activeMode, setActiveMode] = useState('game');

  // ==========================================
  // BUG HUNT GAME STATE
  // ==========================================
  const [challenges, setChallenges] = useState([]);
  const [currentChallengeId, setCurrentChallengeId] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [currentCode, setCurrentCode] = useState('');
  const [suspectedLine, setSuspectedLine] = useState('');
  const [lineVerification, setLineVerification] = useState(null); // { correct: bool, message: string }
  const [unlockedHintsCount, setUnlockedHintsCount] = useState(0);
  const [revealedSolution, setRevealedSolution] = useState(null); // { faultyLine, bugExplanation, referenceSolution }
  const [highlightRange, setHighlightRange] = useState(null);

  // Execution & Test State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'console'
  const [completionBanner, setCompletionBanner] = useState(null); // { xpEarned, breakdown, isRepeat }

  // Game Progress & Scoring
  const [progress, setProgress] = useState({
    score: 0,
    streak: 0,
    completedChallenges: [],
    hintsUsed: 0,
  });
  const [showRulesModal, setShowRulesModal] = useState(false);

  // ==========================================
  // CLASSIC TRACE STEPPER STATE (BACKWARD COMPATIBILITY)
  // ==========================================
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [limitationMessage, setLimitationMessage] = useState('');

  // 1. Load Challenges and Player Progress on Mount
  useEffect(() => {
    fetchChallenges();
    fetchProgress();
  }, []);

  function fetchChallenges() {
    fetch('http://localhost:5000/api/challenges')
      .then((r) => r.json())
      .then((data) => {
        if (data.challenges && data.challenges.length > 0) {
          setChallenges(data.challenges);
          // Default to first challenge if none selected
          if (!currentChallengeId) {
            loadChallenge(data.challenges[0].id);
          }
        }
      })
      .catch((err) => console.error('Error fetching challenges:', err));
  }

  function fetchProgress() {
    fetch('http://localhost:5000/api/game/progress')
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) {
          setProgress(data.progress);
        }
      })
      .catch((err) => console.error('Error fetching game progress:', err));
  }

  // 2. Load Single Challenge Details
  function loadChallenge(id) {
    setCurrentChallengeId(id);
    setCompletionBanner(null);
    setLineVerification(null);
    setSuspectedLine('');
    setUnlockedHintsCount(0);
    setRevealedSolution(null);
    setTestResults(null);
    setExecutionLogs([]);
    setHighlightRange(null);

    fetch(`http://localhost:5000/api/challenges/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.challenge) {
          setCurrentCode(data.challenge.starterBuggyCode);
        }
      })
      .catch((err) => console.error('Error loading challenge:', err));
  }

  // Filtered list of challenges
  const filteredChallenges = useMemo(() => {
    if (difficultyFilter === 'All') return challenges;
    return challenges.filter((c) => c.difficulty === difficultyFilter);
  }, [challenges, difficultyFilter]);

  const activeChallenge = useMemo(() => {
    return challenges.find((c) => c.id === currentChallengeId) || challenges[0] || null;
  }, [challenges, currentChallengeId]);

  const isCurrentSolved = activeChallenge && progress.completedChallenges.includes(activeChallenge.id);

  // Compute Rank based on XP
  const playerRank = useMemo(() => {
    const s = progress.score;
    if (s >= 1000) return { title: 'Master Debugger', icon: 'military_tech', color: '#4f46e5' };
    if (s >= 500) return { title: 'Bug Hunter', icon: 'shield', color: '#059669' };
    if (s >= 200) return { title: 'Code Investigator', icon: 'search_check', color: '#0284c7' };
    return { title: 'Novice Debugger', icon: 'school', color: '#64748b' };
  }, [progress.score]);

  // Handle Random Challenge
  function handleRandomChallenge() {
    if (!challenges.length) return;
    const candidates = challenges.filter((c) => c.id !== currentChallengeId);
    const pool = candidates.length > 0 ? candidates : challenges;
    const next = pool[Math.floor(Math.random() * pool.length)];
    loadChallenge(next.id);
  }

  // Handle Next Unsolved Challenge
  function handleNextUnsolved() {
    const unsolved = challenges.find((c) => !progress.completedChallenges.includes(c.id));
    if (unsolved) {
      loadChallenge(unsolved.id);
    } else {
      // If all solved, pick next sequentially
      const idx = challenges.findIndex((c) => c.id === currentChallengeId);
      const nextIdx = (idx + 1) % challenges.length;
      loadChallenge(challenges[nextIdx].id);
    }
  }

  // Verify Suspected Faulty Line
  async function handleVerifyLine() {
    if (!suspectedLine || !activeChallenge) return;
    try {
      const res = await fetch(`http://localhost:5000/api/challenges/${activeChallenge.id}/verify-line`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectedLine }),
      });
      const data = await res.json();
      setLineVerification(data);
      if (data.correct) {
        const lineNum = parseInt(suspectedLine, 10);
        setHighlightRange({
          startLine: lineNum,
          endLine: lineNum,
          type: 'bug',
        });
      }
    } catch (err) {
      console.error('Verify line error:', err);
    }
  }

  // Unlock Next Progressive Hint
  function handleUnlockHint() {
    if (!activeChallenge || unlockedHintsCount >= (activeChallenge.hints?.length || 3)) return;
    const newCount = unlockedHintsCount + 1;
    setUnlockedHintsCount(newCount);

    // Persist hints used in progress
    fetch('http://localhost:5000/api/game/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hintsUsedDelta: 1 }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) setProgress(data.progress);
      })
      .catch((err) => console.error('Hint progress update error:', err));
  }

  // Reveal Solution / Give Up
  async function handleRevealSolution() {
    if (!activeChallenge) return;
    try {
      const res = await fetch(`http://localhost:5000/api/challenges/${activeChallenge.id}/solution`);
      const data = await res.json();
      if (data.success) {
        setRevealedSolution(data);
        if (data.faultyLine) {
          setHighlightRange({
            startLine: data.faultyLine,
            endLine: data.faultyLine,
            type: 'bug',
          });
        }
      }
    } catch (err) {
      console.error('Reveal solution error:', err);
    }
  }

  // Run Code (Safe child-process test execution)
  async function handleRunCode() {
    if (!activeChallenge || !currentCode.trim()) return;
    setIsRunning(true);
    setCompletionBanner(null);

    try {
      const res = await fetch('http://localhost:5000/api/solve/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: `bug-hunt-${activeChallenge.id}`,
          code: currentCode,
          functionName: activeChallenge.functionName,
          testCases: activeChallenge.testCases,
        }),
      });

      const data = await res.json();
      setTestResults(data);
      setExecutionLogs(data.logs || []);
      setActiveTab('tests');
    } catch (err) {
      console.error('Run code error:', err);
    } finally {
      setIsRunning(false);
    }
  }

  // Submit Fix (Final verification & scoring)
  async function handleSubmitFix() {
    if (!activeChallenge || !currentCode.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/solve/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: `bug-hunt-${activeChallenge.id}`,
          code: currentCode,
          functionName: activeChallenge.functionName,
          testCases: activeChallenge.testCases,
        }),
      });

      const data = await res.json();
      setTestResults(data);
      setExecutionLogs(data.logs || []);
      setActiveTab('tests');

      if (data.allPassed) {
        // Calculate points
        const baseXP = activeChallenge.xp || 100;
        const lineBonus = lineVerification?.correct ? 20 : 0;
        const noHintBonus = unlockedHintsCount === 0 ? 30 : 0;
        const hintPenalty = unlockedHintsCount * 10;
        const netXP = Math.max(10, baseXP + lineBonus + noHintBonus - hintPenalty);

        const isRepeat = progress.completedChallenges.includes(activeChallenge.id);
        const awardedXP = isRepeat ? 0 : netXP;

        // Persist game progress
        const progRes = await fetch('http://localhost:5000/api/game/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scoreDelta: awardedXP,
            challengeId: activeChallenge.id,
            isStreakIncrement: true,
          }),
        });
        const progData = await progRes.json();
        if (progData.progress) setProgress(progData.progress);

        // Record attempt in SQLite database
        await fetch('http://localhost:5000/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: `bug-hunt-${activeChallenge.id}`,
            problemTitle: `Bug Hunt: ${activeChallenge.title}`,
            language: 'javascript',
            studentCode: currentCode,
            passedCount: data.passed || activeChallenge.testCases.length,
            totalCount: data.total || activeChallenge.testCases.length,
            verdict: 'ALL_PASSED',
            timeTakenMs: data.executionTimeMs || 0,
            testResults: data.testResults,
          }),
        });

        // Automatically reveal bug explanation upon successful solve
        handleRevealSolution();

        setCompletionBanner({
          xpEarned: awardedXP,
          isRepeat,
          breakdown: {
            base: baseXP,
            lineBonus,
            noHintBonus,
            hintPenalty,
            total: netXP,
          },
        });
      } else {
        // Failed fix resets streak
        const progRes = await fetch('http://localhost:5000/api/game/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetStreak: true }),
        });
        const progData = await progRes.json();
        if (progData.progress) setProgress(progData.progress);
      }
    } catch (err) {
      console.error('Submit fix error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ==========================================
  // CLASSIC TRACE STEPPER LOGIC
  // ==========================================
  useEffect(() => {
    if (activeMode !== 'classic') return;
    fetch('http://localhost:5000/api/solve/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId: problem?.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.isSupported === false) {
          setIsSupported(false);
          setLimitationMessage(data.message);
        } else if (data.steps && data.steps.length > 0) {
          setIsSupported(true);
          setLimitationMessage('');
          setSteps(data.steps);
          setCurrentStepIndex(0);
        }
      })
      .catch((err) => {
        console.error('Trace fetch error:', err);
        setIsSupported(false);
        setLimitationMessage('Execution trace could not be generated.');
      });
  }, [problem, activeMode]);

  const activeStep = steps[currentStepIndex] || {
    step: 1,
    line: 1,
    statement: problem?.starterCode?.split('\n')[0] || 'function solution(input) {',
    callStack: [`${problem?.functionName || 'solution'}(input)`],
    variables: { input: '[1, 2, 3]' },
    explanation: 'Initializing debugging context.',
  };

  const codeSnippet = (problem?.starterCode || '').split('\n');

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="breadcrumbs">
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Bug Hunt (Break &amp; Run)</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 2 }}>
            Bug Hunt — Interactive Debugging Game
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Diagnose failing test benches, identify faulty line invariants, and submit verified bug fixes in the child-process sandbox.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-low)', padding: 4, borderRadius: 8, border: '1px solid var(--border-card)' }}>
          <button
            onClick={() => setActiveMode('game')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: activeMode === 'game' ? '#ffffff' : 'transparent',
              color: activeMode === 'game' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeMode === 'game' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: activeMode === 'game' ? '1px solid var(--border-card)' : 'none',
            }}
          >
            <span className="material-symbols-outlined text-[17px]">sports_esports</span>
            <span>Bug Hunt Arena</span>
          </button>

          <button
            onClick={() => setActiveMode('classic')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: activeMode === 'classic' ? '#ffffff' : 'transparent',
              color: activeMode === 'classic' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeMode === 'classic' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: activeMode === 'classic' ? '1px solid var(--border-card)' : 'none',
            }}
          >
            <span className="material-symbols-outlined text-[17px]">history</span>
            <span>Classic Trace Stepper</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE A: BUG HUNT INTERACTIVE DEBUGGING GAME                    */}
      {/* ============================================================== */}
      {activeMode === 'game' && (
        <div className="space-y-5">
          {/* A. Player HUD & Stats Bar */}
          <div
            className="card"
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              background: '#ffffff',
              border: '1px solid var(--border-card)',
            }}
          >
            {/* Left: Player Profile & Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined text-[22px]">{playerRank.icon}</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{playerRank.title}</span>
                  <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: 10.5, fontWeight: 600 }}>
                    Player Profile
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                  CodeLens Interactive Debugging League
                </div>
              </div>
            </div>

            {/* Middle: Metrics Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Score (XP) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border-card)' }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#eab308' }}>
                  stars
                </span>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Score</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{progress.score} XP</div>
                </div>
              </div>

              {/* Streak */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border-card)' }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#ea580c' }}>
                  local_fire_department
                </span>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>Active Streak</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{progress.streak} Solves</div>
                </div>
              </div>

              {/* Solved Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border-card)' }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#059669' }}>
                  check_circle
                </span>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>Completed</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                    {progress.completedChallenges.length} / {challenges.length}
                  </div>
                </div>
              </div>

              {/* Hints Used */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border-card)' }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#0284c7' }}>
                  lightbulb
                </span>
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>Hints Used</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{progress.hintsUsed}</div>
                </div>
              </div>
            </div>

            {/* Right: Scoring Rules Button */}
            <button
              onClick={() => setShowRulesModal(!showRulesModal)}
              className="btn-secondary"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Scoring Rules</span>
            </button>
          </div>

          {/* Expandable Scoring Rules Banner */}
          {showRulesModal && (
            <div
              className="card"
              style={{
                padding: '16px 20px',
                background: '#f8fafc',
                border: '1px solid var(--border-card)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
                    calculate
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                    Bug Hunt Transparent Scoring Formula
                  </span>
                </div>
                <button
                  onClick={() => setShowRulesModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-subtle)' }}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid var(--border-card)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Base Challenge XP</div>
                  <div>Easy: <strong>+100 XP</strong> | Medium: <strong>+150 XP</strong> | Hard: <strong>+200 XP</strong></div>
                </div>
                <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid var(--border-card)' }}>
                  <div style={{ fontWeight: 600, color: '#059669' }}>Faulty Line Detection Bonus</div>
                  <div>Identify the suspected line correctly before submitting: <strong>+20 XP Bonus</strong></div>
                </div>
                <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid var(--border-card)' }}>
                  <div style={{ fontWeight: 600, color: '#0284c7' }}>Flawless Solver Bonus</div>
                  <div>Solve the challenge with 0 hints unlocked: <strong>+30 XP Bonus</strong></div>
                </div>
                <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid var(--border-card)' }}>
                  <div style={{ fontWeight: 600, color: '#dc2626' }}>Hint Deductions &amp; Anti-Grind</div>
                  <div>Each unlocked hint: <strong>-10 XP</strong>. Repeating already solved challenges awards <strong>+0 XP</strong>.</div>
                </div>
              </div>
            </div>
          )}

          {/* B. Challenge Selector & Quick Navigator Bar */}
          <div
            className="card"
            style={{
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Difficulty Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginRight: 4 }}>Tier:</span>
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => {
                const isSelected = difficultyFilter === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: isSelected ? 'var(--primary)' : 'var(--surface-low)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                    }}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>

            {/* Challenge Dropdown Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 440 }}>
              <select
                value={currentChallengeId}
                onChange={(e) => loadChallenge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-card)',
                  background: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              >
                {filteredChallenges.map((c) => {
                  const isSolved = progress.completedChallenges.includes(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {isSolved ? '✓ ' : '○ '} [{c.difficulty}] {c.title} ({c.xp} XP)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Action Buttons: Next Unsolved & Random */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleNextUnsolved}
                className="btn-primary"
                style={{ fontSize: 12, padding: '7px 14px' }}
                title="Jump to next unsolved challenge"
              >
                <span className="material-symbols-outlined text-[16px]">skip_next</span>
                <span>Next Unsolved</span>
              </button>

              <button
                onClick={handleRandomChallenge}
                className="btn-secondary"
                style={{ fontSize: 12, padding: '7px 12px' }}
                title="Pick a random challenge"
              >
                <span className="material-symbols-outlined text-[16px]">shuffle</span>
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* C. Challenge Briefing Banner */}
          {activeChallenge && (
            <div
              className="card"
              style={{
                padding: '18px 22px',
                borderLeft: `4px solid ${
                  activeChallenge.difficulty === 'Easy' ? '#059669' :
                  activeChallenge.difficulty === 'Medium' ? '#d97706' : '#dc2626'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          activeChallenge.difficulty === 'Easy' ? '#dcfce7' :
                          activeChallenge.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                        color:
                          activeChallenge.difficulty === 'Easy' ? '#166534' :
                          activeChallenge.difficulty === 'Medium' ? '#92400e' : '#991b1b',
                      }}
                    >
                      {activeChallenge.difficulty}
                    </span>

                    <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 600 }}>
                      Category: {activeChallenge.category}
                    </span>

                    <span style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                      ID: {activeChallenge.id}
                    </span>

                    {isCurrentSolved && (
                      <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700 }}>
                        ✓ Solved
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>
                    {activeChallenge.title}
                  </h2>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4, maxWidth: 860 }}>
                    {activeChallenge.taskDescription}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>Reward</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>+{activeChallenge.xp} XP</div>
                </div>
              </div>

              {/* Expected Invariant Callout */}
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: 'var(--surface-low)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12.5,
                  color: 'var(--text-main)',
                }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
                  target
                </span>
                <div>
                  <strong>Expected Behavior:</strong> {activeChallenge.expectedBehavior}
                </div>
              </div>
            </div>
          )}

          {/* D. Completion Banner (When Submitted & Passed) */}
          {completionBanner && (
            <div
              className="card"
              style={{
                padding: '20px 24px',
                background: '#f0fdf4',
                borderColor: '#86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="material-symbols-outlined text-[36px]" style={{ color: '#059669' }}>
                  emoji_events
                </span>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#166534' }}>
                    Challenge Completed! All Test Benches Passing.
                  </h3>
                  <div style={{ fontSize: 13, color: '#15803d', marginTop: 3 }}>
                    {completionBanner.isRepeat ? (
                      <span>You previously solved this challenge (+0 XP, repeated solve).</span>
                    ) : (
                      <span>
                        Earned <strong>+{completionBanner.xpEarned} XP</strong> (Base: +{completionBanner.breakdown.base}
                        {completionBanner.breakdown.lineBonus > 0 && ` | Line Bonus: +${completionBanner.breakdown.lineBonus}`}
                        {completionBanner.breakdown.noHintBonus > 0 && ` | Zero-Hint Bonus: +${completionBanner.breakdown.noHintBonus}`}
                        {completionBanner.breakdown.hintPenalty > 0 && ` | Hint Deduction: -${completionBanner.breakdown.hintPenalty}`})!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleNextUnsolved}
                style={{ fontSize: 13, padding: '8px 18px' }}
              >
                <span>Next Challenge</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* E. Main Two-Column Gameplay Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* LEFT COLUMN: Code Editor, Line Suspect Tool, Actions */}
            <div className="space-y-4">
              {/* Faulty Line Detection Tool Header */}
              <div
                className="card"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: '#d97706' }}>
                    troubleshoot
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                    Suspected Faulty Line:
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Line #"
                    value={suspectedLine}
                    onChange={(e) => setSuspectedLine(e.target.value)}
                    style={{
                      width: 75,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border-card)',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />

                  <button
                    onClick={handleVerifyLine}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    disabled={!suspectedLine}
                  >
                    <span>Check Line</span>
                  </button>
                </div>

                {lineVerification && (
                  <div style={{ width: '100%', marginTop: 4 }}>
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        background: lineVerification.correct ? '#f0fdf4' : '#fffbeb',
                        color: lineVerification.correct ? '#166534' : '#92400e',
                        border: `1px solid ${lineVerification.correct ? '#bbf7d0' : '#fde68a'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {lineVerification.correct ? 'check_circle' : 'info'}
                      </span>
                      <span>{lineVerification.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Monaco Code Editor */}
              <div
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: '1px solid var(--border-card)',
                }}
              >
                <div
                  style={{
                    padding: '8px 16px',
                    background: 'var(--surface-low)',
                    borderBottom: '1px solid var(--border-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--text-subtle)' }}>
                      code
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                      Target Function ({activeChallenge?.functionName || 'solution'})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (activeChallenge) {
                        setCurrentCode(activeChallenge.starterBuggyCode);
                        setHighlightRange(null);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11.5,
                      color: 'var(--text-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    <span>Reset Buggy Code</span>
                  </button>
                </div>

                <CodeEditor
                  code={currentCode}
                  onChange={(val) => setCurrentCode(val || '')}
                  height="360px"
                  highlightRange={highlightRange}
                />
              </div>

              {/* Action Buttons: Run Code & Submit Fix */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-secondary"
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    style={{ fontSize: 13, padding: '8px 18px' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    className="btn-primary"
                    onClick={handleSubmitFix}
                    disabled={isRunning || isSubmitting}
                    style={{ fontSize: 13, padding: '8px 20px', background: '#059669', borderColor: '#059669' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    <span>{isSubmitting ? 'Evaluating Suite...' : 'Submit Fix'}</span>
                  </button>
                </div>

                <button
                  onClick={handleRevealSolution}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>Give Up / Reveal Explanation</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Progressive Hints & Test Results Panels */}
            <div className="space-y-4">
              {/* 1. Progressive Hints Card */}
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: '#eab308' }}>
                      lightbulb
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      Progressive Hints ({unlockedHintsCount} / {activeChallenge?.hints?.length || 3})
                    </span>
                  </div>

                  {unlockedHintsCount < (activeChallenge?.hints?.length || 3) && (
                    <button
                      onClick={handleUnlockHint}
                      className="btn-secondary"
                      style={{ fontSize: 11.5, padding: '4px 10px', color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
                    >
                      <span className="material-symbols-outlined text-[15px]">lock_open</span>
                      <span>Unlock Hint (-10 XP)</span>
                    </button>
                  )}
                </div>

                {unlockedHintsCount === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', fontStyle: 'italic', padding: '6px 0' }}>
                    No hints unlocked yet. Solve without hints for a +30 XP Flawless Solver bonus!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeChallenge?.hints?.slice(0, unlockedHintsCount).map((hint, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          fontSize: 12.5,
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>Hint {idx + 1}:</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Revealed Explanation / Solution (When unlocked or solved) */}
              {revealedSolution && (
                <div
                  className="card"
                  style={{
                    padding: '16px 18px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
                      menu_book
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      Root Cause Analysis &amp; Reference Solution
                    </span>
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                    {revealedSolution.bugExplanation}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                      Reference Code:
                    </span>
                    <button
                      onClick={() => setCurrentCode(revealedSolution.referenceSolution)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 11,
                        color: 'var(--primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Copy to Editor
                    </button>
                  </div>

                  <pre
                    style={{
                      background: '#090d16',
                      color: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      overflowX: 'auto',
                    }}
                  >
                    <code>{revealedSolution.referenceSolution}</code>
                  </pre>
                </div>
              )}

              {/* 3. Test Results & Execution Diagnostics */}
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--primary)' }}>
                      fact_check
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                      Evaluation &amp; Test Suite
                    </span>
                  </div>

                  {/* Tabs: Test Cases vs Console */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => setActiveTab('tests')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: activeTab === 'tests' ? 'var(--primary)' : 'var(--surface-low)',
                        color: activeTab === 'tests' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      Test Cases ({activeChallenge?.testCases?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('console')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: activeTab === 'console' ? 'var(--primary)' : 'var(--surface-low)',
                        color: activeTab === 'console' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      Console ({executionLogs.length})
                    </button>
                  </div>
                </div>

                {/* Tab Content: Tests */}
                {activeTab === 'tests' && (
                  <div>
                    {testResults && (
                      <div
                        style={{
                          marginBottom: 12,
                          padding: '8px 12px',
                          borderRadius: 6,
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: testResults.allPassed ? '#f0fdf4' : '#fef2f2',
                          color: testResults.allPassed ? '#166534' : '#991b1b',
                          border: `1px solid ${testResults.allPassed ? '#bbf7d0' : '#fecaca'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          {testResults.allPassed
                            ? `✓ All ${testResults.total} Tests Passed`
                            : `✗ ${testResults.failed} of ${testResults.total} Tests Failed`}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 500 }}>
                          Runtime: {testResults.executionTimeMs || 0}ms
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                      {(testResults?.testResults || activeChallenge?.testCases || []).map((t, idx) => {
                        const hasRun = testResults && testResults.testResults;
                        const isPass = hasRun ? t.passed : null;
                        return (
                          <div
                            key={t.id || idx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 6,
                              border: `1px solid ${
                                isPass === true ? '#bbf7d0' : isPass === false ? '#fecaca' : 'var(--border-card)'
                              }`,
                              background: isPass === true ? '#f0fdf4' : isPass === false ? '#fef2f2' : '#ffffff',
                              fontSize: 12,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  className="material-symbols-outlined text-[16px]"
                                  style={{
                                    color: isPass === true ? '#059669' : isPass === false ? '#dc2626' : 'var(--text-subtle)',
                                  }}
                                >
                                  {isPass === true ? 'check_circle' : isPass === false ? 'cancel' : 'help_outline'}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                  Test {idx + 1}: {t.name}
                                </span>
                              </div>

                              {t.isEdgeCase && (
                                <span
                                  style={{
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    background: '#f1f5f9',
                                    color: '#475569',
                                  }}
                                >
                                  Edge Case
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
                              <div>
                                <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-sans)' }}>Input: </span>
                                <span>{JSON.stringify(t.input)}</span>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-sans)' }}>Expected: </span>
                                <span style={{ color: '#059669', fontWeight: 600 }}>{JSON.stringify(t.expected)}</span>
                              </div>
                            </div>

                            {hasRun && t.actual !== undefined && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-card)', fontSize: 11.5, fontFamily: 'var(--font-mono)' }}>
                                <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-sans)' }}>Actual: </span>
                                <span style={{ color: isPass ? '#059669' : '#dc2626', fontWeight: 600 }}>
                                  {JSON.stringify(t.actual)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab Content: Console */}
                {activeTab === 'console' && (
                  <div
                    style={{
                      background: '#090d16',
                      color: '#f8fafc',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      minHeight: 180,
                      maxHeight: 320,
                      overflowY: 'auto',
                    }}
                  >
                    {executionLogs.length === 0 ? (
                      <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                        No console.log output captured. Click "Run Code" to inspect output.
                      </div>
                    ) : (
                      executionLogs.map((log, i) => (
                        <div key={i} style={{ lineHeight: 1.6 }}>
                          <span style={{ color: '#64748b' }}>&gt; </span>
                          <span>{log}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE B: CLASSIC TRACE STEPPER (PRESERVED STEPPING DEBUGGER)   */}
      {/* ============================================================== */}
      {activeMode === 'classic' && (
        <div className="space-y-6">
          {!isSupported ? (
            <div
              className="card"
              style={{
                backgroundColor: '#fffbeb',
                borderColor: '#fcd34d',
                padding: 24,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <span className="material-symbols-outlined text-[32px]" style={{ color: '#d97706' }}>
                schedule
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
                  Debugger Scope Boundary: Custom Problem Selected
                </h3>
                <p style={{ fontSize: 13, color: '#b45309', lineHeight: 1.5, maxWidth: 680 }}>
                  {limitationMessage ||
                    `Break & Run time-travel stepping is pre-calibrated for supported algorithmic demonstrations (Find Maximum, Reverse an Array, Add Two Numbers).`}
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      onSelectProblem('quick-reverse-array');
                      setIsSupported(true);
                    }}
                    style={{ fontSize: 12 }}
                  >
                    <span>Launch "Reverse an Array" Stepper</span>
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      onSelectProblem('find-max');
                      setIsSupported(true);
                    }}
                    style={{ fontSize: 12 }}
                  >
                    <span>Launch "Find Maximum" Stepper</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
              {/* Left: Code Viewer with Active Line Highlight */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '10px 16px',
                    background: 'var(--surface-low)',
                    borderBottom: '1px solid var(--border-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)' }}>
                    Execution Frame — Line {activeStep.line}
                  </span>
                  <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: 11 }}>
                    Step {currentStepIndex + 1} of {steps.length || 1}
                  </span>
                </div>

                <div
                  style={{
                    background: '#090d16',
                    padding: 16,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    lineHeight: '22px',
                    color: '#f8fafc',
                    maxHeight: 380,
                    overflowY: 'auto',
                  }}
                >
                  {codeSnippet.map((lineText, idx) => {
                    const lineNum = idx + 1;
                    const isCurrent = lineNum === activeStep.line;
                    return (
                      <div
                        key={lineNum}
                        style={{
                          display: 'flex',
                          backgroundColor: isCurrent ? 'rgba(79, 70, 229, 0.25)' : 'transparent',
                          borderLeft: isCurrent ? '3px solid #818cf8' : '3px solid transparent',
                          paddingLeft: 6,
                        }}
                      >
                        <span style={{ width: 32, color: '#64748b', userSelect: 'none', textAlign: 'right', marginRight: 12 }}>
                          {lineNum}
                        </span>
                        <span>{lineText}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Stepper Controls */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#ffffff',
                    borderTop: '1px solid var(--border-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setCurrentStepIndex(0)}
                      disabled={currentStepIndex === 0}
                      style={{ padding: '6px 10px' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">first_page</span>
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => currentStepIndex > 0 && setCurrentStepIndex(currentStepIndex - 1)}
                      disabled={currentStepIndex === 0}
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      <span>Step Back</span>
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => currentStepIndex < steps.length - 1 && setCurrentStepIndex(currentStepIndex + 1)}
                      disabled={currentStepIndex >= steps.length - 1}
                      style={{ padding: '6px 14px', fontSize: 12 }}
                    >
                      <span>Step Forward</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStepIndex(steps.length - 1)}
                    disabled={currentStepIndex >= steps.length - 1}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    <span>Run to End</span>
                  </button>
                </div>
              </div>

              {/* Right: State Inspector & Variables */}
              <div className="space-y-4">
                <div className="card" style={{ padding: '16px 18px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                    Step Explanation
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {activeStep.explanation}
                  </p>
                </div>

                <div className="card" style={{ padding: '16px 18px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>
                    Variables in Scope
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(activeStep.variables || {}).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'var(--surface-low)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{key}</span>
                        <span style={{ color: 'var(--text-main)' }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: '16px 18px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                    Call Stack
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(activeStep.callStack || []).map((frame, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 4,
                          background: '#f8fafc',
                          border: '1px solid var(--border-card)',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {frame}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
