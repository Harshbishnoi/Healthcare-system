const { genAI, modelName, AI_SAFETY_SYSTEM_INSTRUCTION } = require('../config/ai.config');
const AppError = require('../utils/appError');
const TokenCostService = require('./tokenCostService');

/**
 * Medical Specializations Knowledge Map for Safe Search Recommendation
 */
const SPECIALIZATION_RULES = [
  {
    specialization: 'Cardiology',
    keywords: ['chest pain', 'heart', 'palpitations', 'blood pressure', 'hypertension', 'shortness of breath', 'cholesterol', 'cardio', 'substernal', 'left arm'],
    description: 'Heart and cardiovascular system health',
  },
  {
    specialization: 'Neurology',
    keywords: ['facial drooping', 'slurred speech', 'stroke', 'migraine', 'nerve', 'seizure', 'dizziness', 'numbness', 'tremor', 'neuropathy', 'paralysis', 'aura', 'throbbing headache', 'brain'],
    description: 'Brain, spinal cord, and nervous system health',
  },
  {
    specialization: 'Pediatrics',
    keywords: ['baby', 'infant', 'child', 'toddler', 'pediatric', 'rectal fever', 'neonatal', 'vaccination', 'kids fever', 'daughter', 'son'],
    description: 'Infant, child, and adolescent healthcare',
  },
  {
    specialization: 'Orthopedics',
    keywords: ['joint pain', 'knee', 'fracture', 'back pain', 'spine', 'shoulder', 'arthritis', 'ligament', 'sprain', 'bone pain', 'bone fracture', 'twisted my knee', 'pop in joint'],
    description: 'Bones, joints, ligaments, tendons, and muscles',
  },
  {
    specialization: 'Gastroenterology',
    keywords: ['acid reflux', 'burning sensation behind breastbone', 'heartburn', 'acid taste', 'stomach', 'gas', 'constipation', 'diarrhea', 'abdomen', 'digestive', 'liver', 'ulcer', 'gerd', 'bowel'],
    description: 'Digestive system and gastrointestinal health',
  },
  {
    specialization: 'Dermatology',
    keywords: ['skin', 'rash', 'acne', 'itching', 'eczema', 'psoriasis', 'mole', 'hair loss', 'scalp', 'dermatitis', 'lips swelling', 'throat closing', 'anaphylaxis', 'allergic reaction', 'peanuts'],
    description: 'Skin, hair, and nail conditions',
  },
  {
    specialization: 'ENT (Otolaryngology)',
    keywords: ['ear', 'nose', 'throat', 'sinus', 'tonsils', 'hearing', 'tinnitus', 'ringing in ears', 'ear fullness', 'hoarseness'],
    description: 'Ear, nose, and throat conditions',
  },
  {
    specialization: 'Psychiatry',
    keywords: ['anxiety', 'depression', 'stress', 'mental health', 'insomnia', 'panic', 'mood', 'phobia', 'panic attacks', 'mood swings'],
    description: 'Mental health and behavioral well-being',
  },
  {
    specialization: 'Ophthalmology',
    keywords: ['eye', 'vision', 'blurred', 'dry eye', 'cataract', 'glaucoma', 'redness eye', 'irritated eyes'],
    description: 'Eye care and vision health',
  },
  {
    specialization: 'General Medicine',
    keywords: ['general weakness', 'fever', 'cold', 'cough', 'fatigue', 'weakness', 'headache', 'body ache', 'flu', 'infection', 'vomiting', 'nausea'],
    description: 'General adult primary healthcare and initial medical evaluation',
  },
];

/**
 * Filter and sanitize user input against prompt injection attempts
 */
function sanitizeAiInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/ignore (all )?previous instructions/gi, '[filtered]')
    .replace(/system prompt/gi, '[filtered]')
    .replace(/disregard safety/gi, '[filtered]')
    .replace(/act as a doctor and prescribe/gi, '[filtered]')
    .trim()
    .substring(0, 1000);
}

