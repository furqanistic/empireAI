// File: server/models/GenerationUsage.js - UPDATED FOR BILLING CYCLES
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
    // NEW: Billing period key (replaces calendar month)
    // Format: "2025-01-15_to_2025-02-15" or "calendar_2025-01" for free users
    periodKey: {
      type: String,
      required: true,
      index: true,
    },
    // NEW: Track actual period dates for easy reference
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true,
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
    // LEGACY: Keep month field for backward compatibility during migration
    month: {
      type: String,
      sparse: true,
      // Format: "2025-01" (deprecated)
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries using new schema
generationUsageSchema.index(
  { user: 1, periodKey: 1, type: 1 },
  { unique: true }
)
generationUsageSchema.index({ user: 1, periodKey: 1 })
generationUsageSchema.index({ user: 1, periodStart: 1, periodEnd: 1 })
generationUsageSchema.index({ periodKey: 1 })
generationUsageSchema.index({ periodStart: 1, periodEnd: 1 })

// LEGACY index for backward compatibility
generationUsageSchema.index({ user: 1, month: 1, type: 1 }, { sparse: true })

// Update lastGenerated when count is incremented
generationUsageSchema.pre('findOneAndUpdate', function () {
  if (this.getUpdate().$inc && this.getUpdate().$inc.count) {
    this.set({ lastGenerated: new Date() })
  }
})

const GenerationUsage = mongoose.model('GenerationUsage', generationUsageSchema)

export default GenerationUsage
