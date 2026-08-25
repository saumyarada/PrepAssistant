"""
AI routes: hint, fix, suggest. Each call is logged to ai_sessions so you
have real usage data (and prompt/response history) to point to later.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import AISession, LeetCodeSnapshot
from services import ai_service
from schemas import HintRequest, FixRequest, SuggestRequest, AIResponse

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _log_session(db: Session, user_id: str, problem_slug: str, session_type: str, input_text: str, output_text: str):
    session = AISession(
        user_id=user_id,
        problem_slug=problem_slug,
        session_type=session_type,
        input=input_text,
        output=output_text,
    )
    db.add(session)
    db.commit()


@router.post("/hint", response_model=AIResponse)
def hint(req: HintRequest, db: Session = Depends(get_db)):
    try:
        output = ai_service.get_hint(req.problem_statement, req.user_code)
    except ai_service.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    _log_session(
        db, req.user_id, req.problem_slug, "hint",
        input_text=f"{req.problem_statement}\n---\n{req.user_code}",
        output_text=output,
    )
    return AIResponse(output=output)


@router.post("/fix", response_model=AIResponse)
def fix(req: FixRequest, db: Session = Depends(get_db)):
    try:
        output = ai_service.fix_solution(
            req.problem_statement, req.user_code, req.error_or_failing_case
        )
    except ai_service.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    _log_session(
        db, req.user_id, req.problem_slug, "fix",
        input_text=f"{req.problem_statement}\n---\n{req.user_code}\n---\n{req.error_or_failing_case}",
        output_text=output,
    )
    return AIResponse(output=output)


@router.post("/suggest", response_model=AIResponse)
def suggest(req: SuggestRequest, db: Session = Depends(get_db)):
    snapshot = (
        db.query(LeetCodeSnapshot)
        .filter(LeetCodeSnapshot.user_id == req.user_id)
        .order_by(LeetCodeSnapshot.last_synced_at.desc())
        .first()
    )
    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail="No LeetCode snapshot found for this user — sync their profile first.",
        )

    try:
        output = ai_service.suggest_next_problem(
            snapshot.solved_by_topic, snapshot.solved_by_difficulty
        )
    except ai_service.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    _log_session(
        db, req.user_id, problem_slug="(n/a)", session_type="suggest",
        input_text=str(snapshot.solved_by_topic),
        output_text=output,
    )
    return AIResponse(output=output)
