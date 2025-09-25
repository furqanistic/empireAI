// File: server/models/GenerationUsage.js
import mongoose from 'mongoose'

const generationUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['viral-hooks', 'product-generator', 'niche-launchpad'],
    },
    month: {
      type: String,
      required: true,
      // Format: "2025-01" for January 2025
      match: /^\d{4}-\d{2}$/,
    },
    count: {
      type: Number,
      default: 1,
      min: 0,
    },
    lastGenerated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
generationUsageSchema.index({ user: 1, month: 1, type: 1 }, { unique: true })
generationUsageSchema.index({ user: 1, month: 1 })
generationUsageSchema.index({ month: 1 })

// Update lastGenerated when count is incremented
generationUsageSchema.pre('findOneAndUpdate', function () {
  if (this.getUpdate().$inc && this.getUpdate().$inc.count) {
    this.set({ lastGenerated: new Date() })
  }
})

const GenerationUsage = mongoose.model('GenerationUsage', generationUsageSchema)

export default GenerationUsage
