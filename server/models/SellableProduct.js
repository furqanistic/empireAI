import mongoose from 'mongoose'

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    path: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
)

const BlockItemSchema = new mongoose.Schema(
  {
    id: String,
    text: String,
    checked: { type: Boolean, default: false },
  },
  { _id: false }
)

const BlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['heading', 'text', 'list', 'image', 'quote', 'divider'],
      required: true,
    },
    text: { type: String, default: '' },
    html: { type: String, default: '' },
    level: { type: Number, default: 2 },
    align: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left',
    },
    style: { type: String, default: 'bullet' },
    items: [BlockItemSchema],
    imageUrl: { type: String, default: '' },
    imagePath: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false }
)

const SectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    content: { type: String, default: '', trim: true },
    items: [{ type: String, trim: true }],
  },
  { _id: false }
)

const SellableProductSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productType: {
      type: String,
      required: true,
      enum: ['ebook', 'guide', 'checklist', 'workbook'],
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    audience: {
      type: String,
      default: '',
      trim: true,
      maxlength: 160,
    },
    extraPrompt: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    content: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      description: { type: String, default: '' },
      suggestedPrice: { type: Number, default: 19 },
      features: [{ type: String }],
      tags: [{ type: String }],
      coverImage: MediaSchema,
      blocks: [BlockSchema],
      sections: [SectionSchema],
    },
    price: {
      type: Number,
      default: 19,
      min: 0,
      max: 99999,
    },
    revisionNotes: [
      {
        prompt: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    digitalProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalProduct',
    },
    salesUrl: { type: String, default: '' },
    affiliateUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'ready', 'published'],
      default: 'draft',
    },
  },
  { timestamps: true }
)

SellableProductSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('SellableProduct', SellableProductSchema)
