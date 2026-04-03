"use strict";

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
      trim: true
    },
    category: {
      type: String,
      enum: ["Billing", "Technical", "Account", "Feature Request", "Other"],
      required: true
    },
    priority: {
      type: String,
      enum: ["P0", "P1", "P2", "P3"],
      required: true
    },
    urgencyLevel: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "low"
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    keywords: [String],
    customTags: [String],
    signals: {
      categoryScore: Number,
      priorityBoost: Number,
      urgencyMatches: [String],
      categoryMatches: [String]
    }
  },
  {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


ticketSchema.virtual("priorityLabel").get(function () {
  const labels = { P0: "Critical", P1: "High", P2: "Medium", P3: "Low" };
  return labels[this.priority] || this.priority;
});


ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Ticket", ticketSchema);