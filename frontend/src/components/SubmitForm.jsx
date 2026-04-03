import React, { useState } from "react";

const MAX = 5000;

export default function SubmitForm({ onSuccess, onSubmitStart }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const len = message.length;
  const charClass = len > MAX ? "error" : len > MAX * 0.8 ? "warn" : "";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || message.length < 10) {
      setError("Please enter at least 10 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    onSubmitStart?.();
    try {
      const { analyzeTicket } = await import("../utils/api");
      const ticket = await analyzeTicket(message);
      setMessage("");
      onSuccess(ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="form-label" htmlFor="ticket-msg">
        Describe the issue
      </label>
      <textarea
        id="ticket-msg"
        className="form-textarea"
        placeholder="e.g. I was charged twice this month and cannot access my account to verify the transaction..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
        maxLength={MAX + 100}
      />
      <div className="form-meta">
        <span className={`char-count ${charClass}`}>{len} / {MAX}</span>
      </div>
      <button
        type="submit"
        className="submit-btn"
        disabled={loading || len > MAX || message.trim().length < 10}
      >
        {loading ? "Analyzing…" : "→ Analyze Ticket"}
      </button>
      {error && <div className="error-msg">⚠ {error}</div>}
    </form>
  );
}
