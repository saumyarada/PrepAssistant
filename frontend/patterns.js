// Maps taxonomy pattern names -> CSS custom property names.
// Keep in sync with backend/pattern_taxonomy.json keys.
export const PATTERN_COLORS = {
  "Two Pointers": "--p-two-pointers",
  "Sliding Window": "--p-sliding-window",
  "Fast & Slow Pointers": "--p-fast-slow",
  "Merge Intervals": "--p-merge-intervals",
  "Binary Search": "--p-binary-search",
  "Backtracking": "--p-backtracking",
  "Dynamic Programming (1D)": "--p-dp-1d",
  "Dynamic Programming (2D/Grid)": "--p-dp-2d",
  "Graph BFS/DFS": "--p-graph",
  "Topological Sort": "--p-topo",
  "Heap / Priority Queue": "--p-heap",
  "Tries": "--p-tries",
  "Union-Find": "--p-union-find",
  "Monotonic Stack": "--p-mono-stack",
  "Bit Manipulation": "--p-bit",
  "Other": "--p-other",
};

export function colorVarFor(pattern) {
  return `var(${PATTERN_COLORS[pattern] || "--p-other"})`;
}

export const PATTERN_IMPORTANCE = {
  "Two Pointers": 5,
  "Sliding Window": 5,
  "Graph BFS/DFS": 4,
  Backtracking: 4,
  "Dynamic Programming (1D)": 4,
  "Merge Intervals": 3,
  "Binary Search": 4,
  "Heap / Priority Queue": 3,
  "Topological Sort": 3,
  "Union-Find": 3,
  "Monotonic Stack": 3,
  "Fast & Slow Pointers": 3,
};

// Hardcoded sample so the landing page has something to show before any
// username is entered, pulled from the same taxonomy the backend uses. Also used
// as a fallback source for "personalized" suggestions until a
// dedicated backend endpoint for "unsolved problems in pattern X"
// exists (see README known limitations).
export const EXPANDED_SUGGESTIONS = [
  { title: "3Sum", pattern: "Two Pointers", difficulty: "Medium" },
  { title: "Container With Most Water", pattern: "Two Pointers", difficulty: "Medium" },
  { title: "Longest Substring Without Repeating Characters", pattern: "Sliding Window", difficulty: "Medium" },
  { title: "Minimum Window Substring", pattern: "Sliding Window", difficulty: "Hard" },
  { title: "Subsets", pattern: "Backtracking", difficulty: "Medium" },
  { title: "Permutations", pattern: "Backtracking", difficulty: "Medium" },
  { title: "Number of Islands", pattern: "Graph BFS/DFS", difficulty: "Medium" },
  { title: "Clone Graph", pattern: "Graph BFS/DFS", difficulty: "Medium" },
  { title: "Climbing Stairs", pattern: "Dynamic Programming (1D)", difficulty: "Easy" },
  { title: "House Robber", pattern: "Dynamic Programming (1D)", difficulty: "Medium" },
  { title: "Merge Intervals", pattern: "Merge Intervals", difficulty: "Medium" },
  { title: "Insert Interval", pattern: "Merge Intervals", difficulty: "Medium" },
  { title: "Search in Rotated Sorted Array", pattern: "Binary Search", difficulty: "Medium" },
  { title: "Find Minimum in Rotated Sorted Array", pattern: "Binary Search", difficulty: "Medium" },
  { title: "Kth Largest Element in an Array", pattern: "Heap / Priority Queue", difficulty: "Medium" },
  { title: "Merge k Sorted Lists", pattern: "Heap / Priority Queue", difficulty: "Hard" },
  { title: "Course Schedule", pattern: "Topological Sort", difficulty: "Medium" },
  { title: "Alien Dictionary", pattern: "Topological Sort", difficulty: "Hard" },
  { title: "Number of Connected Components", pattern: "Union-Find", difficulty: "Medium" },
  { title: "Redundant Connection", pattern: "Union-Find", difficulty: "Medium" },
  { title: "Daily Temperatures", pattern: "Monotonic Stack", difficulty: "Medium" },
  { title: "Largest Rectangle in Histogram", pattern: "Monotonic Stack", difficulty: "Hard" },
  { title: "Linked List Cycle", pattern: "Fast & Slow Pointers", difficulty: "Easy" },
  { title: "Find the Duplicate Number", pattern: "Fast & Slow Pointers", difficulty: "Medium" },
];

export const DEFAULT_SUGGESTIONS = EXPANDED_SUGGESTIONS.filter(
  (problem, index, problems) =>
    problems.findIndex((candidate) => candidate.pattern === problem.pattern) === index
);
