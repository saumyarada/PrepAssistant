export default function TopBar({ statusText, onHome, onOpenTools }) {
  return (
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
        <div className="status-pill mono">{statusText}</div>
      </div>
    </div>
  );
}
