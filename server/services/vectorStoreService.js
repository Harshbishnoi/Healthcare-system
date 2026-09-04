const { genAI } = require('../config/ai.config');

/**
 * Curated Clinical Knowledge Base Documents
 */
const INITIAL_KNOWLEDGE_BASE = [
  {
    id: 'kb-cardio-001',
    title: 'AHA/ACC Clinical Guidelines: Acute Coronary Syndrome & Chest Pain',
    category: 'cardiology',
    source: 'American Heart Association / ACC Guidelines',
    chunkText:
      'Any patient presenting with sudden crushing substernal chest pressure, radiation to the left arm, jaw, or neck, associated with diaphoresis, dyspnea, or nausea MUST be treated as potential Acute Coronary Syndrome (ACS) or Myocardial Infarction. Immediate emergency services (911/EMS) activation is mandatory. Aspirin 324mg chewable should be considered if not contraindicated. Do not delay emergency transport for primary clinic consultations.',
    keywords: ['chest pain', 'heart attack', 'myocardial infarction', 'cardiology', 'left arm', 'palpitations', 'dyspnea'],
  },
  {
    id: 'kb-peds-002',
    title: 'AAP Clinical Practice: Pediatric Fever & Lethargy Protocols',
    category: 'pediatrics',
    source: 'American Academy of Pediatrics (AAP)',
    chunkText:
      'In infants younger than 3 months of age, a rectal temperature of 100.4°F (38.0°C) or higher requires immediate emergency department evaluation for neonatal sepsis workup. In older children, red flags warranting urgent clinical care include respiratory distress (grunting, stridor, flaring), cyanosis, persistent non-blanching petechial rash, unresponsiveness, or signs of severe dehydration.',
    keywords: ['pediatric', 'fever', 'infant', 'baby', 'child', 'dehydration', 'rash', 'lethargy'],
  },
  {
    id: 'kb-neuro-003',
    title: 'AAN Guidelines: Acute Ischemic Stroke Identification (BE-FAST)',
    category: 'neurology',
    source: 'American Academy of Neurology (AAN)',
    chunkText:
      'Acute neurological deficit presenting as sudden unilateral facial drooping, arm weakness or numbness, slurred speech or aphasia, loss of balance, or sudden loss of vision (BE-FAST criteria) indicates potential acute stroke. The therapeutic window for IV thrombolysis (tPA/TNK) is within 4.5 hours of symptom onset. Immediate emergency hospital transfer to a stroke center is required.',
    keywords: ['stroke', 'neurology', 'facial drooping', 'weakness', 'slurred speech', 'paralysis', 'numbness', 'headache'],
  },
  {
    id: 'kb-derm-004',
    title: 'AAD Clinical Guide: Acute Dermatitis vs Anaphylaxis & ABCDE Melanoma',
    category: 'dermatology',
    source: 'American Academy of Dermatology (AAD)',
    chunkText:
      'Skin rashes accompanied by lip, tongue, or facial swelling, difficulty breathing, or throat tightness are signs of severe systemic anaphylaxis requiring immediate intramuscular epinephrine and emergency care. For localized rashes with pruritus, erythema, and scaling, differential diagnoses include contact dermatitis, eczema, or urticaria, which should be evaluated non-emergently by a dermatologist.',
    keywords: ['dermatology', 'skin', 'rash', 'itching', 'swelling', 'anaphylaxis', 'allergy', 'eczema', 'dermatitis'],
  },
  {
    id: 'kb-gastro-005',
    title: 'ACG Clinical Guidelines: Acute Abdominal Pain & GI Bleeding',
    category: 'gastroenterology',
    source: 'American College of Gastroenterology (ACG)',
    chunkText:
      'Severe acute abdominal pain accompanied by peritoneal signs (board-like rigidity, rebound tenderness, high fever) or signs of gastrointestinal hemorrhage (hematemesis, coffee-ground emesis, melena, hematochezia) requires urgent surgical or emergency gastroenterology evaluation. Chronic acid reflux, dyspepsia, or altered bowel habits warrant outpatient gastroenterology consultation.',
    keywords: ['stomach', 'abdominal pain', 'gastroenterology', 'vomiting blood', 'melena', 'acid reflux', 'diarrhea'],
  },
  {
    id: 'kb-ortho-006',
    title: 'AAOS Clinical Practice: Acute Musculoskeletal Trauma & Joint Sprains',
    category: 'orthopedics',
    source: 'American Academy of Orthopaedic Surgeons (AAOS)',
    chunkText:
      'Inability to bear weight on a limb following acute trauma, visible bone deformity, severe localized joint effusion, or neurovascular compromise (absent distal pulses, cold extremity) indicates possible fracture or high-grade ligament tear requiring urgent orthopedic radiography. Subacute joint pain or stiffness without trauma is managed with RICE protocol and elective orthopedic evaluation.',
    keywords: ['orthopedics', 'joint pain', 'bone', 'fracture', 'knee', 'back pain', 'spine', 'sprain', 'ligament'],
  },
];

