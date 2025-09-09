// File: controllers/discordAuth.js - UPDATED WITH SUBSCRIPTION INTEGRATION
import { createError } from '../error.js'
import User from '../models/User.js'
import discordService from '../services/discordService.js'

// UPDATED: Consistent role mapping with subscription plans
const ROLE_MAPPING = {
  free: process.env.DISCORD_ROLE_FREE,
  starter: process.env.DISCORD_ROLE_STARTER,
  pro: process.env.DISCORD_ROLE_PRO,
  empire: process.env.DISCORD_ROLE_EMPIRE,
}

// Helper function to get expected role for a plan
const getExpectedRole = (plan) => {
  return ROLE_MAPPING[plan] || ROLE_MAPPING.free
}

// Helper function to update Discord roles based on subscription
const updateUserDiscordRoles = async (user) => {
  if (!user.discord?.isConnected || !user.discord?.discordId) {
    return { success: false, reason: 'Discord not connected' }
  }

  try {
    const currentPlan = user.subscription?.plan || 'free'
    const expectedRole = getExpectedRole(currentPlan)
    const currentRoles = user.discord.currentRoles || []

    // Get all subscription-related roles
    const allSubscriptionRoles = Object.values(ROLE_MAPPING).filter(Boolean)

    // Remove all subscription roles first
    const rolesToRemove = currentRoles.filter(
      (roleId) =>
        allSubscriptionRoles.includes(roleId) && roleId !== expectedRole
    )

    for (const roleId of rolesToRemove) {
      try {
        await discordService.removeRoleFromMember(
          user.discord.discordId,
          roleId
        )
      } catch (error) {
        console.error(`Failed to remove role ${roleId}:`, error.message)
      }
    }

    // Add the correct role if not already present
    if (expectedRole && !currentRoles.includes(expectedRole)) {
      try {
        await discordService.addRoleToMember(
          user.discord.discordId,
          expectedRole
        )
      } catch (error) {
        console.error(`Failed to add role ${expectedRole}:`, error.message)
        return { success: false, reason: error.message }
      }
    }

    // Update user's current roles in database
    try {
      const updatedRoles = await discordService.getUserRoles(
        user.discord.discordId
      )
      user.discord.currentRoles = updatedRoles
      user.discord.lastRoleUpdate = new Date()
      await user.save()
    } catch (error) {
      console.error('Failed to update user roles in database:', error)
    }

    return {
      success: true,
      plan: currentPlan,
      expectedRole,
      actions: {
        removed: rolesToRemove,
        added:
          expectedRole && !currentRoles.includes(expectedRole)
            ? [expectedRole]
            : [],
      },
    }
  } catch (error) {
    console.error('Error updating Discord roles:', error)
    return { success: false, reason: error.message }
  }
}

// Start Discord OAuth process
export const startDiscordAuth = async (req, res, next) => {
  console.log('object')
  try {
    if (!req.user || !req.user.id) {
      return next(
        createError(401, 'You must be logged in to link Discord account')
      )
    }

    // Generate state parameter to prevent CSRF
    const state = Buffer.from(
      JSON.stringify({
        userId: req.user.id,
        timestamp: Date.now(),
      })
    ).toString('base64')

    const redirectUri = `${
      process.env.BACKEND_URL || 'http://localhost:8800'
    }/api/auth/discord/callback`

    const authUrl = discordService.getOAuthURL(redirectUri, state)

    res.status(200).json({
      status: 'success',
      data: { authUrl },
    })
  } catch (error) {
    console.error('Error starting Discord auth:', error)
    next(error)
  }
}

