"""
Pattern coverage service.

For a user's solved problems, determines which pattern each belongs to
(taxonomy match -> classification cache -> AI classification, in that
order of preference/cost) and computes per-pattern coverage against the
canonical taxonomy.
"""

import json
import os
from sqlalchemy.orm import Session

from models import ProblemClassification
from services import ai_service

_TAXONOMY_PATH = os.path.join(os.path.dirname(__file__), "..", "pattern_taxonomy.json")

with open(_TAXONOMY_PATH) as f:
    PATTERN_TAXONOMY: dict[str, list[dict]] = json.load(f)

# Reverse index: slug -> pattern, for O(1) taxonomy lookups
_SLUG_TO_TAXONOMY_PATTERN = {
    problem["slug"]: pattern
    for pattern, problems in PATTERN_TAXONOMY.items()
    for problem in problems
}


def _classify_one(db: Session, slug: str, title: str) -> str:
    """Resolve a single problem's pattern: taxonomy -> cache -> AI (+cache write)."""
    if slug in _SLUG_TO_TAXONOMY_PATTERN:
        return _SLUG_TO_TAXONOMY_PATTERN[slug]

    cached = db.query(ProblemClassification).filter(
        ProblemClassification.slug == slug
    ).first()
    if cached:
        return cached.pattern

    try:
        pattern = ai_service.classify_problem_pattern(title, slug)
    except ai_service.AIServiceError:
        pattern = "Other"

    db.add(ProblemClassification(slug=slug, title=title, pattern=pattern, source="ai"))
    db.commit()
    return pattern


def compute_pattern_coverage(db: Session, solved_problems: list[dict]) -> dict:
    """
    solved_problems: list of {"slug": ..., "title": ...}

    Returns:
    {
      "coverage": {
        "Two Pointers": {"solved": 2, "total": 4, "solved_slugs": [...]},
        ...
      },
      "weakest_patterns": ["Backtracking", "Union-Find", ...],  # lowest coverage ratio first
      "unclassified_count": 0
    }
    """
    solved_by_pattern: dict[str, list[str]] = {p: [] for p in PATTERN_TAXONOMY}
    solved_by_pattern.setdefault("Other", [])

    solved_details = []
    for problem in solved_problems:
        pattern = _classify_one(db, problem["slug"], problem["title"])
        solved_by_pattern.setdefault(pattern, [])
        solved_by_pattern[pattern].append(problem["slug"])
        solved_details.append({**problem, "pattern": pattern})

    coverage = {}
    for pattern, canonical_problems in PATTERN_TAXONOMY.items():
        solved_slugs = solved_by_pattern.get(pattern, [])
        coverage[pattern] = {
            "solved": len(solved_slugs),
            "total": len(canonical_problems),
            "solved_slugs": solved_slugs,
        }

    # Rank weakest patterns by solved/total ratio, ascending
    def ratio(p):
        c = coverage[p]
        return c["solved"] / c["total"] if c["total"] else 1.0

    weakest = sorted(coverage.keys(), key=ratio)

    solved_slugs = {problem["slug"] for problem in solved_problems}
    recommended = [
        {**problem, "pattern": pattern}
        for pattern in weakest
        for problem in PATTERN_TAXONOMY[pattern]
        if problem["slug"] not in solved_slugs
    ]

    return {
        "coverage": coverage,
        "weakest_patterns": weakest,
        "unclassified_count": len(solved_by_pattern.get("Other", [])),
        "solved_problems": solved_details,
        "recommended_problems": recommended,
    }