/**
 * Generate a deterministic dense semantic vector (128 dimensions) for text
 * when offline or fallback mode is active, capturing semantic keywords and n-grams.
 */
function generateDeterministicEmbedding(text) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  const vector = new Array(64).fill(0);

  words.forEach((word, wIdx) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % 64;
    vector[idx] += 1 / (1 + wIdx * 0.05);
  });

  // L2 Normalization
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((v) => v / magnitude);
}

/**
 * Calculate Cosine Similarity between two normalized vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

class VectorStoreService {
  constructor() {
    this.documents = [];
    this.initialized = false;
  }

  /**
   * Initialize Vector Store with pre-embedded clinical guidelines
   */
  async initialize() {
    if (this.initialized) return;

    for (const doc of INITIAL_KNOWLEDGE_BASE) {
      const embedding = await this.getEmbedding(`${doc.title} ${doc.chunkText} ${doc.keywords.join(' ')}`);
      this.documents.push({
        ...doc,
        embedding,
      });
    }

    this.initialized = true;
  }

  /**
   * Get vector embedding for a given text
   */
  async getEmbedding(text) {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        if (result && result.embedding && result.embedding.values) {
          const values = result.embedding.values;
          const mag = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
          return values.map((v) => v / mag);
        }
      } catch (err) {
        // Fall back to deterministic embedding
      }
    }
    return generateDeterministicEmbedding(text);
  }

  /**
   * Add a new document chunk to the vector store
   */
  async addDocument({ title, category, chunkText, source, keywords = [] }) {
    await this.initialize();
    const id = `kb-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const embedding = await this.getEmbedding(`${title} ${chunkText} ${keywords.join(' ')}`);

    const newDoc = {
      id,
      title,
      category,
      chunkText,
      source,
      keywords,
      embedding,
    };

    this.documents.push(newDoc);
    return newDoc;
  }

  /**
   * Perform vector similarity retrieval (Top-K)
   */
  async search(query, topK = 3, minSimilarity = 0.15) {
    await this.initialize();
    const queryEmbedding = await this.getEmbedding(query);
    const queryTokens = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const scored = this.documents.map((doc) => {
      let similarity = cosineSimilarity(queryEmbedding, doc.embedding);

      // Keyword boost
      const keywordMatches = doc.keywords.filter((kw) =>
        query.toLowerCase().includes(kw) || queryTokens.some((t) => kw.includes(t))
      );
      if (keywordMatches.length > 0) {
        similarity = Math.min(1.0, similarity + keywordMatches.length * 0.12);
      }

      return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        source: doc.source,
        chunkText: doc.chunkText,
        similarity: Number(similarity.toFixed(4)),
        matchedKeywords: keywordMatches,
      };
    });

    return scored
      .filter((doc) => doc.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Retrieve all indexed documents
   */
  async getAllDocuments() {
    await this.initialize();
    return this.documents.map(({ embedding, ...rest }) => rest);
  }
}

// Singleton Vector Store Instance
const vectorStore = new VectorStoreService();

module.exports = {
  vectorStore,
  VectorStoreService,
  cosineSimilarity,
  generateDeterministicEmbedding,
};