/**
 * Validate that the output contains no prescriptive statements or definitive diagnoses
 */
function sanitizeAiOutput(outputObj) {
  const forbiddenPatterns = [
    /you definitely have\s+/i,
    /take\s+\d+\s*mg/i,
    /i prescribe\s+/i,
    /stop taking your medication/i,
  ];

  const stringified = JSON.stringify(outputObj);
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(stringified)) {
      throw new AppError('AI output violated medical safety guardrails. Generation rejected.', 422);
    }
  }

  // Ensure universal safety disclaimer is always present
  if (!outputObj.safetyNotice || outputObj.safetyNotice.trim() === '') {
    outputObj.safetyNotice =
      'This summary is organized by AI for communication assistance only. It is NOT a medical diagnosis and does NOT replace consultation with a licensed doctor.';
  }

  return outputObj;
}

class AiService {
  /**
   * Feature 1: Patient Intake Summary Generator with Token Monitoring
   */
  static async generateIntakeSummary({ healthConcern, duration, medicalHistory, userId = null }) {
    const startTime = Date.now();
    const cleanConcern = sanitizeAiInput(healthConcern);
    const cleanDuration = sanitizeAiInput(duration);
    const cleanHistory = sanitizeAiInput(medicalHistory);

    let promptTokens = 0;
    let completionTokens = 0;

    // Try Gemini API if initialized
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: AI_SAFETY_SYSTEM_INSTRUCTION,
        });

        const prompt = `
Please organize the following patient intake details into a structured JSON summary for their doctor.
Do NOT diagnose or prescribe anything.

Patient Health Concern: ${cleanConcern}
Duration of Issue: ${cleanDuration || 'Not specified'}
Past Medical History: ${cleanHistory || 'None mentioned'}

Respond ONLY with a valid JSON object in this exact schema:
{
  "healthConcern": "Concise summary of stated symptoms without diagnosis",
  "duration": "Summary of duration",
  "historySummary": "Relevant medical history summary",
  "questionsForDoctor": ["3 to 4 recommended questions the patient can ask their doctor"],
  "safetyNotice": "Notice stating this is not a diagnosis and to consult a doctor"
}
`;
        promptTokens = TokenCostService.estimateTokens(prompt);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        completionTokens = TokenCostService.estimateTokens(responseText);

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const sanitized = sanitizeAiOutput(parsed);

          await TokenCostService.logAiUsage({
            userId,
            model: modelName,
            promptTokens,
            completionTokens,
            feature: 'intake_summary',
            latencyMs: Date.now() - startTime,
          });

          return sanitized;
        }
      } catch (err) {
        console.warn('[AiService] Gemini API call fallback triggered:', err.message);
      }
    }

    // Deterministic Rule-Based Safe Fallback Engine
    const defaultQuestions = [
      'What diagnostic tests or physical examinations do you recommend to assess this issue?',
      'Are there any specific lifestyle modifications or symptoms I should monitor?',
      'What are the potential underlying causes of these symptoms?',
      'When should I schedule a follow-up consultation?',
    ];

    const fallbackSummary = {
      healthConcern: cleanConcern,
      duration: cleanDuration || 'Unspecified duration',
      historySummary: cleanHistory || 'No prior medical history provided',
      questionsForDoctor: defaultQuestions,
      safetyNotice:
        'This summary is organized by AI for communication assistance only. It is NOT a medical diagnosis and does NOT replace consultation with a licensed doctor.',
    };

    promptTokens = TokenCostService.estimateTokens(cleanConcern + cleanDuration + cleanHistory);
    completionTokens = TokenCostService.estimateTokens(JSON.stringify(fallbackSummary));

    await TokenCostService.logAiUsage({
      userId,
      model: modelName,
      promptTokens,
      completionTokens,
      feature: 'intake_summary',
      latencyMs: Date.now() - startTime,
    });

    return sanitizeAiOutput(fallbackSummary);
  }

  /**
   * Feature 2: Doctor Search Assistant
   */
  static async searchDoctorAssistant({ query, city, userId = null }) {
    const startTime = Date.now();
    const cleanQuery = sanitizeAiInput(query).toLowerCase();
    const cleanCity = sanitizeAiInput(city);

    let recommendedSpecializations = [];

    // Match keywords against knowledge base with phrase-weighted scoring
    SPECIALIZATION_RULES.forEach((rule) => {
      const matches = rule.keywords.filter((kw) => cleanQuery.includes(kw));
      if (matches.length > 0) {
        const score = matches.reduce((sum, kw) => sum + (kw.split(' ').length * 3) + (kw.length * 0.1), 0);
        recommendedSpecializations.push({
          specialization: rule.specialization,
          matchScore: score,
          reason: `Matched keywords: ${matches.join(', ')} (${rule.description})`,
        });
      }
    });

    recommendedSpecializations.sort((a, b) => b.matchScore - a.matchScore);

    if (recommendedSpecializations.length === 0) {
      recommendedSpecializations.push({
        specialization: 'General Medicine',
        matchScore: 1,
        reason: 'Recommended for primary evaluation and initial physical examination.',
      });
    }

    const primarySpecialization = recommendedSpecializations[0].specialization;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: AI_SAFETY_SYSTEM_INSTRUCTION,
        });

        const prompt = `
A patient entered this health concern to find a doctor: "${cleanQuery}" (City: ${cleanCity || 'Any'}).
Identify the top relevant doctor specializations (e.g. Cardiology, Dermatology, General Medicine, Orthopedics, ENT, Pediatrics, Neurology, Psychiatry, Gastroenterology).
DO NOT diagnose or recommend treatments.

Return ONLY a JSON object:
{
  "recommendedSpecializations": ["Specialization 1", "Specialization 2"],
  "searchKeywords": ["keyword1", "keyword2"],
  "guidance": "Brief neutral explanation of why this specialist category is appropriate to consult",
  "disclaimer": "AI guidance only. Please consult a qualified physician."
}
`;
        const promptTokens = TokenCostService.estimateTokens(prompt);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const completionTokens = TokenCostService.estimateTokens(responseText);

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          await TokenCostService.logAiUsage({
            userId,
            model: modelName,
            promptTokens,
            completionTokens,
            feature: 'doctor_search',
            latencyMs: Date.now() - startTime,
          });

          return {
            query: cleanQuery,
            city: cleanCity,
            primarySpecialization: parsed.recommendedSpecializations?.[0] || primarySpecialization,
            recommendedSpecializations: parsed.recommendedSpecializations || [primarySpecialization],
            searchKeywords: parsed.searchKeywords || [primarySpecialization],
            guidance: parsed.guidance || `We recommend consulting a ${primarySpecialization} specialist for clinical evaluation.`,
            safetyDisclaimer: 'This search recommendation is generated by AI to help discover doctors. It is NOT a clinical diagnosis.',
          };
        }
      } catch (err) {
        console.warn('[AiService] Gemini Search Assistant fallback:', err.message);
      }
    }

    const promptTokens = TokenCostService.estimateTokens(cleanQuery + cleanCity);
    const completionTokens = TokenCostService.estimateTokens(primarySpecialization);

    await TokenCostService.logAiUsage({
      userId,
      model: modelName,
      promptTokens,
      completionTokens,
      feature: 'doctor_search',
      latencyMs: Date.now() - startTime,
    });

    return {
      query: cleanQuery,
      city: cleanCity,
      primarySpecialization,
      recommendedSpecializations: recommendedSpecializations.map((r) => r.specialization),
      searchKeywords: [primarySpecialization, ...cleanQuery.split(' ').filter((w) => w.length > 3)],
      guidance: `Based on your symptoms, a consultation with a specialist in ${primarySpecialization} is recommended for accurate medical assessment.`,
      safetyDisclaimer: 'This search recommendation is generated by AI to help discover doctors. It is NOT a clinical diagnosis.',
    };
  }

  /**
   * Feature 3: Real-Time Streaming Triage via Server-Sent Events (SSE)
   */
  static async streamTriageResponse({ symptoms, duration, medicalHistory, userId = null }, res) {
    const startTime = Date.now();
    const cleanSymptoms = sanitizeAiInput(symptoms);
    const cleanDuration = sanitizeAiInput(duration);

    // Setup Server-Sent Events (SSE) Response Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (eventData) => {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    sendEvent({ type: 'start', message: 'Analyzing symptoms and retrieving clinical guidance...' });

    let fullGeneratedText = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const prompt = `
You are a clinical navigation assistant. Provide a helpful, structured symptom assessment for the following concern:
Patient Symptoms: "${cleanSymptoms}"
Duration: "${cleanDuration || 'Not stated'}"

Structure your response into:
1. Symptom Assessment (Objective analysis of reported issues)
2. Urgency Level (Emergency, Urgent, or Routine)
3. Recommended Specialist to Consult
4. Preparation Tips for the Doctor Visit

DO NOT provide a definitive diagnosis or prescribe drug doses. Include safety reminders.
`;

    promptTokens = TokenCostService.estimateTokens(prompt);

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: AI_SAFETY_SYSTEM_INSTRUCTION,
        });

        const streamingResp = await model.generateContentStream(prompt);
        for await (const chunk of streamingResp.stream) {
          const chunkText = chunk.text();
          fullGeneratedText += chunkText;
          sendEvent({ type: 'chunk', chunk: chunkText, done: false });
        }
      } catch (streamErr) {
        console.warn('[AiService] Streaming fallback triggered:', streamErr.message);
      }
    }

    // Deterministic fallback if streaming was not handled by live API
    if (!fullGeneratedText) {
      const fallbackChunks = [
        `### 1. Clinical Symptom Overview\n`,
        `You reported: "${cleanSymptoms}". These symptoms warrant evaluation by a healthcare professional.\n\n`,
        `### 2. Triage & Urgency\n`,
        cleanSymptoms.toLowerCase().includes('chest') || cleanSymptoms.toLowerCase().includes('heart')
          ? `**Status: EMERGENCY.** If experiencing crushing chest pressure or difficulty breathing, call 911 immediately.\n\n`
          : `**Status: Routine to Priority.** Schedule a consultation for a physical exam.\n\n`,
        `### 3. Recommended Specialty\n`,
        `We recommend scheduling an appointment with a General Medicine or Specialist physician.\n\n`,
        `### 4. Preparation Tips\n`,
        `- Record when symptoms started and triggers.\n`,
        `- Bring a list of current medications and allergies.\n`,
      ];

      for (const chunk of fallbackChunks) {
        fullGeneratedText += chunk;
        sendEvent({ type: 'chunk', chunk, done: false });
      }
    }

    completionTokens = TokenCostService.estimateTokens(fullGeneratedText);
    const latencyMs = Date.now() - startTime;

    const usageLog = await TokenCostService.logAiUsage({
      userId,
      model: modelName,
      promptTokens,
      completionTokens,
      feature: 'stream_triage',
      latencyMs,
    });

    // Send final completion event with token and cost metrics
    sendEvent({
      type: 'done',
      done: true,
      stats: {
        promptTokens,
        completionTokens,
        totalTokens: usageLog.totalTokens,
        estimatedCostUsd: usageLog.estimatedCostUsd,
        latencyMs,
      },
      safetyDisclaimer:
        'This streaming assessment is for triage preparation only. It is NOT a medical diagnosis.',
    });

    res.end();
  }
}

module.exports = AiService;
