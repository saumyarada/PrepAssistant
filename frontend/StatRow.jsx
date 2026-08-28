export default function StatRow({ solvedByDifficulty }) {
  const diffs = solvedByDifficulty || {};
  return (
    <div className="stat-row">
      <div className="stat-box easy">
        <div className="num">{diffs.Easy || 0}</div>
        <div className="label">Easy</div>
      </div>
      <div className="stat-box medium">
        <div className="num">{diffs.Medium || 0}</div>
        <div className="label">Medium</div>
      </div>
      <div className="stat-box hard">
        <div className="num">{diffs.Hard || 0}</div>
        <div className="label">Hard</div>
      </div>
    </div>
  );
}
