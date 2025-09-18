// File: routes/discord.js - COMPLETE FIXED VERSION
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

// =============================================================================
// PUBLIC ROUTES - No authentication required
// =============================================================================

// Discord OAuth callback - must remain public for OAuth flow to work
router.get('/callback', handleDiscordCallback)

// =============================================================================
// PROTECTED ROUTES - Authentication required for all routes below
// =============================================================================
router.use(verifyToken)

// Discord authentication and connection management
router.get('/auth', startDiscordAuth) // Start Discord OAuth flow
router.post('/connect', startDiscordAuth) // Alternative connect endpoint
router.get('/status', getDiscordStatus) // Get Discord connection status
router.delete('/disconnect', disconnectDiscord) // FIXED: Changed from POST to DELETE
router.post('/sync-roles', syncUserDiscordRoles) // Sync user's Discord roles
router.get('/invite', getDiscordInvite) // Get Discord server invite

// =============================================================================
// ADMIN-ONLY ROUTES - Admin role required for all routes below
// =============================================================================
router.use(restrictTo('admin'))

// Admin Discord management
router.put('/roles/:userId', updateDiscordRoles) // Update specific user's Discord roles
router.post('/sync-all-roles', syncAllDiscordRoles) // Sync all users' Discord roles

export default router
