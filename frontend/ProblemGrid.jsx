import ProblemCard from "./ProblemCard.jsx";

export default function ProblemGrid({ problems, onHintClick, onFixClick }) {
  return (
    <div className="card-grid">
      {problems.map((p, i) => (
        <ProblemCard
          key={`${p.title}-${i}`}
          title={p.title}
          pattern={p.pattern}
          difficulty={p.difficulty}
          onHintClick={onHintClick}
          onFixClick={onFixClick}
        />
      ))}
    </div>
  );
}
