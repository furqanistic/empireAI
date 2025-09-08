// File: routes/discord.js - REST API Integration
import express from 'express'
import {
  disconnectDiscord,
  getDiscordInvite,
  getDiscordStatus,
  handleDiscordCallback,
  startDiscordAuth,
  syncAllDiscordRoles,
  updateDiscordRoles,
} from '../controllers/discordAuth.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public route for OAuth callback (no authentication required)
router.get('/callback', handleDiscordCallback)

// Protected routes (require authentication)
router.use(verifyToken)

// Discord OAuth routes
router.get('/connect', startDiscordAuth)

// Get Discord connection status
router.get('/status', getDiscordStatus)

// Disconnect Discord account
router.delete('/disconnect', disconnectDiscord)

// Get Discord server invite link
router.get('/invite', getDiscordInvite)

// Admin routes
router.use(restrictTo('admin'))

// Update Discord roles for specific user (admin only)
router.put('/roles/:userId', updateDiscordRoles)

// Sync all Discord roles (admin only)
router.post('/sync-all-roles', syncAllDiscordRoles)

export default router
