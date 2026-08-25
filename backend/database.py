"""
Database engine and session setup.

Loads DATABASE_URL from .env and exposes:
- engine: the SQLAlchemy engine
- SessionLocal: a session factory for request-scoped DB sessions
- Base: declarative base for models.py to inherit from
- get_db: FastAPI dependency that yields a session and closes it after use
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
