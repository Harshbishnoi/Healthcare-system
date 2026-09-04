const AiService = require('../services/aiService');
const RagService = require('../services/ragService');
const MedicalAgentService = require('../services/medicalAgentService');
const TokenCostService = require('../services/tokenCostService');
const { vectorStore } = require('../services/vectorStoreService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

class AiController {
  /**
   * 1. Patient Intake Summary Generator
   */
  static generateIntakeSummary = catchAsync(async (req, res) => {
    const { healthConcern, duration, medicalHistory } = req.body;
    const summary = await AiService.generateIntakeSummary({
      healthConcern,
      duration,
      medicalHistory,
      userId: req.user?.id,
    });

    return ApiResponse.success(res, summary, 'Patient intake summary organized by AI', 200);
  });

  /**
   * 2. Doctor Search Recommendation Assistant
   */
  static searchDoctorAssistant = catchAsync(async (req, res) => {
    const { query, city } = req.body;
    const result = await AiService.searchDoctorAssistant({
      query,
      city,
      userId: req.user?.id,
    });

    return ApiResponse.success(res, result, 'Doctor search recommendations generated', 200);
  });

  /**
   * 3. Real-Time Streaming Triage via Server-Sent Events (SSE)
   */
  static streamTriage = catchAsync(async (req, res) => {
    const { symptoms, duration, medicalHistory } = req.body;
    await AiService.streamTriageResponse(
      {
        symptoms: symptoms || req.query.symptoms,
        duration: duration || req.query.duration,
        medicalHistory,
        userId: req.user?.id,
      },
      res
    );
  });

  /**
   * 4. RAG Clinical Knowledge Base Query
   */
  static ragQuery = catchAsync(async (req, res) => {
    const { query, topK } = req.body;
    const result = await RagService.queryMedicalKnowledge({
      query,
      userId: req.user?.id,
      topK: topK ? parseInt(topK, 10) : 3,
    });

    return ApiResponse.success(res, result, 'Grounded clinical knowledge retrieved successfully', 200);
  });

  /**
   * 5. Get Indexed Clinical Knowledge Base Documents
   */
  static getKnowledgeBase = catchAsync(async (req, res) => {
    const docs = await vectorStore.getAllDocuments();
    return ApiResponse.success(res, { documents: docs, count: docs.length }, 'Clinical guidelines knowledge base', 200);
  });

  /**
   * 6. Multi-Step Autonomous ReAct Agent Execution
   */
  static executeAgent = catchAsync(async (req, res) => {
    const { goal, patientId, maxSteps } = req.body;
    const result = await MedicalAgentService.executeMultiStepAgent({
      goal,
      userId: req.user?.id,
      patientId: patientId || req.user?.patientProfileId,
      maxSteps: maxSteps ? parseInt(maxSteps, 10) : 5,
    });

    return ApiResponse.success(res, result, 'Multi-step clinical agent executed successfully', 200);
  });

  /**
   * 7. AI Token & Cost Usage Analytics
   */
  static getUsageAnalytics = catchAsync(async (req, res) => {
    // If admin, can view all, if regular user, view their own
    const userId = req.user?.role === 'admin' ? req.query.userId || null : req.user?.id;
    const analytics = await TokenCostService.getUsageAnalytics({
      userId,
      feature: req.query.feature || null,
    });

    return ApiResponse.success(res, analytics, 'AI token and cost usage analytics retrieved', 200);
  });
}

module.exports = AiController;
