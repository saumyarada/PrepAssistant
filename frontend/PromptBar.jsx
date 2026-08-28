import { useState } from "react";

export default function PromptBar({ onSubmit, status, statusError }) {
  const [value, setValue] = useState("");

  function handleKeyDown(e) {
    if (e.key === "Enter" && value.trim()) {
      onSubmit(value.trim());
    }
  }

  return (
    <div className="prompt-bar">
      <div className="prompt-bar-inner-wrap">
        <div className="prompt-inner">
          <span className="prompt-prefix mono">leetcode ~$</span>
          <input
            type="text"
            placeholder="enter your username and hit enter"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={() => value.trim() && onSubmit(value.trim())}>run</button>
        </div>
        {status && (
          <div className={`prompt-status mono ${statusError ? "error" : ""}`}>{status}</div>
        )}
      </div>
    </div>
  );
}
