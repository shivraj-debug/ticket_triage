"use strict";

const { validationResult } = require("express-validator");
const ticketService = require("../services/ticketService");

class TicketController {

  async analyze(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => e.msg)
      });
    }

    try {
      const ticket = await ticketService.analyzeAndSave(req.body.message);
      return res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      console.error("[TicketController.analyze]", err.message);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }


  async list(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const skip = parseInt(req.query.skip) || 0;
      const result = await ticketService.listTickets({ limit, skip });
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error("[TicketController.list]", err.message);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

 
  async getOne(req, res) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      if (!ticket) {
        return res.status(404).json({ success: false, error: "Ticket not found" });
      }
      return res.status(200).json({ success: true, data: ticket });
    } catch (err) {
      console.error("[TicketController.getOne]", err.message);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

module.exports = new TicketController();