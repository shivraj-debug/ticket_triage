"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const ticketRoutes = require("./middleware/routes");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/tickettriage";

//  Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("API is running ");
});

app.use("/tickets", ticketRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, error: "Route not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Unexpected error" });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(" MongoDB connected:", MONGO_URI);
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  } catch (err) {
    console.error(" Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;