# TriageAI — AI-Powered Support Ticket Triage

A full-stack support ticket analyzer using local NLP/heuristics — no external AI APIs.

**Stack:** Express.js · MongoDB · React · Docker

---

## Quick Start

```bash
# Clone / unzip the project, then:
docker-compose up --build

# App: http://localhost:3000
# API: http://localhost:5000
```

> Requires Docker & Docker Compose installed.

---

## Manual Setup (without Docker)

### Backend

```bash
cd backend
npm install

# Set env vars (edit .env):
# MONGO_URI=mongodb://localhost:27017/tickettriage
# PORT=5000

npm start          # production
npm run dev        # development (nodemon)
npm test           # run tests with coverage
```

### Frontend

```bash
cd frontend
npm install

# For local dev against the backend:
# Edit src/utils/api.js or set REACT_APP_API_URL=http://localhost:5000/tickets

npm start          # http://localhost:3000
npm run build      # production build
```

---

## API Reference

### `POST /tickets/analyze`

Analyzes a support ticket message.

**Request body:**
```json
{ "message": "I was charged twice this month and cannot access my account" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "message": "...",
    "category": "Billing",
    "priority": "P1",
    "urgencyLevel": "low",
    "confidence": 0.5,
    "keywords": ["charged", "account"],
    "customTags": ["REFUND_REQUEST"],
    "signals": {
      "categoryScore": 2,
      "priorityBoost": 1,
      "urgencyMatches": [],
      "categoryMatches": ["charged", "account"]
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation errors return HTTP 400.**

### `GET /tickets?limit=50&skip=0`

Returns paginated list of tickets, most recent first.

### `GET /tickets/:id`

Returns a single ticket by MongoDB ObjectId.

---

## Architecture

```
ticket-triage/
├── backend/
│   └── src/
│       ├── config/
│       │   └── keywords.js      ← All NLP rules (config-driven)
│       ├── services/
│       │   ├── analyzer.js      ← Core NLP/heuristic engine
│       │   └── ticketService.js ← DB operations
│       ├── models/
│       │   └── ticket.js        ← Mongoose schema
│       ├── controllers/
│       │   └── ticketController.js
│       ├── middleware/
│       │   └── routes.js
│       ├── tests/
│       │   └── analyzer.test.js ← 20 unit tests, 100% coverage
│       └── index.js             ← Express + MongoDB bootstrap
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── SubmitForm.jsx
│       │   ├── ResultPanel.jsx
│       │   └── TicketTable.jsx
│       ├── utils/
│       │   └── api.js
│       ├── App.jsx
│       └── App.css
└── docker-compose.yml
```

**Separation of concerns:**

| Layer | Responsibility |
|---|---|
| `keywords.js` | All keyword lists, weights, thresholds — pure data |
| `analyzer.js` | NLP logic — pure functions, no DB, fully testable |
| `ticketService.js` | DB persistence — delegates analysis to analyzer |
| `ticketController.js` | HTTP layer — validation, request/response |
| `routes.js` | URL mapping + input validation middleware |

---

## NLP / Classification Approach

### How it works

The analyzer pipeline has 5 stages:

1. **Category Classification** — text is normalized (lowercased, whitespace collapsed) and matched against keyword lists for each category (Billing, Technical, Account, Feature Request). Each match contributes a weighted score; the highest-scoring category wins.

2. **Urgency Detection** — a secondary pass looks for urgency signals (e.g. `urgent`, `asap`, `down`, `outage`). Urgency level (`critical`, `high`, `medium`, `low`) is assigned and contributes a priority boost.

3. **Custom Rules** (applied after baseline) — security and refund signals are evaluated and can override category/priority.

4. **Priority Computation** — final priority is derived from `categoryScore + priorityBoost` against thresholds: P0 ≥ 8, P1 ≥ 5, P2 ≥ 2, P3 otherwise.

5. **Confidence Scoring** — confidence is a normalized function of total keyword match density vs ticket length (clamped 0.1–0.99).

### Why keyword-based?

Given the constraint of no external APIs, keyword matching is transparent, deterministic, and testable — every classification decision is traceable to a rule. It's trivially extensible: adding a new category or urgency signal is a one-line config change in `keywords.js`.

---

## Custom Rules

### 1. Security Escalation (`SECURITY_ESCALATION`)

**Keywords:** `security`, `breach`, `hacked`, `vulnerability`, `unauthorized access`, `data leak`, `phishing`, `malware`, etc.

**Behavior:**
- Forces priority to **P0** regardless of other scores
- Forces category to **Technical**
- Forces urgency to **critical**
- Tags the ticket with `SECURITY_ESCALATION`

**Rationale:** Security incidents have outsized business impact (legal liability, regulatory exposure, customer trust). They must always reach the security team immediately, regardless of how the ticket is otherwise worded. A user who writes "I think someone got into my account" shouldn't get P3 just because they wrote calmly.

### 2. Refund Fast-Track (`REFUND_REQUEST`)

**Keywords:** `refund`, `money back`, `chargeback`, `dispute`, `charged twice`, `double charged`

**Behavior:**
- Forces category to **Billing**
- Applies a +1 priority boost
- Tags the ticket with `REFUND_REQUEST`

**Rationale:** Refund requests have direct revenue and churn implications. A customer requesting a refund is at high churn risk — fast resolution is critical for retention. Tagging them separately also enables future routing to a dedicated refunds queue.

---

## Data Model

```js
{
  message:      String,   // original ticket text
  category:     String,   // Billing | Technical | Account | Feature Request | Other
  priority:     String,   // P0 | P1 | P2 | P3
  urgencyLevel: String,   // critical | high | medium | low
  confidence:   Number,   // 0.0–1.0
  keywords:     [String], // top matched signals (max 8)
  customTags:   [String], // e.g. SECURITY_ESCALATION, REFUND_REQUEST
  signals: {
    categoryScore:    Number,
    priorityBoost:    Number,
    urgencyMatches:   [String],
    categoryMatches:  [String]
  },
  createdAt:    Date,     // auto via Mongoose timestamps
  updatedAt:    Date
}
```

**Why MongoDB?** The ticket document is naturally a denormalized unit — the message, its analysis, and signals are always accessed together. MongoDB's flexible schema also makes it easy to extend signals without migrations, and Mongoose adds validation and virtuals cleanly on top.

---

## Test Results

```
PASS src/tests/analyzer.test.js
  TicketAnalyzer
    classifyCategory()
      ✓ detects Billing category
      ✓ detects Technical category
      ✓ detects Account category
      ✓ detects Feature Request category
      ✓ falls back to Other when no keywords match
    computePriority()
      ✓ P0 for critical urgency + outage with technical signals
      ✓ P1 for high-signal technical issue
      ✓ P3 for low-signal feature request
    detectUrgency()
      ✓ detects critical urgency from 'urgent' and 'asap'
      ✓ returns low urgency for benign messages
    confidence score
      ✓ returns a number between 0 and 1
      ✓ returns higher confidence for keyword-dense messages
    Custom Rule: Security Escalation
      ✓ forces P0 priority and SECURITY_ESCALATION tag on security keywords
      ✓ forces category to Technical on security breach
    Custom Rule: Refund Fast-Track
      ✓ tags refund requests with REFUND_REQUEST
      ✓ forces category to Billing for refund requests
    extractTopKeywords()
      ✓ extracts relevant keywords
      ✓ returns at most 8 keywords
    input validation
      ✓ throws on empty input
      ✓ throws on non-string input

