// File: routes/discord.js - ADD THE MISSING CONNECT ROUTE
import express from 'express'
import {
  disconnectDiscord,
  getDiscordInvite,
  getDiscordStatus,
  handleDiscordCallback,
  startDiscordAuth,
  syncAllDiscordRoles,
  syncUserDiscordRoles,
  updateDiscordRoles,
} from '../controllers/discordAuth.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public Discord OAuth routes
router.get('/auth', verifyToken, startDiscordAuth)
router.post('/connect', verifyToken, startDiscordAuth) // ADD THIS LINE - Missing connect route
router.get('/callback', handleDiscordCallback)

// Protected routes (require authentication)
router.use(verifyToken)

// User Discord management routes
router.get('/status', getDiscordStatus)
router.post('/disconnect', disconnectDiscord)
router.post('/sync-roles', syncUserDiscordRoles)
router.get('/invite', getDiscordInvite)

// Admin only routes
router.use(restrictTo('admin'))
router.put('/roles/:userId', updateDiscordRoles)
router.post('/sync-all-roles', syncAllDiscordRoles)

export default router
