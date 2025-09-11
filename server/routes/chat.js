// File: routes/chat.js
import express from 'express'
import {
  clearChat,
  createChat,
  deleteChat,
  getAllChats,
  getChat,
  getChatAnalytics,
  getChatCategories,
  getChatHistory,
  getUserChatStats,
  sendMessage,
  testChatConnection,
  updateChat,
} from '../controllers/chatController.js'
import {
  checkActiveUser,
  restrictTo,
  verifyToken,
} from '../middleware/authMiddleware.js'
import { validateMessageLength } from '../middleware/chatMiddleware.js'

const router = express.Router()

// Test route for chat service connection (admin only)
router.get(
  '/test-connection',
  verifyToken,
  restrictTo('admin'),
  testChatConnection
)

// Protected routes (require authentication)
router.use(verifyToken)
router.use(checkActiveUser)

// Main chat endpoints
router.post('/', createChat) // Create new chat
router.get('/history', getChatHistory) // Get user's chat history
router.get('/stats', getUserChatStats) // Get user's chat statistics
router.get('/categories', getChatCategories) // Get chat categories with counts

// Specific chat operations
router.get('/:id', getChat) // Get specific chat conversation
router.patch('/:id', updateChat) // Update chat settings
router.delete('/:id', deleteChat) // Delete chat conversation
router.post('/:id/message', validateMessageLength, sendMessage) // Send message to chat
router.post('/:id/clear', clearChat) // Clear chat messages

// Admin only routes
router.use(restrictTo('admin'))

// Admin analytics and management
router.get('/admin/analytics', getChatAnalytics) // Get chat analytics
router.get('/admin/all', getAllChats) // Get all chat conversations

export default router
