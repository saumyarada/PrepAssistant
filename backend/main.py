"""
FastAPI app entrypoint.

Run with:
    uvicorn main:app --reload

Then visit http://127.0.0.1:8000/docs for the auto-generated API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401 (needed so models are registered on Base before create_all)
from routers import leetcode, ai

# Creates tables if they don't exist yet. Fine for early development;
# switch to Alembic migrations once the schema stabilizes.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Interview Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev-only: tighten this before deploying publicly
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leetcode.router)
app.include_router(ai.router)


@app.get("/")
def health_check():
    return {"status": "ok"}