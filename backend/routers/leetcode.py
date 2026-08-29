"""
LeetCode routes: fetch a user's profile, syncing to DB with a simple
cache — only re-hit LeetCode if the last sync is older than CACHE_TTL,
or if the caller explicitly forces a refresh.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import User, LeetCodeSnapshot
from services import leetcode_service, pattern_service
from schemas import LeetCodeSnapshotOut

router = APIRouter(prefix="/api/leetcode", tags=["leetcode"])

CACHE_TTL = timedelta(hours=6)


@router.get("/{username}", response_model=LeetCodeSnapshotOut)
def get_leetcode_overview(
    username: str,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
):
    # Find or create a lightweight user row keyed by leetcode_username.
    # (Real auth/user creation comes later — this lets the endpoint work
    # standalone for now.)
    user = db.query(User).filter(User.leetcode_username == username).first()
    if user is None:
        user = User(email=f"{username}@placeholder.local", leetcode_username=username)
        db.add(user)
        db.commit()
        db.refresh(user)

    snapshot = (
        db.query(LeetCodeSnapshot)
        .filter(LeetCodeSnapshot.user_id == user.id)
        .order_by(LeetCodeSnapshot.last_synced_at.desc())
        .first()
    )

    is_stale = (
        snapshot is None
        or snapshot.last_synced_at < datetime.utcnow() - CACHE_TTL
    )

    solved_problems = []
    if is_stale or force_refresh:
        try:
            fresh = leetcode_service.fetch_full_snapshot(username)
        except leetcode_service.LeetCodeUserNotFound:
            raise HTTPException(status_code=404, detail=f"No such LeetCode user: {username}")
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"LeetCode fetch failed: {exc}")

        snapshot = LeetCodeSnapshot(
            user_id=user.id,
            solved_by_difficulty=fresh["solved_by_difficulty"],
            solved_by_topic=fresh["solved_by_topic"],
            submission_calendar=None,
            last_synced_at=datetime.utcnow(),
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

        total_by_difficulty = fresh["total_by_difficulty"]
    else:
        # Cached path doesn't have total_by_difficulty stored; refetch
        # lightly or leave empty. For MVP, leave empty on cache hits —
        # it rarely changes and isn't the interesting number anyway.
        total_by_difficulty = {}

    # LeetCode exposes recent accepted submissions publicly. Keep this list
    # in the response so the UI can personalize its solved and suggested cards.
    try:
        solved_problems = leetcode_service.fetch_recent_solved_problems(username)
    except Exception:
        solved_problems = []

    return LeetCodeSnapshotOut(
        user_id=user.id,
        username=username,
        solved_by_difficulty=snapshot.solved_by_difficulty,
        total_by_difficulty=total_by_difficulty,
        solved_by_topic=snapshot.solved_by_topic,
        last_synced_at=snapshot.last_synced_at,
        solved_problems=solved_problems,
    )


@router.get("/{username}/patterns")
def get_pattern_coverage(username: str, db: Session = Depends(get_db)):
    """
    Intelligent overview: cross-references the user's recently-solved
    problems against the pattern taxonomy (and AI-classifies anything
    not in it) to show pattern-level mastery instead of raw topic counts.

    NOTE: relies on fetch_recent_solved_problems, which is untested
    against live data — validate before depending on this endpoint.
    """
    try:
        solved = leetcode_service.fetch_recent_solved_problems(username)
    except leetcode_service.LeetCodeUserNotFound:
        raise HTTPException(status_code=404, detail=f"No such LeetCode user: {username}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LeetCode fetch failed: {exc}")

    return pattern_service.compute_pattern_coverage(db, solved)