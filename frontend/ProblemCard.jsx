import { colorVarFor } from "./patterns.js";

export default function ProblemCard({ title, pattern, difficulty, onHintClick, onFixClick }) {
  return (
    <div
      className="problem-card"
      style={{ "--card-color": colorVarFor(pattern) }}
      onClick={() => onHintClick && onHintClick(title)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onHintClick) onHintClick(title);
      }}
    >
      <div className="pattern-tag">{pattern}</div>
      <div className="problem-title">{title}</div>
      <div className="difficulty">{difficulty}</div>
      <div className="card-actions">
        <button
          className="card-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onHintClick && onHintClick(title);
          }}
        >
          Get hint
        </button>
        <button
          className="card-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onFixClick && onFixClick(title);
          }}
        >
          Bug fixer
        </button>
      </div>
    </div>
  );
}
