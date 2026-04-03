"use strict";

const {
  CATEGORIES,
  URGENCY_SIGNALS,
  SECURITY_SIGNALS,
  REFUND_SIGNALS,
  PRIORITY_LEVELS
} = require("../config/keywords");

/**
 * TicketAnalyzer
 * Pure-function NLP heuristics — no external API calls.
 * All logic is unit-testable and deterministic.
 */
class TicketAnalyzer {
  /**
   * Normalize text: lowercase + collapse whitespace.
   */
  _normalize(text) {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /**
   * Count how many keywords from a list appear in the text.
   * Returns { matches: string[], count: number }
   */
  _matchKeywords(text, keywords) {
    const normalized = this._normalize(text);
    const matches = keywords.filter((kw) => normalized.includes(kw.toLowerCase()));
    return { matches, count: matches.length };
  }

  /**
   * Classify the ticket into a category.
   * Returns { category, matchedKeywords, score }
   */
  classifyCategory(text) {
    let bestCategory = "Other";
    let bestScore = 0;
    let bestMatches = [];

    for (const [category, config] of Object.entries(CATEGORIES)) {
      if (category === "Other") continue;
      const { matches, count } = this._matchKeywords(text, config.keywords);
      const score = count * config.weight;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
        bestMatches = matches;
      }
    }

    return {
      category: bestCategory,
      matchedKeywords: bestMatches,
      categoryScore: bestScore
    };
  }

  /**
   * Detect urgency level and return priority boost.
   */
  detectUrgency(text) {
    for (const [level, config] of Object.entries(URGENCY_SIGNALS)) {
      const { matches, count } = this._matchKeywords(text, config.keywords);
      if (count > 0) {
        return {
          urgencyLevel: level,
          urgencyMatches: matches,
          priorityBoost: config.priorityBoost
        };
      }
    }
    return { urgencyLevel: "low", urgencyMatches: [], priorityBoost: 0 };
  }

  /**
   * Check custom security escalation rule.
   */
  checkSecurityRule(text) {
    const { matches, count } = this._matchKeywords(text, SECURITY_SIGNALS.keywords);
    if (count > 0) {
      return {
        triggered: true,
        tag: SECURITY_SIGNALS.tag,
        forcePriority: SECURITY_SIGNALS.forcePriority,
        forceCategory: SECURITY_SIGNALS.forceCategory,
        matches
      };
    }
    return { triggered: false };
  }

  /**
   * Check custom refund fast-track rule.
   */
  checkRefundRule(text) {
    const { matches, count } = this._matchKeywords(text, REFUND_SIGNALS.keywords);
    if (count > 0) {
      return {
        triggered: true,
        tag: REFUND_SIGNALS.tag,
        forceCategory: REFUND_SIGNALS.forceCategory,
        priorityBoost: REFUND_SIGNALS.priorityBoost,
        matches
      };
    }
    return { triggered: false };
  }

  /**
   * Compute priority from a numeric score + boosts.
   */
  computePriority(baseScore, boosts) {
    const total = baseScore + boosts;
    if (total >= PRIORITY_LEVELS.P0.minScore) return "P0";
    if (total >= PRIORITY_LEVELS.P1.minScore) return "P1";
    if (total >= PRIORITY_LEVELS.P2.minScore) return "P2";
    return "P3";
  }

  /**
   * Compute confidence score (0–1) based on keyword match density.
   */
  computeConfidence(allMatches, textLength) {
    if (allMatches.length === 0) return 0.1;
    // Normalized: more matches relative to ticket length = higher confidence
    const density = allMatches.length / Math.max(textLength / 50, 1);
    return Math.min(parseFloat((0.3 + density * 0.2).toFixed(2)), 0.99);
  }

  /**
   * Extract top keywords for display (deduped, max 8).
   */
  extractTopKeywords(allMatches) {
    return [...new Set(allMatches)].slice(0, 8);
  }

  /**
   * Main entry point: fully analyze a ticket message.
   */
  analyze(message) {
    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }

    const text = this._normalize(message);

    // Step 1: Category classification
    let { category, matchedKeywords, categoryScore } = this.classifyCategory(text);

    // Step 2: Urgency detection
    let { urgencyLevel, urgencyMatches, priorityBoost } = this.detectUrgency(text);

    // Step 3: Custom rules
    const securityRule = this.checkSecurityRule(text);
    const refundRule = this.checkRefundRule(text);

    const customTags = [];
    let forcedPriority = null;

    if (securityRule.triggered) {
      customTags.push(securityRule.tag);
      forcedPriority = securityRule.forcePriority;
      category = securityRule.forceCategory;
      urgencyLevel = "critical";
    }

    if (refundRule.triggered) {
      customTags.push(refundRule.tag);
      category = refundRule.forceCategory;
      priorityBoost += refundRule.priorityBoost;
    }

    // Step 4: Priority computation
    const allMatches = [
      ...matchedKeywords,
      ...urgencyMatches,
      ...(securityRule.matches || []),
      ...(refundRule.matches || [])
    ];

    const priority = forcedPriority || this.computePriority(categoryScore, priorityBoost);

    // Step 5: Confidence
    const confidence = this.computeConfidence(allMatches, message.length);

    // Step 6: Top keywords
    const keywords = this.extractTopKeywords(allMatches);

    return {
      category,
      priority,
      urgencyLevel,
      confidence,
      keywords,
      customTags,
      signals: {
        categoryScore,
        priorityBoost,
        urgencyMatches,
        categoryMatches: matchedKeywords
      }
    };
  }
}

module.exports = new TicketAnalyzer();