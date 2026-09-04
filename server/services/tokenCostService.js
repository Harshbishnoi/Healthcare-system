const prisma = require('../config/prisma');
const AiTokenUsage = require('../models/AiTokenUsage');

/**
 * Model Pricing Matrix (USD per 1M tokens)
 */
const MODEL_PRICING = {
  'gemini-1.5-flash': {
    inputPerMillion: 0.075,
    outputPerMillion: 0.3,
  },
  'gemini-1.5-pro': {
    inputPerMillion: 3.5,
    outputPerMillion: 10.5,
  },
  'gemini-pro': {
    inputPerMillion: 0.5,
    outputPerMillion: 1.5,
  },
  'text-embedding-004': {
    inputPerMillion: 0.025,
    outputPerMillion: 0.0,
  },
  'gpt-4o': {
    inputPerMillion: 5.0,
    outputPerMillion: 15.0,
  },
};

class TokenCostService {
  /**
   * Estimate token count from text (standard heuristic: ~4 chars / token in English)
   */
  static estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).length;
    // Blend of character and word heuristic
    return Math.max(1, Math.round((charCount / 4 + wordCount * 1.3) / 2));
  }

  /**
   * Calculate cost in USD based on model and token counts
   */
  static calculateCost(model, promptTokens, completionTokens) {
    const key = Object.keys(MODEL_PRICING).find((k) =>
      model.toLowerCase().includes(k.toLowerCase())
    ) || 'gemini-1.5-flash';

    const pricing = MODEL_PRICING[key];
    const promptCost = (promptTokens / 1_000_000) * pricing.inputPerMillion;
    const completionCost = (completionTokens / 1_000_000) * pricing.outputPerMillion;

    return Number((promptCost + completionCost).toFixed(8));
  }

  /**
   * Persist AI token usage in database (Prisma or Mongoose)
   */
  static async logAiUsage({
    userId = null,
    model = 'gemini-1.5-flash',
    promptTokens = 0,
    completionTokens = 0,
    feature = 'triage',
    latencyMs = 0,
    status = 'success',
  }) {
    const totalTokens = promptTokens + completionTokens;
    const estimatedCostUsd = this.calculateCost(model, promptTokens, completionTokens);

    const record = {
      userId: userId ? String(userId) : null,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
      feature,
      latencyMs,
      status,
      createdAt: new Date(),
    };

    // Try persisting to Prisma Postgres
    try {
      if (prisma && prisma.aiTokenUsage) {
        await prisma.aiTokenUsage.create({
          data: {
            userId: record.userId,
            model: record.model,
            promptTokens: record.promptTokens,
            completionTokens: record.completionTokens,
            totalTokens: record.totalTokens,
            estimatedCostUsd: record.estimatedCostUsd,
            feature: record.feature,
            latencyMs: record.latencyMs,
            status: record.status,
          },
        });
      }
    } catch (prismaErr) {
      // Try Mongoose fallback
      try {
        await AiTokenUsage.create(record);
      } catch (mongoErr) {
        // Fallback silently logged to prevent disrupting live requests
        console.warn('[TokenCostService] Usage logging database fallback:', prismaErr.message);
      }
    }

    return record;
  }

  /**
   * Retrieve aggregated usage analytics
   */
  static async getUsageAnalytics({ userId = null, feature = null } = {}) {
    let records = [];

    try {
      if (prisma && prisma.aiTokenUsage) {
        const whereClause = {};
        if (userId) whereClause.userId = String(userId);
        if (feature) whereClause.feature = feature;
        records = await prisma.aiTokenUsage.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 500,
        });
      }
    } catch (err) {
      try {
        const query = {};
        if (userId) query.userId = userId;
        if (feature) query.feature = feature;
        records = await AiTokenUsage.find(query).sort({ createdAt: -1 }).limit(500).lean();
      } catch (mErr) {
        records = [];
      }
    }

    const totalRequests = records.length;
    const totalPromptTokens = records.reduce((sum, r) => sum + (r.promptTokens || 0), 0);
    const totalCompletionTokens = records.reduce((sum, r) => sum + (r.completionTokens || 0), 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const totalCostUsd = records.reduce((sum, r) => sum + (r.estimatedCostUsd || 0), 0);
    const avgLatencyMs =
      totalRequests > 0
        ? Math.round(records.reduce((sum, r) => sum + (r.latencyMs || 0), 0) / totalRequests)
        : 0;

    // Breakdown by feature
    const featureBreakdown = {};
    records.forEach((r) => {
      const f = r.feature || 'unknown';
      if (!featureBreakdown[f]) {
        featureBreakdown[f] = { count: 0, tokens: 0, costUsd: 0 };
      }
      featureBreakdown[f].count += 1;
      featureBreakdown[f].tokens += r.totalTokens || 0;
      featureBreakdown[f].costUsd += r.estimatedCostUsd || 0;
    });

    return {
      summary: {
        totalRequests,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        totalCostUsd: Number(totalCostUsd.toFixed(6)),
        avgLatencyMs,
      },
      featureBreakdown,
      recentLogs: records.slice(0, 20),
    };
  }
}

module.exports = TokenCostService;
