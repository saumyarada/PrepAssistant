"""
Standalone validation script for LeetCode's unofficial GraphQL endpoint.

Purpose: prove that we can fetch a public user's solved-problem stats
before building any app around it. No framework, no DB — just requests.

Usage:
    python leetcode_query_test.py <leetcode_username>
"""

import sys
import json
import requests

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# This query pulls the same data LeetCode's own profile page uses:
# solved counts by difficulty, and topic-tag breakdown.
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
    # LeetCode's endpoint expects a browser-like UA; requests without one
    # are sometimes rejected.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Referer": "https://leetcode.com",
}


def run_query(query: str, variables: dict) -> dict:
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
    data = run_query(PROFILE_QUERY, {"username": username})
    matched = data.get("matchedUser")
    if matched is None:
        raise ValueError(f"No such LeetCode user: {username!r}")

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
    data = run_query(TAGS_QUERY, {"username": username})
    matched = data.get("matchedUser")
    if matched is None:
        raise ValueError(f"No such LeetCode user: {username!r}")

    counts = matched["tagProblemCounts"]
    topics = {}
    for bucket in ("fundamental", "intermediate", "advanced"):
        for entry in counts[bucket]:
            topics[entry["tagName"]] = entry["problemsSolved"]
    return topics


def main():
    if len(sys.argv) != 2:
        print("Usage: python leetcode_query_test.py <leetcode_username>")
        sys.exit(1)

    username = sys.argv[1]

    print(f"Fetching profile for '{username}'...\n")
    profile = fetch_profile(username)
    print("Solved by difficulty:")
    print(json.dumps(profile["solved_by_difficulty"], indent=2))
    print("\nTotal available by difficulty:")
    print(json.dumps(profile["total_by_difficulty"], indent=2))

    print(f"\nFetching topic breakdown for '{username}'...\n")
    topics = fetch_topic_breakdown(username)
    print("Solved by topic (nonzero only):")
    nonzero = {k: v for k, v in topics.items() if v > 0}
    print(json.dumps(nonzero, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
