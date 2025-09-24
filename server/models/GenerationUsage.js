// File: server/models/GenerationUsage.js
import mongoose from 'mongoose'

const GenerationUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['viral-hooks', 'product-generator', 'niche-launchpad'],
      required: true,
    },
    month: {
      type: String, // Format: "2025-01"
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
GenerationUsageSchema.index({ user: 1, month: 1, type: 1 }, { unique: true })

export default mongoose.model('GenerationUsage', GenerationUsageSchema)
