// File: controllers/discordAuth.js - REST API Integration
import { createError } from '../error.js'
import User from '../models/User.js'
import discordService from '../services/discordService.js'

// Start Discord OAuth process
export const startDiscordAuth = async (req, res, next) => {
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

// Handle Discord OAuth callback
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

    // Exchange code for access token
    const redirectUri = `${
      process.env.BACKEND_URL || 'http://localhost:5000'
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

    // Try to add user to guild and assign roles
    try {
      // Add user to guild (if not already in it)
      await discordService.addUserToGuild(
        discordUser.id,
        tokenData.access_token
      )

      // Assign Discord role based on current subscription
      const roleResult = await discordService.updateUserRoles(
        discordUser.id,
        user.subscription?.plan || 'free',
        []
      )

      // Update user with current roles
      const currentRoles = await discordService.getUserRoles(discordUser.id)
      user.discord.currentRoles = currentRoles
      user.discord.lastRoleUpdate = new Date()
      await user.save()

      console.log(
        `Discord account linked and roles updated for user ${user.email}`
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

// Get Discord connection status
export const getDiscordStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const discordStatus = {
      isConnected: user.discord?.isConnected || false,
      username: user.discord?.username,
      discriminator: user.discord?.discriminator,
      avatar: user.discord?.avatar,
      connectedAt: user.discord?.connectedAt,
      currentRoles: user.discord?.currentRoles || [],
      lastRoleUpdate: user.discord?.lastRoleUpdate,
      expectedRole: user.getDiscordRole(),
      needsRoleUpdate: user.needsRoleUpdate(),
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

// Disconnect Discord account
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
      const roleMapping = {
        free: process.env.DISCORD_ROLE_FREE,
        basic: process.env.DISCORD_ROLE_BASIC,
        premium: process.env.DISCORD_ROLE_PREMIUM,
        enterprise: process.env.DISCORD_ROLE_ENTERPRISE,
      }

      for (const roleId of Object.values(roleMapping)) {
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

// Update Discord roles manually (admin function)
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

    const newPlan = plan || user.subscription?.plan || 'free'

    // Update Discord roles
    const roleResult = await discordService.updateUserRoles(
      user.discord.discordId,
      newPlan,
      user.discord.currentRoles || []
    )

    // Update user with new roles
    const currentRoles = await discordService.getUserRoles(
      user.discord.discordId
    )
    user.discord.currentRoles = currentRoles
    user.discord.lastRoleUpdate = new Date()
    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'Discord roles updated successfully',
      data: {
        user: user.name,
        plan: newPlan,
        roleResult,
        currentRoles,
      },
    })
  } catch (error) {
    console.error('Error updating Discord roles:', error)
    next(error)
  }
}

// Sync all Discord roles (admin function)
export const syncAllDiscordRoles = async (req, res, next) => {
  try {
    const usersWithDiscord = await User.find({
      'discord.isConnected': true,
      'discord.discordId': { $exists: true, $ne: null },
    })

    const results = []

    for (const user of usersWithDiscord) {
      try {
        const expectedPlan = user.subscription?.plan || 'free'

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
          continue
        }

        // Update roles
        const roleResult = await discordService.updateUserRoles(
          user.discord.discordId,
          expectedPlan,
          user.discord.currentRoles || []
        )

        // Update user record
        const currentRoles = await discordService.getUserRoles(
          user.discord.discordId
        )
        user.discord.currentRoles = currentRoles
        user.discord.lastRoleUpdate = new Date()
        await user.save()

        results.push({
          userId: user._id,
          username: user.discord.username,
          status: 'updated',
          plan: expectedPlan,
          actions: roleResult.actions,
        })

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
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Synced roles for ${usersWithDiscord.length} users`,
      data: { results },
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
