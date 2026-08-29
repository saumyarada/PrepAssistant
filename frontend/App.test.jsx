import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";

const fakeProfileResponse = {
  user_id: "test-uid-123",
  username: "testuser",
  solved_by_difficulty: { Easy: 12, Medium: 8, Hard: 1 },
  total_by_difficulty: {},
  solved_by_topic: {},
  last_synced_at: "2026-01-01T00:00:00",
};

const fakePatternResponse = {
  coverage: {
    "Two Pointers": { solved: 3, total: 4, solved_slugs: [] },
    "Backtracking": { solved: 0, total: 5, solved_slugs: [] },
    "Sliding Window": { solved: 1, total: 4, solved_slugs: [] },
    "Graph BFS/DFS": { solved: 0, total: 4, solved_slugs: [] },
  },
  weakest_patterns: ["Backtracking", "Graph BFS/DFS", "Sliding Window"],
  unclassified_count: 0,
  solved_problems: [
    { slug: "solved-1", title: "Solved One", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "solved-2", title: "Solved Two", pattern: "Graph BFS/DFS", difficulty: "Medium" },
    { slug: "solved-3", title: "Solved Three", pattern: "Binary Search", difficulty: "Easy" },
    { slug: "solved-4", title: "Solved Four", pattern: "Two Pointers", difficulty: "Medium" },
    { slug: "solved-5", title: "Solved Five", pattern: "Sliding Window", difficulty: "Hard" },
  ],
  recommended_problems: [
    { slug: "combination-sum", title: "Combination Sum", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "clone-graph", title: "Clone Graph", pattern: "Graph BFS/DFS", difficulty: "Medium" },
    { slug: "house-robber", title: "House Robber", pattern: "Dynamic Programming (1D)", difficulty: "Medium" },
    { slug: "insert-interval", title: "Insert Interval", pattern: "Merge Intervals", difficulty: "Medium" },
    { slug: "binary-search", title: "Binary Search", pattern: "Binary Search", difficulty: "Easy" },
    { slug: "top-k", title: "Top K Frequent Elements", pattern: "Heap / Priority Queue", difficulty: "Medium" },
    { slug: "daily-temperatures", title: "Daily Temperatures", pattern: "Monotonic Stack", difficulty: "Medium" },
    { slug: "linked-list-cycle", title: "Linked List Cycle", pattern: "Fast & Slow Pointers", difficulty: "Easy" },
    { slug: "unique-paths", title: "Unique Paths", pattern: "Dynamic Programming (2D/Grid)", difficulty: "Medium" },
    { slug: "backtracking-extra-1", title: "Backtracking Extra 1", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-2", title: "Backtracking Extra 2", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-3", title: "Backtracking Extra 3", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-4", title: "Backtracking Extra 4", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-5", title: "Backtracking Extra 5", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-6", title: "Backtracking Extra 6", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-7", title: "Backtracking Extra 7", pattern: "Backtracking", difficulty: "Medium" },
    { slug: "backtracking-extra-8", title: "Backtracking Extra 8", pattern: "Backtracking", difficulty: "Medium" },
  ],
};

beforeEach(() => {
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();

  global.fetch = vi.fn((url) => {
    if (url.includes("/patterns")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(fakePatternResponse) });
    }
    if (url.includes("/api/leetcode/")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(fakeProfileResponse) });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: "not mocked" }) });
  });
});

