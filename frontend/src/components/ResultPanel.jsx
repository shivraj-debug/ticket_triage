import React from "react";

const PRIORITY_LABELS = { P0: "Critical", P1: "High", P2: "Medium", P3: "Low" };

const catClass = (c) => `cat-${c.replace(/\s/g, "")}`;

export default function ResultPanel({ ticket, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Processing ticket</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="result-empty">
        <div className="result-empty-icon">⬡</div>
        <p>Submit a ticket to see the analysis</p>
      </div>
    );
  }

  const confidencePct = Math.round(ticket.confidence * 100);

  return (
    <div className="result-card">
      <div className="result-top">
        <div className="result-field">
          <div className="result-field-label">Category</div>
          <div className={`result-field-value ${catClass(ticket.category)}`}>
            {ticket.category}
          </div>
        </div>
        <div className="result-field">
          <div className="result-field-label">Priority</div>
          <div className={`result-field-value priority-${ticket.priority}`}>
            {ticket.priority} — {PRIORITY_LABELS[ticket.priority]}
          </div>
        </div>
        <div className="result-field">
          <div className="result-field-label">Urgency</div>
          <div className={`result-field-value urgency-${ticket.urgencyLevel}`}>
            {ticket.urgencyLevel.charAt(0).toUpperCase() + ticket.urgencyLevel.slice(1)}
          </div>
        </div>
        <div className="result-field">
          <div className="result-field-label">Ticket ID</div>
          <div className="result-field-value" style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
            {ticket._id?.slice(-8) || "—"}
          </div>
        </div>
      </div>

      <div className="confidence-bar-wrap">
        <div className="confidence-bar-label">
          <span>Confidence</span>
          <strong>{confidencePct}%</strong>
        </div>
        <div className="confidence-bar-track">
          <div className="confidence-bar-fill" style={{ width: `${confidencePct}%` }} />
        </div>
      </div>

      {ticket.keywords?.length > 0 && (
        <div className="keywords-section">
          <div className="section-label">Detected signals</div>
          <div className="keywords-list">
            {ticket.keywords.map((kw) => (
              <span key={kw} className="keyword-chip">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {ticket.customTags?.length > 0 && (
        <div>
          <div className="section-label">Custom rules triggered</div>
          <div className="tags-section">
            {ticket.customTags.map((tag) => (
              <span
                key={tag}
                className={`custom-tag ${tag.includes("REFUND") ? "refund" : ""}`}
              >
                ⚑ {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
