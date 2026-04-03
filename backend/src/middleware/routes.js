"use strict";

const { Router } = require("express");
const { body } = require("express-validator");
const ticketController = require("../controllers/ticketController");

const router = Router();

const analyzeValidation = [
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 10 }).withMessage("Message must be at least 10 characters")
    .isLength({ max: 5000 }).withMessage("Message cannot exceed 5000 characters")
];

router.post("/analyze", analyzeValidation, (req, res) => ticketController.analyze(req, res));
router.get("/", (req, res) => ticketController.list(req, res));
router.get("/:id", (req, res) => ticketController.getOne(req, res));

module.exports = router;