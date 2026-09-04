import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  downloadSellablePdf,
  generateSellableProduct,
  getSellableProduct,
  getSellableProductPerformance,
  listSellableProducts,
  publishSellableProduct,
  reviseSellableProduct,
  saveSellableContent,
  updateSellablePrice,
  uploadSellableImage,
} from '../controllers/sellableProduct.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { createError } from '../error.js'
import {
  checkUsageLimit,
  logUsageAfterGeneration,
} from '../middleware/usageMiddleware.js'

const imageStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadPath = path.join(
      process.cwd(),
      'uploads',
      'products',
      req.user._id.toString()
    )
    fs.mkdirSync(uploadPath, { recursive: true })
    cb(null, uploadPath)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `img_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`)
  },
})

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Use a JPG, PNG, GIF, or WebP image'))
  },
})

const router = express.Router()

router.use(verifyToken)

router.get('/', listSellableProducts)
router.post(
  '/generate',
  checkUsageLimit('product-generator'),
  logUsageAfterGeneration('product-generator'),
  generateSellableProduct
)
router.get('/:id', getSellableProduct)
router.get('/:id/performance', getSellableProductPerformance)
router.post('/:id/revise', reviseSellableProduct)
router.put('/:id/content', saveSellableContent)
router.patch('/:id/price', updateSellablePrice)
router.post(
  '/:id/images',
  (req, res, next) => {
    uploadImage.single('image')(req, res, (error) => {
      if (error) return next(createError(400, error.message))
      next()
    })
  },
  uploadSellableImage
)
router.get('/:id/pdf', downloadSellablePdf)
router.post('/:id/publish', publishSellableProduct)

export default router
