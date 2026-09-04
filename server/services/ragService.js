const { vectorStore } = require('./vectorStoreService');
const { genAI, modelName, AI_SAFETY_SYSTEM_INSTRUCTION } = require('../config/ai.config');
const TokenCostService = require('./tokenCostService');
const AppError = require('../utils/appError');

class RagService {
  /**
   * Execute Retrieval-Augmented Generation (RAG) query for clinical guidance
   */
  static async queryMedicalKnowledge({ query, userId = null, topK = 3 }) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      throw new AppError('A valid medical query is required for knowledge retrieval.', 422);
    }

    const startTime = Date.now();
    const cleanQuery = query.trim().substring(0, 500);

    // 1. Vector Similarity Retrieval: Retrieve top-K relevant clinical chunks
    const retrievedDocs = await vectorStore.search(cleanQuery, topK, 0.15);

    // Construct grounded context string
    const contextText = retrievedDocs
      .map(
        (doc, index) =>
          `[Source ${index + 1}: ${doc.title} (${doc.source})]\n${doc.chunkText}`
      )
      .join('\n\n');

    let answer = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let groundedConfidence = retrievedDocs.length > 0 ? Math.min(0.98, retrievedDocs[0].similarity + 0.1) : 0.4;

    // 2. Augment Prompt with Retrieved Context & Guardrails
    const augmentedPrompt = `
You are an expert Clinical Knowledge Retrieval Assistant. Answer the patient's medical question using ONLY the provided clinical sources when applicable.

RULES:
1. Do NOT make a definitive diagnosis or prescribe specific drug dosages.
2. Cite the sources provided (e.g. [Source 1], [Source 2]).
3. If an emergency red flag is present (e.g., chest pain, stroke signs, difficulty breathing), immediately advise seeking emergency services (911).
4. Clearly state which doctor specialization the patient should consult.

PROVIDED CLINICAL KNOWLEDGE:
${contextText || 'No specific clinical documents retrieved for this query.'}

PATIENT QUESTION:
"${cleanQuery}"

Provide a structured, grounded response:
`;

    // 3. Call LLM (Gemini API) if available
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: AI_SAFETY_SYSTEM_INSTRUCTION,
        });

        promptTokens = TokenCostService.estimateTokens(augmentedPrompt);
        const result = await model.generateContent(augmentedPrompt);
        answer = result.response.text();
        completionTokens = TokenCostService.estimateTokens(answer);
      } catch (err) {
        console.warn('[RagService] Gemini generation fallback:', err.message);
      }
    }

    // Deterministic Fallback if LLM offline
    if (!answer) {
      if (retrievedDocs.length > 0) {
        const topDoc = retrievedDocs[0];
        answer = `Based on established clinical guidelines from ${topDoc.source} (${topDoc.title}):\n\n` +
          `Key Clinical Guidance: ${topDoc.chunkText}\n\n` +
          `Recommended Action: Please consult a specialist in ${topDoc.category.toUpperCase()} for a comprehensive physical evaluation and clinical diagnosis.`;
      } else {
        answer = `Based on general medical principles, your reported concern ("${cleanQuery}") should be evaluated by a licensed healthcare provider in General Medicine to assess underlying causes and appropriate clinical care.`;
      }
      promptTokens = TokenCostService.estimateTokens(augmentedPrompt);
      completionTokens = TokenCostService.estimateTokens(answer);
    }

    const latencyMs = Date.now() - startTime;

    // 4. Track Tokens and Cost
    const usageLog = await TokenCostService.logAiUsage({
      userId,
      model: modelName,
      promptTokens,
      completionTokens,
      feature: 'rag_query',
      latencyMs,
    });

    return {
      query: cleanQuery,
      answer,
      groundedConfidence: Number(groundedConfidence.toFixed(3)),
      citations: retrievedDocs.map((doc, idx) => ({
        sourceNumber: idx + 1,
        title: doc.title,
        source: doc.source,
        category: doc.category,
        relevanceScore: doc.similarity,
      })),
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: usageLog.totalTokens,
        estimatedCostUsd: usageLog.estimatedCostUsd,
      },
      safetyDisclaimer:
        'This information is retrieved from medical reference materials for educational guidance only. It is NOT a medical diagnosis and does NOT replace direct consultation with a qualified doctor.',
    };
  }
}

module.exports = RagService;
