# TriageAI — AI-Powered Support Ticket Triage

A full-stack support ticket analyzer using local NLP — no external AI APIs.

**Stack:** Express.js · MongoDB · React · Docker

---

## Quick Start

```bash
# Clone and unzip the project, then:
docker-compose up --build

# App: http://localhost:3000
# API: http://localhost:4000

```
---

## Manual Setup (without Docker)

### Backend

```bash
cd backend
npm install

# Set env file
# MONGO_URI=mongodb://localhost:27017/tickettriage
# PORT=5000

npm start         
npm run dev        
npm test         
```

### Frontend

```bash
cd frontend
npm install

npm run dev
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
│       │   └── keywords.js      ### All NLP rules
│       ├── services/
│       │   ├── analyzer.js      ### Core NLP
│       │   └── ticketService.js ### DB operations
│       ├── models/
│       │   └── ticket.js        ### Mongoose schema
│       ├── controllers/
│       │   └── ticketController.js
│       ├── middleware/
│       │   └── routes.js
│       ├── tests/
│       │   └── analyzer.test.js 
│       └── index.js          
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

---

## Data Model

```js
{
  message:      String,   
  category:     String,   
  priority:     String,   
  urgencyLevel: String,   
  confidence:   Number,   
  keywords:     [String], 
  customTags:   [String], 
  signals: {
    categoryScore:    Number,
    priorityBoost:    Number,
    urgencyMatches:   [String],
    categoryMatches:  [String]
  },
  createdAt:    Date,   
  updatedAt:    Date
}
```

**Why MongoDB?** The ticket document is naturally a denormalized unit — the message, its analysis, and signals are always accessed together. MongoDB's flexible schema also makes it easy to extend signals without migrations, and Mongoose adds validation and virtuals cleanly on top.

---

## Reflection


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