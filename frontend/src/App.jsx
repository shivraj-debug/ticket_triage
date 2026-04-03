import React, { useState } from "react";
import "./App.css";
import SubmitForm from "./components/SubmitForm";
import ResultPanel from "./components/ResultPanel";
import TicketTable from "./components/TicketTable";
import { useTickets } from "./hooks/useTickets";

export default function App() {
  const [latestTicket, setLatestTicket] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { tickets, total, loading: tableLoading, prepend } = useTickets(50);

  function handleSuccess(ticket) {
    setLatestTicket(ticket);
    setAnalyzing(false);
    prepend(ticket);
  }

  function handleSubmitStart() {
    setAnalyzing(true);
    setLatestTicket(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <h1>Triage<span>AI</span></h1>
          <span className="header-sub">Support Ticket Analyzer · Local NLP</span>
        </div>
        <div className="header-badge">
          <span className="status-dot" />
          System Online
        </div>
      </header>

      <div className="main-grid">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">✦</span>
            <span className="panel-title">Submit Ticket</span>
          </div>
          <div className="panel-body">
            <SubmitForm
              onSuccess={handleSuccess}
              onSubmitStart={handleSubmitStart}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">◈</span>
            <span className="panel-title">Analysis Result</span>
          </div>
          <div className="panel-body">
            <ResultPanel ticket={latestTicket} loading={analyzing} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-icon">≡</span>
          <span className="panel-title">Ticket History</span>
        </div>
        <div className="panel-body">
          <TicketTable
            tickets={tickets}
            loading={tableLoading}
            total={total}
          />
        </div>
      </div>
    </div>
  );
}