Tests: 20 passed, 20 total
Coverage: 100% Statements | 100% Branch | 100% Functions | 100% Lines
```

---

## Reflection

### Design Decisions

**Config-driven NLP** — All keyword lists live in `keywords.js`, not scattered across service code. Adding a new category requires zero code changes in the analyzer; just add a key to `CATEGORIES`. This makes the system auditable and easy to tune.

**Pure analyzer functions** — `analyzer.js` has zero side effects and no DB dependency. It's a pure data-in / data-out module. This is why 100% test coverage is achievable without mocking — there's nothing to mock.

**Separation: analyzer vs service vs controller** — The analyzer doesn't know about MongoDB; the service doesn't know about HTTP; the controller doesn't know about NLP. Each layer has one job, making each independently testable and replaceable.

**MongoDB document model** — A ticket and its analysis are a single read unit — they're always fetched together. A relational model (separate `analyses` table) would add joins without benefit here. The `signals` subdocument preserves the full reasoning trail for debugging.

### Trade-offs

- **Keyword matching vs ML** — Keyword matching is transparent and fast but brittle to phrasing variation. "My bill is wrong" scores 0 on Billing because "bill" as a verb doesn't match. A TF-IDF or simple Naive Bayes classifier trained on real ticket data would outperform this significantly.
- **Confidence is a proxy** — Confidence is computed from match density, not a real probabilistic score. A ticket with 5 billing keywords has high confidence, but those keywords could be in a negative context ("I never had a billing issue before").
- **No NLP context** — The analyzer can't distinguish "I was NOT charged twice" from "I was charged twice". Negation handling would require at minimum bigram matching or dependency parsing.

### What I'd Improve With More Time

1. **Train a real classifier** — Even a lightweight Naive Bayes model on ~500 labeled tickets would outperform keyword matching. Could be shipped locally with a small JSON weights file.
2. **Negation handling** — Detect "not", "never", "no" before keyword spans and reduce their score contribution.
3. **Streaming analysis** — Show real-time classification as the user types, not just on submit.
4. **Ticket threading** — Group tickets by user/session to detect repeat issues.
5. **Admin dashboard** — Category distribution charts, average priority by time of day, SLA breach tracking.
6. **Pagination UI** — The table currently loads 50 tickets; infinite scroll or page controls would be needed at scale.