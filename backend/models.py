"""
SQLAlchemy models matching the schema in README.md.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False)
    leetcode_username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    snapshots = relationship("LeetCodeSnapshot", back_populates="user")
    ai_sessions = relationship("AISession", back_populates="user")


class LeetCodeSnapshot(Base):
    __tablename__ = "leetcode_snapshots"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    solved_by_difficulty = Column(JSON, nullable=False, default=dict)
    solved_by_topic = Column(JSON, nullable=False, default=dict)
    submission_calendar = Column(JSON, nullable=True)
    last_synced_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="snapshots")


class AISession(Base):
    __tablename__ = "ai_sessions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    problem_slug = Column(String, nullable=False)
    session_type = Column(String, nullable=False)  # "hint" | "fix" | "suggest"
    input = Column(Text, nullable=False)
    output = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ai_sessions")


class ProblemClassification(Base):
    """
    Cache of AI-classified problem -> pattern mappings, for problems not
    covered by the static pattern_taxonomy.json. Keyed by slug so any
    user's solved problem benefits from a classification done for any
    other user — classification cost only paid once per problem, ever.
    """
    __tablename__ = "problem_classifications"

    slug = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    pattern = Column(String, nullable=False)
    source = Column(String, nullable=False, default="ai")  # "taxonomy" | "ai"
    created_at = Column(DateTime, default=datetime.utcnow)
