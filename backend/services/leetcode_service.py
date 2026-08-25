"""
LeetCode data service.

Same query logic validated in leetcode_query_test.py, relocated here so
the FastAPI app can call it directly. Talks to LeetCode's unofficial
GraphQL endpoint — see README.md "Known risk" section.
"""

import time
import requests

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

PROFILE_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
  }
  allQuestionsCount {
    difficulty
    count
  }
}
"""

TAGS_QUERY = """
query skillStats($username: String!) {
  matchedUser(username: $username) {
    tagProblemCounts {
      advanced { tagName tagSlug problemsSolved }
      intermediate { tagName tagSlug problemsSolved }
      fundamental { tagName tagSlug problemsSolved }
    }
  }
}
"""

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Referer": "https://leetcode.com",
}


class LeetCodeUserNotFound(Exception):
    pass


def _run_query(query: str, variables: dict, retries: int = 2) -> dict:
    last_error = None
    for attempt in range(retries + 1):
        try:
            response = requests.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers=HEADERS,
                timeout=20,
            )
            response.raise_for_status()
            payload = response.json()
            if "errors" in payload:
                raise RuntimeError(f"GraphQL errors: {payload['errors']}")
            return payload["data"]
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))  # backoff: 1.5s, then 3s
                continue
            raise
    raise last_error  # pragma: no cover


def fetch_profile(username: str) -> dict:
    data = _run_query(PROFILE_QUERY, {"username": username})
    matched = data.get("matchedUser")
    if matched is None:
        raise LeetCodeUserNotFound(username)

    solved_by_difficulty = {
        row["difficulty"]: row["count"]
        for row in matched["submitStats"]["acSubmissionNum"]
    }
    total_by_difficulty = {
        row["difficulty"]: row["count"] for row in data["allQuestionsCount"]
    }

    return {
        "username": matched["username"],
        "solved_by_difficulty": solved_by_difficulty,
        "total_by_difficulty": total_by_difficulty,
    }


def fetch_topic_breakdown(username: str) -> dict:
    data = _run_query(TAGS_QUERY, {"username": username})
    matched = data.get("matchedUser")
    if matched is None:
        raise LeetCodeUserNotFound(username)

    counts = matched["tagProblemCounts"]
    topics = {}
    for bucket in ("fundamental", "intermediate", "advanced"):
        for entry in counts[bucket]:
            topics[entry["tagName"]] = entry["problemsSolved"]
    return {k: v for k, v in topics.items() if v > 0}


RECENT_SOLVED_QUERY = """
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}
"""


def fetch_recent_solved_problems(username: str, limit: int = 20) -> list[dict]:
    """
    NOTE: untested against live LeetCode data — validate this the same
    way fetch_profile/fetch_topic_breakdown were validated (run it
    against a real username and inspect the output) before relying on
    it. LeetCode's public API only exposes *recent* accepted
    submissions this way, not a user's full historical solved list,
    unless they're authenticated. This limits pattern-coverage accuracy
    to recently-solved problems for now.
    """
    data = _run_query(RECENT_SOLVED_QUERY, {"username": username, "limit": limit})
    submissions = data.get("recentAcSubmissionList") or []
    # Dedupe by slug (a problem can appear multiple times if resubmitted)
    seen = {}
    for sub in submissions:
        seen[sub["titleSlug"]] = {
            "slug": sub["titleSlug"],
            "title": sub["title"],
        }
    return list(seen.values())


def fetch_full_snapshot(username: str) -> dict:
    """Combines profile + topic breakdown into one payload for storage."""
    profile = fetch_profile(username)
    topics = fetch_topic_breakdown(username)
    return {
        "username": profile["username"],
        "solved_by_difficulty": profile["solved_by_difficulty"],
        "total_by_difficulty": profile["total_by_difficulty"],
        "solved_by_topic": topics,
    }