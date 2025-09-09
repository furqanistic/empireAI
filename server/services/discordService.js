// File: services/discordService.js - COMPLETE DISCORD API SERVICE
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config({ quiet: true })
class DiscordService {
  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET
    this.botToken = process.env.DISCORD_BOT_TOKEN
    this.guildId = process.env.DISCORD_GUILD_ID

    // Role mappings
    // Role mappings
    // Role mappings
    this.roleMapping = {
      free: process.env.DISCORD_ROLE_FREE,
      starter: process.env.DISCORD_ROLE_STARTER, // ✅ Fixed
      pro: process.env.DISCORD_ROLE_PRO, // ✅ Fixed
      empire: process.env.DISCORD_ROLE_EMPIRE, // ✅ Fixed
    }

    // Discord API base URL
    this.baseURL = 'https://discord.com/api/v10'

    // Validate required environment variables
    this.validateConfig()
  }

  validateConfig() {
    const required = [
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
      'DISCORD_BOT_TOKEN',
      'DISCORD_GUILD_ID',
    ]

    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
      console.error('Missing Discord environment variables:', missing)
      throw new Error(`Missing Discord config: ${missing.join(', ')}`)
    }

    console.log('Discord service initialized successfully')
  }

  // Generate OAuth URL for Discord authentication
  getOAuthURL(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email guilds.join',
      state: state,
    })

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code, redirectUri) {
    try {
      const response = await axios.post(
        `${this.baseURL}/oauth2/token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          scope: 'identify email guilds.join',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error(
        'Error exchanging code for token:',
        error.response?.data || error.message
      )
      throw new Error('Failed to exchange authorization code')
    }
  }

  // Get Discord user information
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data
    } catch (error) {
      console.error(
        'Error getting user info:',
        error.response?.data || error.message
      )
      throw new Error('Failed to get Discord user information')
    }
  }

  // Add user to Discord guild
  async addUserToGuild(discordId, accessToken) {
    try {
      const response = await axios.put(
        `${this.baseURL}/guilds/${this.guildId}/members/${discordId}`,
        {
          access_token: accessToken,
        },
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log(`Successfully added user ${discordId} to guild`)
      return response.data
    } catch (error) {
      // If user is already in guild, that's not an error
      if (error.response?.status === 204) {
        console.log(`User ${discordId} is already in the guild`)
        return { status: 'already_member' }
      }

      console.error(
        'Error adding user to guild:',
        error.response?.data || error.message
      )
      throw new Error('Failed to add user to Discord server')
    }
  }

  // Update user roles based on subscription plan
  async updateUserRoles(discordId, plan, currentRoles = []) {
    try {
      const targetRole = this.roleMapping[plan.toLowerCase()]

      if (!targetRole) {
        console.warn(`No role mapping found for plan: ${plan}`)
        return { actions: [], message: 'No role mapping found' }
      }

      const actions = []

      // Remove old subscription roles (except the target role)
      const subscriptionRoles = Object.values(this.roleMapping).filter(Boolean)
      const rolesToRemove = currentRoles.filter(
        (role) => subscriptionRoles.includes(role) && role !== targetRole
      )

      for (const roleId of rolesToRemove) {
        try {
          await this.removeRoleFromMember(discordId, roleId)
          actions.push({ action: 'removed', roleId })
          console.log(`Removed role ${roleId} from user ${discordId}`)
        } catch (error) {
          console.error(`Failed to remove role ${roleId}:`, error.message)
          actions.push({
            action: 'remove_failed',
            roleId,
            error: error.message,
          })
        }
      }

      // Add the target role if not already present
      if (!currentRoles.includes(targetRole)) {
        try {
          await this.addRoleToMember(discordId, targetRole)
          actions.push({ action: 'added', roleId: targetRole })
          console.log(`Added role ${targetRole} to user ${discordId}`)
        } catch (error) {
          console.error(`Failed to add role ${targetRole}:`, error.message)
          actions.push({
            action: 'add_failed',
            roleId: targetRole,
            error: error.message,
          })
        }
      } else {
        actions.push({ action: 'already_has', roleId: targetRole })
      }

      return {
        actions,
        targetRole,
        plan,
      }
    } catch (error) {
      console.error('Error updating user roles:', error)
      throw new Error('Failed to update Discord roles')
    }
  }

  // Add role to member
  async addRoleToMember(discordId, roleId) {
    this.validateConfig()

    try {
      await axios.put(
        `${this.baseURL}/guilds/${this.guildId}/members/${discordId}/roles/${roleId}`,
        {},
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            'X-Audit-Log-Reason': 'Subscription role assignment',
          },
        }
      )
    } catch (error) {
      console.error(
        `Error adding role ${roleId} to ${discordId}:`,
        error.response?.data || error.message
      )
      throw new Error(
        `Failed to add role: ${error.response?.data?.message || error.message}`
      )
    }
  }

  // Remove role from member
  async removeRoleFromMember(discordId, roleId) {
    this.validateConfig()

    try {
      await axios.delete(
        `${this.baseURL}/guilds/${this.guildId}/members/${discordId}/roles/${roleId}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            'X-Audit-Log-Reason': 'Subscription role removal',
          },
        }
      )
    } catch (error) {
      console.error(
        `Error removing role ${roleId} from ${discordId}:`,
        error.response?.data || error.message
      )
      throw new Error(
        `Failed to remove role: ${
          error.response?.data?.message || error.message
        }`
      )
    }
  }

  // Get user's current roles in the guild
  async getUserRoles(discordId) {
    this.validateConfig()

    try {
      const response = await axios.get(
        `${this.baseURL}/guilds/${this.guildId}/members/${discordId}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )

      return response.data.roles || []
    } catch (error) {
      console.error(
        `Error getting roles for user ${discordId}:`,
        error.response?.data || error.message
      )
      throw new Error('Failed to get user roles')
    }
  }

  // Check if user is in the Discord server
  async isUserInServer(discordId) {
    this.validateConfig()

    try {
      await axios.get(
        `${this.baseURL}/guilds/${this.guildId}/members/${discordId}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )
      return true
    } catch (error) {
      if (error.response?.status === 404) {
        return false
      }
      console.error(
        `Error checking server membership for ${discordId}:`,
        error.response?.data || error.message
      )
      return false
    }
  }

  // Get Discord server invite link
  async getInviteLink() {
    try {
      // Try to get existing invite first
      const existingInvites = await axios.get(
        `${this.baseURL}/guilds/${this.guildId}/invites`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )

      // Find a permanent invite
      const permanentInvite = existingInvites.data.find(
        (invite) => invite.max_age === 0 && !invite.temporary
      )

      if (permanentInvite) {
        return `https://discord.gg/${permanentInvite.code}`
      }

      // Create new invite if no permanent one exists
      const newInvite = await this.createInvite()
      return `https://discord.gg/${newInvite.code}`
    } catch (error) {
      console.error(
        'Error getting invite link:',
        error.response?.data || error.message
      )
      // Return a fallback invite if available
      return process.env.DISCORD_FALLBACK_INVITE || null
    }
  }

  // Create a new Discord invite
  async createInvite() {
    try {
      // Get the first text channel to create invite from
      const channels = await axios.get(
        `${this.baseURL}/guilds/${this.guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )

      const textChannel = channels.data.find((channel) => channel.type === 0) // TEXT channel

      if (!textChannel) {
        throw new Error('No text channels found to create invite')
      }

      const response = await axios.post(
        `${this.baseURL}/channels/${textChannel.id}/invites`,
        {
          max_age: 0, // Never expires
          max_uses: 0, // Unlimited uses
          temporary: false,
          unique: false,
        },
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error(
        'Error creating invite:',
        error.response?.data || error.message
      )
      throw new Error('Failed to create Discord invite')
    }
  }

  // Get guild information
  async getGuildInfo() {
    try {
      const response = await axios.get(
        `${this.baseURL}/guilds/${this.guildId}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )

      return response.data
    } catch (error) {
      console.error(
        'Error getting guild info:',
        error.response?.data || error.message
      )
      throw new Error('Failed to get Discord server information')
    }
  }

  // Get all guild members (for admin purposes)
  async getGuildMembers(limit = 1000) {
    try {
      const response = await axios.get(
        `${this.baseURL}/guilds/${this.guildId}/members?limit=${limit}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )

      return response.data
    } catch (error) {
      console.error(
        'Error getting guild members:',
        error.response?.data || error.message
      )
      throw new Error('Failed to get Discord server members')
    }
  }

  // Utility function to add delay (for rate limiting)
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Rate limiting helper
  async withRateLimit(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (error.response?.status === 429 && i < retries - 1) {
          const retryAfter = error.response.headers['retry-after'] || 1
          console.log(
            `Rate limited, waiting ${retryAfter}s before retry ${i + 1}`
          )
          await this.delay(retryAfter * 1000)
          continue
        }
        throw error
      }
    }
  }

  // Test bot permissions
  async testBotPermissions() {
    try {
      const botUser = await axios.get(`${this.baseURL}/users/@me`, {
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      })

      const guildMember = await axios.get(
        `${this.baseURL}/guilds/${this.guildId}/members/${botUser.data.id}`,
        {
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      )

      console.log('Bot permissions test successful')
      return {
        bot: botUser.data,
        permissions: guildMember.data.permissions,
        roles: guildMember.data.roles,
      }
    } catch (error) {
      console.error(
        'Bot permissions test failed:',
        error.response?.data || error.message
      )
      throw new Error('Bot permission test failed')
    }
  }
}

// Export singleton instance
const discordService = new DiscordService()
export default discordService
