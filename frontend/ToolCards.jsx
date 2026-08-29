import { useState, useRef, useEffect } from "react";
import { callAI } from "./api.js";

export function HintTool({ userId, problem, onProblemChange, focusToken }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const problemRef = useRef(null);

  useEffect(() => {
    if (focusToken) problemRef.current?.focus();
  }, [focusToken]);

  async function handleSubmit() {
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const data = await callAI("hint", {
        ...(userId ? { user_id: userId } : {}),
        problem_slug: "manual-entry",
        problem_statement: problem,
        user_code: code,
      });
      setResult(data.output);
    } catch (err) {
      setResult(err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tool-card">
      <h3 className="display">Get a hint</h3>
      <p className="tool-description">Work through the idea without being given the full solution.</p>
      <label>Problem statement</label>
      <textarea
        ref={problemRef}
        placeholder="Paste the problem title (e.g. Two Sum) or problem description here"
        value={problem}
        onChange={(e) => onProblemChange(e.target.value)}
      />
      <label>Your current code (optional)</label>
      <textarea
        placeholder="def solve(...): ..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Thinking..." : "Get hint"}
      </button>
      {result && <div className={`ai-output ${error ? "error" : ""}`}>{result}</div>}
    </div>
  );
}

export function FixTool({ userId, problem, onProblemChange, focusToken }) {
  const [code, setCode] = useState("");
  const [errorCase, setErrorCase] = useState("");
  const [result, setResult] = useState(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const problemRef = useRef(null);

  useEffect(() => {
    if (focusToken) problemRef.current?.focus();
  }, [focusToken]);

  async function handleSubmit() {
    setLoading(true);
    setIsError(false);
    setResult(null);
    try {
      const data = await callAI("fix", {
        ...(userId ? { user_id: userId } : {}),
        problem_slug: "manual-entry",
        problem_statement: problem,
        user_code: code,
        error_or_failing_case: errorCase,
      });
      setResult(data.output);
    } catch (err) {
      setResult(err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tool-card">
      <h3 className="display">Fix my solution</h3>
      <p className="tool-description">Find the cause of a failing test and make a minimal fix.</p>
      <label>Problem statement</label>
      <textarea ref={problemRef} value={problem} onChange={(e) => onProblemChange(e.target.value)} />
      <label>Your code</label>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} />
      <label>Error message or failing case</label>
      <textarea
        placeholder="e.g. IndexError on empty input"
        value={errorCase}
        onChange={(e) => setErrorCase(e.target.value)}
      />
      <button className="btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Thinking..." : "Diagnose & fix"}
      </button>
      {result && <div className={`ai-output ${isError ? "error" : ""}`}>{result}</div>}
    </div>
  );
}
