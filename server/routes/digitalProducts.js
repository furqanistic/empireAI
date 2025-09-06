// File: routes/digitalProducts.js
import express from 'express'
import {
  createDigitalProduct,
  deleteDigitalProduct,
  deleteProductFile,
  downloadProductFile,
  getAllDigitalProducts,
  getDigitalProduct,
  getPublicProduct,
  getUserDigitalProducts,
  toggleProductPublished,
  updateDigitalProduct,
  uploadProductFiles,
} from '../controllers/digitalProduct.js'
import {
  createProductCheckoutSession,
  downloadPurchasedFile,
  getProductAnalytics,
  getUserPurchases,
  verifyProductCheckoutSession,
} from '../controllers/digitalProductPayment.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import {
  addFileMetadata,
  cleanupOnError,
  uploadMultipleProductFiles,
  validateFileContent,
} from '../middleware/fileUpload.js'

const router = express.Router()

// Public routes (no authentication required)
// Get public product for checkout page
router.get('/public/:identifier', getPublicProduct)
router.get('/public/:slug', getPublicProduct)
router.get('/public/id/:id', getPublicProduct)

// Download purchased files (with token/email verification)
router.get('/download/:productSlug/:fileId', downloadPurchasedFile)

// Payment routes (no auth required for checkout)
router.post('/checkout/create-session', createProductCheckoutSession)
router.post('/checkout/verify-session', verifyProductCheckoutSession)

// Get user purchases (can work with or without auth)
router.get(
  '/purchases',
  (req, res, next) => {
    // If user is authenticated, use their info, otherwise require email in query
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      verifyToken(req, res, next)
    } else {
      next()
    }
  },
  getUserPurchases
)

// Protected routes (require authentication)
router.use(verifyToken)

// User product management routes
router.route('/').get(getUserDigitalProducts).post(createDigitalProduct)

router
  .route('/:id')
  .get(getDigitalProduct)
  .put(updateDigitalProduct)
  .delete(deleteDigitalProduct)

// Toggle published status
router.patch('/:id/toggle-published', toggleProductPublished)

// File management routes
router.post(
  '/:id/files',
  cleanupOnError,
  uploadMultipleProductFiles('files', 10),
  validateFileContent,
  addFileMetadata,
  uploadProductFiles
)

router.delete('/:id/files/:fileId', deleteProductFile)
router.get('/:id/files/:fileId/download', downloadProductFile)

// Analytics routes
router.get('/:id/analytics', getProductAnalytics)

// Admin only routes
router.use(restrictTo('admin'))
router.get('/admin/all', getAllDigitalProducts)

export default router
