import { colorVarFor, PATTERN_IMPORTANCE } from "./patterns.js";

export default function PatternPicker({ patterns, selectedPattern, onSelect, compact = false }) {
  return (
    <div
      className={`pattern-picker ${compact ? "compact" : ""}`}
      aria-label="Choose an algorithm"
    >
      <button
        className={`pattern-choice all ${selectedPattern === "All algorithms" ? "selected" : ""}`}
        onClick={() => onSelect("All algorithms")}
      >
        All algorithms
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