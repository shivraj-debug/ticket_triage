import React from "react";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const catClass = (c) => `cat-${c.replace(/\s/g, "")}`;

export default function TicketTable({ tickets, loading, total }) {
  return (
    <div className="table-section">
      <div className="table-header">
        <h2>Recent Tickets</h2>
        <span className="table-count">{total ?? 0} total</span>
      </div>

      {loading ? (
        <div className="table-loading">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="table-empty">No tickets yet. Submit one above.</div>
      ) : (
        <table className="ticket-table">
          <thead>
            <tr>
              <th>Message</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Urgency</th>
              <th>Tags</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id}>
                <td className="td-message">
                  <div className="td-message-text">{t.message}</div>
                </td>
                <td>
                  <span className={`priority-badge badge-${t.priority}`}>
                    {t.priority}
                  </span>
                </td>
                <td>
                  <span className={`category-badge ${catClass(t.category)}`}>
                    {t.category}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: 12, textTransform: "capitalize" }}>
                  {t.urgencyLevel}
                </td>
                <td className="td-tags">
                  {t.customTags?.map((tag) => (
                    <span
                      key={tag}
                      className={`mini-tag ${tag.includes("REFUND") ? "refund" : ""}`}
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </td>
                <td className="td-time">{timeAgo(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
