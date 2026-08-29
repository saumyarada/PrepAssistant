import { useEffect, useState } from "react";

export default function TopBar({ statusText, onHome, onOpenTools }) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!showInfo) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setShowInfo(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showInfo]);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          {onHome && (
            <button className="home-button mono" onClick={onHome} aria-label="Go home">
              <span aria-hidden="true">&#8592;</span> Home
            </button>
          )}
          <div className="logo display">
            prep<span className="dot">.</span>assistant
          </div>
        </div>
        <div className="topbar-right">
          {onOpenTools && (
            <div className="topbar-actions">
              <button onClick={() => onOpenTools("hint")}>Get hint</button>
              <button onClick={() => onOpenTools("fix")}>Bug fixer</button>
            </div>
          )}
          <button
            className="info-button"
            aria-label="About PrepAssistant"
            aria-haspopup="dialog"
            aria-expanded={showInfo}
            onClick={() => setShowInfo(true)}
          >
            i
          </button>
          <div className="status-pill mono">{statusText}</div>
        </div>
      </div>
      {showInfo && (
        <div className="info-backdrop" role="presentation" onClick={() => setShowInfo(false)}>
          <section
            className="info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="info-modal-header">
              <div>
                <div className="section-label mono">about the tool</div>
                <h2 id="info-title" className="display">PrepAssistant</h2>
              </div>
              <button className="info-close" aria-label="Close information" onClick={() => setShowInfo(false)}>
                <span aria-hidden="true">&#215;</span>
              </button>
            </div>
            <p>PrepAssistant helps you practice LeetCode with personalized problem recommendations, progress tracking, and AI support.</p>
            <div className="info-steps">
              <div><strong>1. Choose a problem</strong><span>Browse suggestions or filter by algorithm.</span></div>
              <div><strong>2. See your progress</strong><span>Enter your LeetCode username to view recent activity and solved counts.</span></div>
              <div><strong>3. Get unstuck</strong><span>Ask for guided help, or diagnose a failing solution with AI.</span></div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
