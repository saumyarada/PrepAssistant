"""
AI service backed by the Gemini API.

Three functions, each with a prompt designed for a specific job:
- get_hint: nudge toward the approach, never the full solution
- fix_solution: diagnose + minimal patch, not a rewrite
- suggest_next_problem: recommend based on topic/difficulty gaps

Uses the Gemini REST endpoint directly via `requests` (no extra SDK
dependency, consistent with leetcode_service.py).
"""

import os
import json
import requests

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


class AIServiceError(Exception):
    pass


def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AIServiceError("GEMINI_API_KEY is not set")

    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
    }

    response = requests.post(
        GEMINI_URL,
        params={"key": api_key},
        json=body,
        timeout=30,
    )

    if response.status_code != 200:
        raise AIServiceError(
            f"Gemini API error {response.status_code}: {response.text}"
        )

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise AIServiceError(f"Unexpected Gemini response shape: {data}") from exc


# ---------------------------------------------------------------------------
# Hints
# ---------------------------------------------------------------------------

HINT_SYSTEM_PROMPT = """\
You are an interview coach helping someone practice coding interview
problems. You give Socratic-style hints, not solutions.

Rules you always follow:
- Never write or reveal a working solution, even if the user asks
  directly or claims they're "just curious" or "already know it".
- Point at the right idea (a pattern, data structure, or invariant to
  consider) without stating the full algorithm.
- Keep hints short: 2-4 sentences.
- If their current code is close, point at the specific line or case
  that's wrong without fixing it for them.
"""


def get_hint(problem_statement: str, user_code: str = "") -> str:
    user_prompt = f"""\
Problem:
{problem_statement}

User's current code (may be empty or incomplete):
{user_code or "(no code written yet)"}

Give one hint to help them make progress, without giving away the solution.
"""
    return _call_gemini(HINT_SYSTEM_PROMPT, user_prompt)


# ---------------------------------------------------------------------------
# Solution fixing
# ---------------------------------------------------------------------------

FIX_SYSTEM_PROMPT = """\
You are an interview coach helping debug a near-miss coding solution.

Rules you always follow:
- Diagnose the bug first, in plain language: what's wrong and why.
- Propose the smallest possible fix — do not rewrite the solution
  from scratch unless the existing approach is fundamentally broken.
- If the approach itself is wrong (wrong algorithm/complexity for the
  constraints), say so clearly, but still avoid just handing over a
  full alternate solution — describe the better approach at a high
  level and let them implement it.
- Keep the response focused: diagnosis, then fix, then nothing else.
"""


def fix_solution(
    problem_statement: str, user_code: str, error_or_failing_case: str
) -> str:
    user_prompt = f"""\
Problem:
{problem_statement}

User's code:
{user_code}

Error message or failing test case:
{error_or_failing_case}

Diagnose the issue and propose a minimal fix.
"""
    return _call_gemini(FIX_SYSTEM_PROMPT, user_prompt)


# ---------------------------------------------------------------------------
# Next-problem suggestions
# ---------------------------------------------------------------------------

SUGGEST_SYSTEM_PROMPT = """\
You are an interview coach recommending what LeetCode problem to
practice next, based on a user's solved-problem stats.

Rules you always follow:
- Prioritize topics with low solve counts relative to others (weak
  areas), not topics they've already practiced heavily.
- Recommend a specific, well-known problem by name where possible
  (e.g. "Course Schedule" for graph topology), not just a topic.
- Suggest a difficulty one step above what they're comfortable with,
  not their max difficulty and not their easiest.
- Give exactly 3 suggestions, each with a one-sentence reason.
"""


def suggest_next_problem(solved_by_topic: dict, solved_by_difficulty: dict) -> str:
    user_prompt = f"""\
Solved problems by topic:
{json.dumps(solved_by_topic, indent=2)}

Solved problems by difficulty:
{json.dumps(solved_by_difficulty, indent=2)}

Suggest 3 problems to practice next.
"""
    return _call_gemini(SUGGEST_SYSTEM_PROMPT, user_prompt)


# ---------------------------------------------------------------------------
# Pattern classification (for problems not in the static taxonomy)
# ---------------------------------------------------------------------------

KNOWN_PATTERNS = [
    "Two Pointers", "Sliding Window", "Fast & Slow Pointers", "Merge Intervals",
    "Binary Search", "Backtracking", "Dynamic Programming (1D)",
    "Dynamic Programming (2D/Grid)", "Graph BFS/DFS", "Topological Sort",
    "Heap / Priority Queue", "Tries", "Union-Find", "Monotonic Stack",
    "Bit Manipulation", "Other",
]

CLASSIFY_SYSTEM_PROMPT = f"""\
You classify a LeetCode problem into exactly one algorithmic pattern
from this fixed list: {", ".join(KNOWN_PATTERNS)}.

Rules:
- Respond with ONLY the pattern name, exactly as written in the list
  above. No explanation, no punctuation, nothing else.
- If none of the specific patterns clearly fit, respond "Other".
- Base your answer on the problem title and any topics given, using
  your general knowledge of the problem if you recognize it.
"""


def classify_problem_pattern(problem_title: str, problem_slug: str) -> str:
    user_prompt = f"""\
Problem title: {problem_title}
Problem slug: {problem_slug}

Which pattern does this problem belong to?
"""
    result = _call_gemini(CLASSIFY_SYSTEM_PROMPT, user_prompt).strip()
    # Guard against the model returning something outside the fixed list
    return result if result in KNOWN_PATTERNS else "Other"
