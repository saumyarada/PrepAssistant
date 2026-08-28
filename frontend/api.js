const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function fetchProfile(username) {
  const res = await fetch(`${API_BASE}/api/leetcode/${encodeURIComponent(username)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to load profile");
  return data;
}

export async function fetchPatternCoverage(username) {
  const res = await fetch(`${API_BASE}/api/leetcode/${encodeURIComponent(username)}/patterns`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to load pattern coverage");
  return data;
}

export async function callAI(endpoint, body) {
  const res = await fetch(`${API_BASE}/api/ai/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}
