"""
LeetCode data service.

Same query logic validated in leetcode_query_test.py, relocated here so
the FastAPI app can call it directly. Talks to LeetCode's unofficial
GraphQL endpoint — see README.md "Known risk" section.
"""

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


def _run_query(query: str, variables: dict) -> dict:
    response = requests.post(
        LEETCODE_GRAPHQL_URL,
        json={"query": query, "variables": variables},
        headers=HEADERS,
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    if "errors" in payload:
        raise RuntimeError(f"GraphQL errors: {payload['errors']}")
    return payload["data"]


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
