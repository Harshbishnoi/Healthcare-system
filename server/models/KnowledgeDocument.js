const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    chunkText: {
      type: String,
      required: true,
    },
    vectorEmbedding: {
      type: [Number],
      default: [],
    },
    source: {
      type: String,
      required: true,
    },
    keywords: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