// Handle Discord OAuth callback - UPDATED WITH SUBSCRIPTION ROLE SYNC
export const handleDiscordCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=${error}`
      )
    }

    if (!code || !state) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=missing_params`
      )
    }

    // Verify state parameter
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=invalid_state`
      )
    }

    // Check if state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=expired_state`
      )
    }

    const userId = stateData.userId

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=user_not_found`
      )
    }

    const redirectUri = `${
      process.env.BACKEND_URL || 'http://localhost:8800'
    }/api/auth/discord/callback`

    const tokenData = await discordService.exchangeCodeForToken(
      code,
      redirectUri
    )

    // Get Discord user info
    const discordUser = await discordService.getUserInfo(tokenData.access_token)

    // Check if Discord account is already linked to another user
    const existingDiscordUser = await User.findOne({
      'discord.discordId': discordUser.id,
      _id: { $ne: userId },
    })

    if (existingDiscordUser) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=already_linked`
      )
    }

    // Update user with Discord data
    user.discord = {
      ...user.discord,
      discordId: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
      email: discordUser.email,
      isConnected: true,
      connectedAt: new Date(),
      currentRoles: [],
    }

    await user.save()

    // Try to add user to guild and assign roles based on current subscription
    try {
      // Add user to guild (if not already in it)
      await discordService.addUserToGuild(
        discordUser.id,
        tokenData.access_token
      )

      // UPDATED: Assign Discord role based on current subscription using our helper
      const roleResult = await updateUserDiscordRoles(user)

      console.log(
        `Discord account linked for ${user.email}. Role update result:`,
        roleResult
      )
    } catch (roleError) {
      console.error('Error updating Discord roles after linking:', roleError)
      // Continue even if role assignment fails
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?discord=linked`)
  } catch (error) {
    console.error('Error handling Discord callback:', error)
    res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?discord=error&reason=server_error`
    )
  }
}

// Get Discord connection status - UPDATED WITH SUBSCRIPTION INFO
export const getDiscordStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const currentPlan = user.subscription?.plan || 'free'
    const expectedRole = getExpectedRole(currentPlan)

    const discordStatus = {
      isConnected: user.discord?.isConnected || false,
      username: user.discord?.username,
      discriminator: user.discord?.discriminator,
      avatar: user.discord?.avatar,
      connectedAt: user.discord?.connectedAt,
      currentRoles: user.discord?.currentRoles || [],
      lastRoleUpdate: user.discord?.lastRoleUpdate,
      expectedRole,
      currentPlan,
      needsRoleUpdate:
        expectedRole && !user.discord?.currentRoles?.includes(expectedRole),
    }

    // Check if user is actually in the Discord server
    if (discordStatus.isConnected && user.discord?.discordId) {
      try {
        const isInServer = await discordService.isUserInServer(
          user.discord.discordId
        )
        discordStatus.isInServer = isInServer

        if (!isInServer) {
          const inviteLink = await discordService.getInviteLink()
          discordStatus.inviteLink = inviteLink
        }
      } catch (error) {
        console.error('Error checking server membership:', error)
        discordStatus.isInServer = false
      }
    }

    res.status(200).json({
      status: 'success',
      data: { discord: discordStatus },
    })
  } catch (error) {
    console.error('Error getting Discord status:', error)
    next(error)
  }
}

// Disconnect Discord account - UPDATED ROLE MAPPING
export const disconnectDiscord = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!user.discord?.isConnected) {
      return next(createError(400, 'No Discord account is linked'))
    }

    const discordId = user.discord.discordId

    // Remove all subscription roles from Discord
    try {
      const allSubscriptionRoles = Object.values(ROLE_MAPPING).filter(Boolean)

      for (const roleId of allSubscriptionRoles) {
        if (roleId && user.discord.currentRoles?.includes(roleId)) {
          try {
            await discordService.removeRoleFromMember(discordId, roleId)
          } catch (error) {
            console.error(
              `Failed to remove role ${roleId} during disconnect:`,
              error.message
            )
          }
        }
      }
    } catch (error) {
      console.error('Error removing Discord roles during disconnect:', error)
      // Continue with disconnect even if role removal fails
    }

    // Clear Discord data from user
    user.discord = {
      discordId: null,
      username: null,
      discriminator: null,
      avatar: null,
      email: null,
      isConnected: false,
      connectedAt: null,
      lastRoleUpdate: null,
      currentRoles: [],
    }

    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Discord account disconnected successfully',
    })
  } catch (error) {
    console.error('Error disconnecting Discord:', error)
    next(error)
  }
}

