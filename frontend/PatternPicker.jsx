import { colorVarFor, PATTERN_IMPORTANCE } from "./patterns.js";

export default function PatternPicker({ patterns, selectedPattern, onSelect, compact = false }) {
  return (
    <div
      className={`pattern-picker ${compact ? "compact" : ""}`}
      aria-label="Choose a problem pattern"
    >
      <button
        className={`pattern-choice all ${selectedPattern === "All patterns" ? "selected" : ""}`}
        onClick={() => onSelect("All patterns")}
      >
        All patterns
      </button>
      {patterns.map((pattern) => (
        <button
          className={`pattern-choice size-${PATTERN_IMPORTANCE[pattern] || 3} ${
            selectedPattern === pattern ? "selected" : ""
          }`}
          key={pattern}
          style={{ "--pattern-color": colorVarFor(pattern) }}
          onClick={() => onSelect(pattern)}
        >
          {pattern}
        </button>
      ))}
    </div>
  );
}