const express = require('express');
const router = express.Router();
const AiController = require('../controllers/aiController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { aiLimiter } = require('../middleware/rateLimitMiddleware');
const {
  intakeSummaryValidation,
  searchAssistantValidation,
  streamTriageValidation,
  ragQueryValidation,
  agentExecuteValidation,
} = require('../schemas/aiSchemas');

// 1. Patient Intake Summary Generator
router.post(
  '/intake-summary',
  verifyAuth,
  aiLimiter,
  intakeSummaryValidation,
  validateRequest,
  AiController.generateIntakeSummary
);

// 2. Doctor Search Assistant
router.post(
  '/search-assistant',
  aiLimiter,
  searchAssistantValidation,
  validateRequest,
  AiController.searchDoctorAssistant
);

// 3. Real-Time Streaming Triage (SSE)
router.post(
  '/stream-triage',
  aiLimiter,
  streamTriageValidation,
  validateRequest,
  AiController.streamTriage
);

router.get('/stream-triage', aiLimiter, AiController.streamTriage);

// 4. RAG Clinical Knowledge Base Query & Retrieval
router.post(
  '/rag-query',
  aiLimiter,
  ragQueryValidation,
  validateRequest,
  AiController.ragQuery
);

// 5. Get Indexed Clinical Knowledge Base Documents
router.get('/rag/knowledge-base', AiController.getKnowledgeBase);

// 6. Multi-Step Autonomous Clinical Agent Execution
router.post(
  '/agent/execute',
  verifyAuth,
  aiLimiter,
  agentExecuteValidation,
  validateRequest,
  AiController.executeAgent
);

// 7. AI Token & Cost Usage Analytics
router.get('/usage', verifyAuth, AiController.getUsageAnalytics);
router.get('/usage/analytics', verifyAuth, AiController.getUsageAnalytics);

module.exports = router;