// UPDATED: Manual role sync for single user
export const syncUserDiscordRoles = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!user.discord?.isConnected) {
      return next(createError(400, 'Discord account not connected'))
    }

    const result = await updateUserDiscordRoles(user)

    if (result.success) {
      res.status(200).json({
        status: 'success',
        message: 'Discord roles synced successfully',
        data: {
          plan: result.plan,
          actions: result.actions,
          currentRoles: user.discord.currentRoles,
        },
      })
    } else {
      next(createError(500, `Failed to sync Discord roles: ${result.reason}`))
    }
  } catch (error) {
    console.error('Error syncing user Discord roles:', error)
    next(error)
  }
}

// UPDATED: Admin function to update specific user's Discord roles
export const updateDiscordRoles = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { plan } = req.body

    const user = await User.findById(userId)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!user.discord?.isConnected || !user.discord?.discordId) {
      return next(
        createError(400, 'User does not have a linked Discord account')
      )
    }

    // If plan is provided, temporarily update user's subscription plan for role calculation
    if (plan && ['free', 'starter', 'pro', 'empire'].includes(plan)) {
      if (!user.subscription) {
        user.subscription = {}
      }
      user.subscription.plan = plan
      await user.save()
    }

    const result = await updateUserDiscordRoles(user)

    res.status(200).json({
      status: 'success',
      message: 'Discord roles updated successfully',
      data: {
        user: user.name,
        plan: user.subscription?.plan || 'free',
        success: result.success,
        actions: result.actions,
        currentRoles: user.discord.currentRoles,
      },
    })
  } catch (error) {
    console.error('Error updating Discord roles:', error)
    next(error)
  }
}

// UPDATED: Sync all Discord roles with subscription plans
export const syncAllDiscordRoles = async (req, res, next) => {
  try {
    const usersWithDiscord = await User.find({
      'discord.isConnected': true,
      'discord.discordId': { $exists: true, $ne: null },
    })

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const user of usersWithDiscord) {
      try {
        // Check if user is still in server
        const isInServer = await discordService.isUserInServer(
          user.discord.discordId
        )

        if (!isInServer) {
          results.push({
            userId: user._id,
            username: user.discord.username,
            status: 'not_in_server',
            message: 'User no longer in Discord server',
          })
          errorCount++
          continue
        }

        // Update roles based on current subscription
        const result = await updateUserDiscordRoles(user)

        if (result.success) {
          results.push({
            userId: user._id,
            username: user.discord.username,
            status: 'updated',
            plan: result.plan,
            actions: result.actions,
          })
          successCount++
        } else {
          results.push({
            userId: user._id,
            username: user.discord.username,
            status: 'error',
            error: result.reason,
          })
          errorCount++
        }

        // Add delay to avoid rate limiting
        await discordService.delay(1000)
      } catch (error) {
        console.error(`Error syncing roles for user ${user._id}:`, error)
        results.push({
          userId: user._id,
          username: user.discord?.username || 'Unknown',
          status: 'error',
          error: error.message,
        })
        errorCount++
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Discord role sync completed: ${successCount} successful, ${errorCount} errors`,
      data: {
        results,
        summary: {
          total: usersWithDiscord.length,
          successful: successCount,
          errors: errorCount,
        },
      },
    })
  } catch (error) {
    console.error('Error syncing all Discord roles:', error)
    next(error)
  }
}

// Get Discord server invite link
export const getDiscordInvite = async (req, res, next) => {
  try {
    const inviteLink = await discordService.getInviteLink()

    res.status(200).json({
      status: 'success',
      data: { inviteLink },
    })
  } catch (error) {
    console.error('Error getting Discord invite:', error)
    next(error)
  }
}

// EXPORT the helper function for use in subscription sync
export { updateUserDiscordRoles }
