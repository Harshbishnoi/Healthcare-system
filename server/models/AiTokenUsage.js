const mongoose = require('mongoose');

const aiTokenUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    model: {
      type: String,
      required: true,
      index: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    estimatedCostUsd: {
      type: Number,
      default: 0.0,
    },
    feature: {
      type: String,
      enum: ['triage', 'doctor_search', 'rag_query', 'multi_step_agent', 'stream_triage', 'intake_summary'],
      default: 'triage',
      index: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'filtered'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

aiTokenUsageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AiTokenUsage', aiTokenUsageSchema);