describe("App", () => {
  it("renders default suggestions on landing before any username is entered", () => {
    render(<App />);
    expect(within(document.querySelector(".card-grid")).getAllByRole("button", { name: "Get hint" })).toHaveLength(4);
    expect(screen.getByText("no profile loaded")).toBeInTheDocument();
    expect(screen.getByText("AI powered by Gemini")).toBeInTheDocument();
  });

  it("filters suggestions when a pattern group is selected", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Backtracking" }));

    expect(within(document.querySelector(".card-grid")).getAllByRole("button", { name: "Get hint" })).toHaveLength(2);
    expect(screen.getAllByText("Backtracking").length).toBeGreaterThan(0);
    expect(screen.getByText("Backtracking", { selector: ".selected-pattern" })).toBeInTheDocument();
  });

  it("refreshes the general landing page with more problems", () => {
    render(<App />);
    const initialTitles = within(document.querySelector(".card-grid"))
      .getAllByRole("button", { name: "Get hint" })
      .map((button) => button.closest(".problem-card").querySelector(".problem-title").textContent);

    fireEvent.click(screen.getByRole("button", { name: "refresh problems" }));

    const refreshedTitles = within(document.querySelector(".card-grid"))
      .getAllByRole("button", { name: "Get hint" })
      .map((button) => button.closest(".problem-card").querySelector(".problem-title").textContent);
    expect(refreshedTitles).toHaveLength(4);
    expect(refreshedTitles).not.toEqual(initialTitles);
  });

  it("does not show the profile summary before a profile is loaded, but tools stay reachable", () => {
    render(<App />);
    expect(screen.queryByText("your progress")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Get hint" }).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("button", { name: "Bug fixer" }).length).toBeGreaterThan(1);
  });

  it("loads profile and pattern data on username submit, updates UI", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("enter your LeetCode username and hit enter");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByText("@testuser · synced")).toBeInTheDocument());

    // stat row
    expect(screen.getByText("12")).toBeInTheDocument(); // Easy count

    // Pattern bars are intentionally omitted from the synced user section.
    await waitFor(() => expect(screen.getAllByText("Backtracking").length).toBeGreaterThan(0));
    expect(screen.queryByText("0/5")).not.toBeInTheDocument();
    expect(screen.getByText(/Weakest patterns:/)).toBeInTheDocument();
    expect(screen.getByText(/Best patterns:/)).toBeInTheDocument();

    // Recommendations now come from the synced backend response.
    expect(within(document.querySelector(".card-grid")).getAllByRole("button", { name: "Get hint" })).toHaveLength(4);

    expect(screen.queryByText("Work through your problem.")).not.toBeInTheDocument();
  });

  it("returns to the general landing page from synced mode", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("enter your LeetCode username and hit enter");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));

    expect(screen.getByText("no profile loaded")).toBeInTheDocument();
    expect(screen.queryByText("Every pattern has a")).not.toBeInTheDocument();
    expect(screen.getByText(/Solve your next/)).toBeInTheDocument();
  });

  it("refreshes recommendation problems without changing the pattern groups", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("enter your LeetCode username and hit enter");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByRole("button", { name: "refresh problems" })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Binary Search" })).toBeInTheDocument();
    const initialSyncedTitles = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })
      .map((button) => button.closest(".problem-card").querySelector(".problem-title").textContent);

    expect(screen.getByText("Solved One")).toBeInTheDocument();
    expect(screen.getByText("Solved Four")).toBeInTheDocument();
    expect(screen.queryByText("Solved Five")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "refresh problems" }));

    const refreshedSyncedTitles = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })
      .map((button) => button.closest(".problem-card").querySelector(".problem-title").textContent);
    expect(refreshedSyncedTitles).not.toEqual(initialSyncedTitles);
    expect(screen.getByRole("button", { name: "Binary Search" })).toBeInTheDocument();
  });

  it("refreshes problems within the selected pattern", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("enter your LeetCode username and hit enter");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByRole("button", { name: "Backtracking" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Backtracking" }));
    const selectedInitialTitles = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })
      .map((button) => button.closest(".problem-card").querySelector(".problem-title").textContent);

    fireEvent.click(screen.getByRole("button", { name: "refresh problems" }));

    const selectedRefreshedTitles = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })
      .map((button) => button.closest(".problem-card").querySelector(".problem-title").textContent);
    expect(selectedRefreshedTitles).not.toEqual(selectedInitialTitles);
    expect(screen.getByText("Backtracking", { selector: ".selected-pattern" })).toBeInTheDocument();
  });

  it("pages through recently solved problems four at a time", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("enter your LeetCode username and hit enter");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByRole("button", { name: "Next solved problems" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Next solved problems" }));

    expect(screen.getByText("Solved Five")).toBeInTheDocument();
    expect(screen.queryByText("Solved One")).not.toBeInTheDocument();
  });

  it("shows an error status when the backend is unreachable", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("could not reach the backend")));
    render(<App />);
    const input = screen.getByPlaceholderText("enter your LeetCode username and hit enter");
    fireEvent.change(input, { target: { value: "testuser" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByText("could not reach the backend")).toBeInTheDocument()
    );
  });

  it("clicking a suggestion card populates the hint tool and scrolls to it", () => {
    render(<App />);
    // "3Sum" is a DEFAULT_SUGGESTIONS card title, rendered on the landing section
    const card = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })[0]
      .closest(".problem-card");
    fireEvent.click(card);

    const hintTextarea = screen.getByPlaceholderText("Paste the problem description here");
    expect(hintTextarea).toHaveValue(card.querySelector(".problem-title").textContent);
    expect(screen.getByText("Work through your problem.")).toBeInTheDocument();
  });

  it("opens the dedicated hint page from the home button", () => {
    render(<App />);
    fireEvent.click(document.querySelector(".topbar-actions button"));

    expect(screen.getByText("Work through your problem.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste the problem description here")).toBeInTheDocument();
  });

  it("clicking the Bug fixer button on a card populates the fix tool, not the hint tool", () => {
    render(<App />);
    const card = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Bug fixer" })[0]
      .closest(".problem-card");
    const fixButton = within(card).getByText("Bug fixer");
    fireEvent.click(fixButton);

    // Fix tool's problem textarea has no placeholder (mirrors HintTool's controlled input),
    // so locate it via the "Fix my solution" tool-card and its first textarea.
    const fixToolCard = screen.getByText("Fix my solution").closest(".tool-card");
    const fixTextarea = within(fixToolCard).getAllByRole("textbox")[0];
    expect(fixTextarea).toHaveValue(card.querySelector(".problem-title").textContent);

    // Hint tool should remain untouched
    const hintTextarea = screen.getByPlaceholderText("Paste the problem description here");
    expect(hintTextarea).toHaveValue("");
  });

  it("clicking the Get hint button on a card does not also trigger the card's default click", () => {
    render(<App />);
    // "Merge Intervals" is both this card's title AND its pattern name, so
    // disambiguate by targeting the .problem-title element specifically.
    const card = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })[0]
      .closest(".problem-card");
    const hintButton = within(card).getByText("Get hint");
    fireEvent.click(hintButton);

    const hintTextarea = screen.getByPlaceholderText("Paste the problem description here");
    expect(hintTextarea).toHaveValue(card.querySelector(".problem-title").textContent);
    expect(screen.getByText("Work through your problem.")).toBeInTheDocument();
  });

  it("clicking Get hint pre-login sends the request without a profile", async () => {
    render(<App />);
    const card = within(document.querySelector(".suggestion-grid"))
      .getAllByRole("button", { name: "Get hint" })[0]
      .closest(".problem-card");
    fireEvent.click(card);

    const hintTextarea = screen.getByPlaceholderText("Paste the problem description here");
    expect(hintTextarea).toHaveValue(card.querySelector(".problem-title").textContent);

    const getHintButtons = screen.getAllByText("Get hint");
    const submitButton = getHintButtons.find((el) => el.tagName === "BUTTON" && el.className === "btn");
    fireEvent.click(submitButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/ai/hint",
      expect.objectContaining({ method: "POST" })
    ));
  });
});
