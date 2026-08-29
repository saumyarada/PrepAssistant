import { useState, useRef } from "react";
import TopBar from "./TopBar.jsx";
import Hero from "./Hero.jsx";
import ProblemGrid from "./ProblemGrid.jsx";
import StatRow from "./StatRow.jsx";
import PatternPicker from "./PatternPicker.jsx";
import { HintTool, FixTool } from "./ToolCards.jsx";
import PromptBar from "./PromptBar.jsx";
import { fetchProfile, fetchPatternCoverage } from "./api.js";
import { DEFAULT_SUGGESTIONS, EXPANDED_SUGGESTIONS } from "./patterns.js";

function randomProblems(problems, count = 4, previous = []) {
  const previousTitles = new Set(previous.map((problem) => problem.title));
  const shuffled = [...problems];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const target = Math.min(count, shuffled.length);
  const fresh = shuffled.filter((problem) => !previousTitles.has(problem.title));
  const next = fresh.slice(0, target);
  if (next.length === target) return next;

  return [...next, ...shuffled.filter((problem) => !next.includes(problem))].slice(0, target);
}

export default function App() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [profile, setProfile] = useState(null);
  const [patternData, setPatternData] = useState(null);
  const [patternError, setPatternError] = useState(null);
  const [promptStatus, setPromptStatus] = useState("");
  const [promptError, setPromptError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState("All algorithms");
  const [suggestedProblems, setSuggestedProblems] = useState(() =>
    randomProblems(EXPANDED_SUGGESTIONS)
  );
  const [solvedPage, setSolvedPage] = useState(0);
  const [toolsPage, setToolsPage] = useState(false);
  const [activeTool, setActiveTool] = useState("hint");

  // Controlled problem-statement text for each tool, so a suggestion
  // card can populate it directly.
  const [hintProblem, setHintProblem] = useState("");
  const [hintFocusToken, setHintFocusToken] = useState(0);
  const [fixProblem, setFixProblem] = useState("");
  const [fixFocusToken, setFixFocusToken] = useState(0);

  const hintSectionRef = useRef(null);
  const fixSectionRef = useRef(null);

  function requestHint(title) {
    setHintProblem(title);
    setHintFocusToken((t) => t + 1);
    setActiveTool("hint");
    setToolsPage(true);
  }

  function requestFix(title) {
    setFixProblem(title);
    setFixFocusToken((t) => t + 1);
    setActiveTool("fix");
    setToolsPage(true);
  }

  function openTools(tool = "hint") {
    setActiveTool(tool);
    setToolsPage(true);
  }

  function handleHome() {
    setUserId(null);
    setUsername(null);
    setProfile(null);
    setPatternData(null);
    setPatternError(null);
    setLoaded(false);
    setSelectedPattern("All algorithms");
    setSuggestedProblems(randomProblems(EXPANDED_SUGGESTIONS));
    setSolvedPage(0);
    setPromptStatus("");
    setPromptError(false);
    setToolsPage(false);
  }

  async function handleUsernameSubmit(name) {
    setPromptStatus("loading profile...");
    setPromptError(false);
    setSelectedPattern("All algorithms");
    setSuggestedProblems(randomProblems(EXPANDED_SUGGESTIONS));
    setSolvedPage(0);

    try {
      const data = await fetchProfile(name);
      setUserId(data.user_id);
      setUsername(name);
      setProfile(data);
      setLoaded(true);

      setPromptStatus("loading pattern coverage...");
      try {
        const patterns = await fetchPatternCoverage(name);
        setPatternData(patterns);
        setPatternError(null);
        setSuggestedProblems(randomProblems(patterns.recommended_problems || []));
      } catch (err) {
        setPatternError(err.message);
      }

      setPromptStatus(`profile synced for @${name}`);
    } catch (err) {
      setPromptStatus(err.message || "could not reach the backend");
      setPromptError(true);
    }
  }

  const availablePatterns = [...new Set(DEFAULT_SUGGESTIONS.map((problem) => problem.pattern))];
  const syncedSuggestions = patternData?.recommended_problems || [];
  const suggestionPool = loaded ? syncedSuggestions : EXPANDED_SUGGESTIONS;
  const clickedPatternSource = suggestionPool;
  const syncedPatterns = [...new Set(suggestionPool.map((problem) => problem.pattern))];
  const visiblePatterns = loaded ? syncedPatterns : availablePatterns;
  const selectedProblemPool = clickedPatternSource.filter(
    (problem) => problem.pattern === selectedPattern
  );
  const activeSuggestionPool = selectedPattern === "All algorithms" ? suggestionPool : selectedProblemPool;
  const refreshSource =
    selectedPattern === "All algorithms"
      ? loaded
        ? syncedSuggestions
        : EXPANDED_SUGGESTIONS
      : selectedProblemPool;
  const hasProblemRefresh = refreshSource.length > 4;
  const visibleSuggestions =
    selectedPattern === "All algorithms" ? suggestedProblems : suggestedProblems.filter(
      (problem) => problem.pattern === selectedPattern
    );
  const rankedPatterns = patternData?.coverage
    ? Object.entries(patternData.coverage).sort(
        (a, b) =>
          b[1].solved / (b[1].total || 1) - a[1].solved / (a[1].total || 1)
      )
    : [];
  const bestPatterns = rankedPatterns.slice(0, 3).map(([pattern]) => pattern);
  const weakestPatterns = patternData?.weakest_patterns?.slice(0, 3) || [];
  const solvedProblems = patternData?.solved_problems?.length
    ? patternData.solved_problems
    : profile?.solved_problems || [];
  const solvedStart = solvedPage * 4;
  const visibleSolvedProblems = solvedProblems.slice(solvedStart, solvedStart + 4);
  const solvedPageCount = Math.ceil(solvedProblems.length / 4);

  return (
    <>
      <TopBar
        statusText={loaded ? `@${username} · synced` : "no profile loaded"}
        onHome={toolsPage ? () => setToolsPage(false) : loaded ? handleHome : undefined}
        onOpenTools={openTools}
      />

      {!loaded && !toolsPage && <Hero />}

      {toolsPage ? (
        <div className="section tools-page">
          <div className="tools-page-heading">
            <div>
              <div className="section-label mono">practice tools</div>
              <h1 className="display">Work through your problem.</h1>
            </div>
            <div className="tool-switcher" role="tablist" aria-label="Choose a practice tool">
              <button
                className={activeTool === "hint" ? "selected" : ""}
                onClick={() => setActiveTool("hint")}
              >
                Get hint
              </button>
              <button
                className={activeTool === "fix" ? "selected" : ""}
                onClick={() => setActiveTool("fix")}
              >
                Bug fixer
              </button>
            </div>
          </div>
          <div ref={hintSectionRef} className={activeTool === "hint" ? "tool-visible" : "tool-hidden"}>
            <HintTool
              userId={userId}
              problem={hintProblem}
              onProblemChange={setHintProblem}
              focusToken={hintFocusToken}
            />
          </div>
          <div ref={fixSectionRef} className={activeTool === "fix" ? "tool-visible" : "tool-hidden"}>
            <FixTool
              userId={userId}
              problem={fixProblem}
              onProblemChange={setFixProblem}
              focusToken={fixFocusToken}
            />
          </div>
        </div>
      ) : (
        <>

      {loaded && (
        <div className="section profile-summary">
          <div className="section-label mono">your progress</div>
          <StatRow solvedByDifficulty={profile?.solved_by_difficulty} />
          {patternData && !patternData.note && (
            <div className="pattern-highlights">
              {weakestPatterns.length > 0 && (
                <div className="pattern-note weak-patterns">
                  Weakest patterns: <strong>{weakestPatterns.join(", ")}</strong>
                </div>
              )}
              {bestPatterns.length > 0 && (
                <div className="pattern-note best-patterns">
                  Best patterns: <strong>{bestPatterns.join(", ")}</strong>
                </div>
              )}
            </div>
          )}
          {solvedProblems.length > 0 && (
            <>
              <div className="solved-heading">
                <div className="section-label mono">recently solved</div>
                {solvedPageCount > 1 && (
                  <div className="solved-nav">
                    <button
                      className="arrow-button"
                      aria-label="Previous solved problems"
                      disabled={solvedPage === 0}
                      onClick={() => setSolvedPage((page) => Math.max(0, page - 1))}
                    >
                      &#8592;
                    </button>
                    <span className="page-count mono">{solvedPage + 1}/{solvedPageCount}</span>
                    <button
                      className="arrow-button"
                      aria-label="Next solved problems"
                      disabled={solvedPage === solvedPageCount - 1}
                      onClick={() => setSolvedPage((page) => Math.min(solvedPageCount - 1, page + 1))}
                    >
                      &#8594;
                    </button>
                  </div>
                )}
              </div>
              <ProblemGrid
                problems={visibleSolvedProblems}
                onHintClick={requestHint}
                onFixClick={requestFix}
              />
            </>
          )}
        </div>
      )}

      <div className="section">
        <div className="section-label mono">choose an algorithm</div>
        <PatternPicker
          patterns={visiblePatterns}
          selectedPattern={selectedPattern}
          compact={loaded}
          onSelect={(pattern) => {
            setSelectedPattern(pattern);
            const pool = pattern === "All algorithms" ? suggestionPool : clickedPatternSource.filter(
              (problem) => problem.pattern === pattern
            );
            setSuggestedProblems(randomProblems(pool, 4, suggestedProblems));
          }}
        />
        <div className="suggestion-heading">
          <span className="section-label mono">suggestions</span>
          <span className="selected-pattern">{selectedPattern}</span>
          {hasProblemRefresh && (
            <button
              className="refresh-button mono"
              onClick={() => {
                setSuggestedProblems(randomProblems(activeSuggestionPool, 4, suggestedProblems));
              }}
            >
              refresh problems
            </button>
          )}
        </div>
        <div className="suggestion-grid">
          <ProblemGrid
            problems={visibleSuggestions}
            onHintClick={requestHint}
            onFixClick={requestFix}
          />
        </div>
      </div>

      {loaded && (
        <div className="section">
          {patternError && <div className="ai-output error">{patternError}</div>}
          {patternData?.note && <div className="ai-output">{patternData.note}</div>}
        </div>
      )}

        </>
      )}

      <PromptBar onSubmit={handleUsernameSubmit} status={promptStatus} statusError={promptError} />
    </>
  );
}
