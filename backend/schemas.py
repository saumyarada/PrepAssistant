"""
Pydantic schemas for API request/response validation.
"""

from datetime import datetime
from pydantic import BaseModel


class LeetCodeSnapshotOut(BaseModel):
    username: str
    solved_by_difficulty: dict
    total_by_difficulty: dict
    solved_by_topic: dict
    last_synced_at: datetime

    class Config:
        from_attributes = True


class HintRequest(BaseModel):
    user_id: str
    problem_slug: str
    problem_statement: str
    user_code: str = ""


class FixRequest(BaseModel):
    user_id: str
    problem_slug: str
    problem_statement: str
    user_code: str
    error_or_failing_case: str


class SuggestRequest(BaseModel):
    user_id: str


class AIResponse(BaseModel):
    output: str