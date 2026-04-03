

const CATEGORIES = {
  Billing: {
    keywords: [
      "invoice", "payment", "charge", "charged", "billing", "bill", "subscription",
      "refund", "credit", "debit", "receipt", "transaction", "price", "cost",
      "fee", "overcharged", "discount", "coupon", "plan", "upgrade", "downgrade",
      "cancel", "cancellation", "renewal", "expire", "expired", "promo"
    ],
    weight: 1.0
  },
  Technical: {
    keywords: [
      "error", "bug", "crash", "broken", "not working", "down", "outage",
      "slow", "timeout", "fail", "failed", "failure", "issue", "problem",
      "exception", "stack trace", "500", "404", "503", "api", "endpoint",
      "login", "cannot login", "can't login", "reset password", "password",
      "integration", "sync", "database", "server", "deploy", "deployment",
      "performance", "latency", "freeze", "frozen", "unresponsive"
    ],
    weight: 1.0
  },
  Account: {
    keywords: [
      "account", "profile", "username", "email", "access", "permission",
      "role", "locked", "banned", "suspended", "verify", "verification",
      "two factor", "2fa", "mfa", "settings", "preferences", "data export",
      "delete account", "close account", "gdpr", "privacy"
    ],
    weight: 1.0
  },
  "Feature Request": {
    keywords: [
      "feature", "request", "suggestion", "improve", "improvement", "enhancement",
      "add", "would be great", "would love", "wish", "hoping", "consider",
      "roadmap", "future", "idea", "proposal", "feedback", "recommend"
    ],
    weight: 0.9
  },
  Other: {
    keywords: [],
    weight: 0.5
  }
};

const URGENCY_SIGNALS = {
  critical: {
    keywords: [
      "urgent", "urgently", "asap", "immediately", "emergency", "critical",
      "down", "outage", "not working", "broken", "crash", "data loss",
      "security breach", "hacked", "compromised", "production down",
      "all users affected", "revenue impact", "financial loss"
    ],
    priorityBoost: 2
  },
  high: {
    keywords: [
      "important", "high priority", "blocking", "blocker", "cannot proceed",
      "deadline", "today", "hours", "losing customers", "customers complaining"
    ],
    priorityBoost: 1
  },
  medium: {
    keywords: [
      "soon", "this week", "when possible", "frustrating", "annoying"
    ],
    priorityBoost: 0
  }
};


const SECURITY_SIGNALS = {
  keywords: [
    "security", "breach", "hacked", "hack", "vulnerability", "exploit",
    "phishing", "malware", "ransomware", "unauthorized access", "data leak",
    "credentials exposed", "suspicious activity", "account takeover",
    "sql injection", "xss", "ddos", "attack"
  ],
  forcePriority: "P0",
  forceCategory: "Technical",
  tag: "SECURITY_ESCALATION"
};


const REFUND_SIGNALS = {
  keywords: ["refund", "money back", "chargeback", "dispute", "charged twice", "double charged"],
  forceCategory: "Billing",
  priorityBoost: 1,
  tag: "REFUND_REQUEST"
};

const PRIORITY_LEVELS = {
  P0: { label: "Critical", minScore: 8 },
  P1: { label: "High",     minScore: 5 },
  P2: { label: "Medium",   minScore: 2 },
  P3: { label: "Low",      minScore: 0 }
};

module.exports = {
  CATEGORIES,
  URGENCY_SIGNALS,
  SECURITY_SIGNALS,
  REFUND_SIGNALS,
  PRIORITY_LEVELS
};