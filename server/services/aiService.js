const { genAI, modelName, AI_SAFETY_SYSTEM_INSTRUCTION } = require('../config/ai.config');
const AppError = require('../utils/appError');

/**
 * Medical Specializations Knowledge Map for Safe Search Recommendation
 */
const SPECIALIZATION_RULES = [
  {
    specialization: 'Cardiology',
    keywords: ['chest pain', 'heart', 'palpitations', 'blood pressure', 'hypertension', 'shortness of breath', 'cholesterol', 'cardio'],
    description: 'Heart and cardiovascular system health',
  },
  {
    specialization: 'Dermatology',
    keywords: ['skin', 'rash', 'acne', 'itching', 'eczema', 'psoriasis', 'mole', 'hair loss', 'scalp', 'dermatitis'],
    description: 'Skin, hair, and nail conditions',
  },
  {
    specialization: 'General Medicine',
    keywords: ['fever', 'cold', 'cough', 'fatigue', 'weakness', 'headache', 'body ache', 'flu', 'infection', 'vomiting', 'nausea'],
    description: 'General adult primary healthcare and initial medical evaluation',
  },
  {
    specialization: 'Pediatrics',
    keywords: ['child', 'baby', 'infant', 'toddler', 'vaccination', 'growth', 'pediatric', 'kids fever'],
    description: 'Infant, child, and adolescent healthcare',
  },
  {
    specialization: 'Orthopedics',
    keywords: ['joint pain', 'knee', 'bone', 'fracture', 'back pain', 'spine', 'shoulder', 'arthritis', 'ligament', 'sprain'],
    description: 'Bones, joints, ligaments, tendons, and muscles',
  },
  {
    specialization: 'Neurology',
    keywords: ['migraine', 'nerve', 'seizure', 'dizziness', 'numbness', 'tremor', 'neuropathy', 'paralysis'],
    description: 'Brain, spinal cord, and nervous system health',
  },
  {
    specialization: 'ENT (Otolaryngology)',
    keywords: ['ear', 'nose', 'throat', 'sinus', 'tonsils', 'hearing', 'tinnitus', 'hoarseness'],
    description: 'Ear, nose, and throat conditions',
  },
  {
    specialization: 'Psychiatry',
    keywords: ['anxiety', 'depression', 'stress', 'mental health', 'insomnia', 'panic', 'mood', 'phobia'],
    description: 'Mental health and behavioral well-being',
  },
  {
    specialization: 'Gastroenterology',
    keywords: ['stomach', 'acid reflux', 'gas', 'constipation', 'diarrhea', 'abdomen', 'digestive', 'liver', 'ulcer'],
    description: 'Digestive system and gastrointestinal health',
  },
  {
    specialization: 'Ophthalmology',
    keywords: ['eye', 'vision', 'blurred', 'dry eye', 'cataract', 'glaucoma', 'redness eye'],
    description: 'Eye care and vision health',
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
    .substring(0, 1000); // Limit input length
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
   * Feature 1: Patient Intake Summary Generator
   */
  static async generateIntakeSummary({ healthConcern, duration, medicalHistory }) {
    const cleanConcern = sanitizeAiInput(healthConcern);
    const cleanDuration = sanitizeAiInput(duration);
    const cleanHistory = sanitizeAiInput(medicalHistory);

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

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON block
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return sanitizeAiOutput(parsed);
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

    return sanitizeAiOutput(fallbackSummary);
  }

  /**
   * Feature 2: Doctor Search Assistant
   * Recommends relevant medical specializations and filter suggestions based on natural language symptoms
   */
  static async searchDoctorAssistant({ query, city }) {
    const cleanQuery = sanitizeAiInput(query).toLowerCase();
    const cleanCity = sanitizeAiInput(city);

    let recommendedSpecializations = [];
    let reasoning = '';

    // Match keywords against knowledge base
    SPECIALIZATION_RULES.forEach((rule) => {
      const matches = rule.keywords.filter((kw) => cleanQuery.includes(kw));
      if (matches.length > 0) {
        recommendedSpecializations.push({
          specialization: rule.specialization,
          matchScore: matches.length,
          reason: `Matched keywords: ${matches.join(', ')} (${rule.description})`,
        });
      }
    });

    // Sort by match score
    recommendedSpecializations.sort((a, b) => b.matchScore - a.matchScore);

    if (recommendedSpecializations.length === 0) {
      recommendedSpecializations.push({
        specialization: 'General Medicine',
        matchScore: 1,
        reason: 'Recommended for primary evaluation and initial physical examination.',
      });
    }

    const primarySpecialization = recommendedSpecializations[0].specialization;

    // Call Gemini for enhanced contextual reasoning if available
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
        const result = await model.generateContent(prompt);
        const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
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
}

module.exports = AiService;
