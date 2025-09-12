// File: routes/chat.js
import express from 'express'
import {
  clearAllChats,
  createChat,
  deleteChat,
  getChat,
  getChatHistory,
  sendMessage,
  testConnection,
} from '../controllers/chatController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Test connection (public for testing)
router.get('/test', testConnection)

// All routes below require authentication
router.use(verifyToken)

// Chat routes
router.post('/create', createChat)
router.get('/history', getChatHistory)
router.get('/:chatId', getChat)
router.post('/:chatId/message', sendMessage)
router.delete('/:chatId', deleteChat)
router.delete('/clear/all', clearAllChats)

export default router
