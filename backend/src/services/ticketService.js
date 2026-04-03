"use strict";

const Ticket = require("../models/ticket");
const analyzer = require("./analyzer");

class TicketService {
  /**
   * Analyze a message and persist the result to MongoDB.
   */
  async analyzeAndSave(message) {
    const analysis = analyzer.analyze(message);

    const ticket = new Ticket({
      message,
      ...analysis
    });

    await ticket.save();
    return ticket;
  }

  /**
   * List recent tickets, most recent first.
   * @param {number} limit - max tickets to return (default 50)
   * @param {number} skip  - for pagination
   */
  async listTickets({ limit = 50, skip = 0 } = {}) {
    const [tickets, total] = await Promise.all([
      Ticket.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Ticket.countDocuments()
    ]);
    return { tickets, total };
  }

  /**
   * Get a single ticket by ID.
   */
  async getTicketById(id) {
    return Ticket.findById(id).lean({ virtuals: true });
  }
}

module.exports = new TicketService();