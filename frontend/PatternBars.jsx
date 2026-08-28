import { colorVarFor } from "./patterns.js";

export default function PatternBars({ coverage, weakestPatterns }) {
  const entries = Object.entries(coverage).sort(
    (a, b) => a[1].solved / (a[1].total || 1) - b[1].solved / (b[1].total || 1)
  );

  return (
    <>
      <div className="pattern-bars">
        {entries.map(([pattern, stats]) => {
          const ratio = stats.total ? stats.solved / stats.total : 0;
          const pct = Math.min(100, Math.round(ratio * 100));
          const color = colorVarFor(pattern);
          return (
            <div className="pbar-row" key={pattern}>
              <div className="pbar-name" style={{ "--dot-color": color }}>
                <span className="pbar-swatch" />
                {pattern}
              </div>
              <div className="pbar-track">
                <div className="pbar-fill" style={{ width: `${pct}%`, "--dot-color": color }} />
              </div>
              <div className="pbar-count">
                {stats.solved}/{stats.total}
              </div>
            </div>
          );
        })}
      </div>

      {weakestPatterns && weakestPatterns.length > 0 && (
        <div className="weak-callout">
          Weakest patterns: <strong>{weakestPatterns.slice(0, 3).join(", ")}</strong> — suggestions
          below target these first.
        </div>
      )}
    </>
  );
}
