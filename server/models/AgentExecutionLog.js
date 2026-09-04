const mongoose = require('mongoose');

const agentExecutionLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    goal: {
      type: String,
      required: true,
    },
    steps: [
      {
        stepNumber: Number,
        thought: String,
        action: String,
        actionInput: mongoose.Schema.Types.Mixed,
        observation: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    finalResult: {
      type: String,
      required: true,
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    totalCostUsd: {
      type: Number,
      default: 0.0,
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AgentExecutionLog', agentExecutionLogSchema);
