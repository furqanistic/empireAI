// File: services/discordService.js - REST API Integration
import axios from 'axios'

class DiscordService {
  constructor() {
    this.baseURL = 'https://discord.com/api/v10'
    this.botToken = process.env.DISCORD_BOT_TOKEN
    this.guildId = process.env.DISCORD_GUILD_ID
    this.clientId = process.env.DISCORD_CLIENT_ID
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET

    // Configure axios defaults
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bot ${this.botToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  // Initialize service (just validate credentials)
  async initialize() {
    try {
      // Test bot token by getting bot user info
      const response = await this.api.get('/users/@me')
      console.log(
        `Discord REST API connected as ${response.data.username}#${response.data.discriminator}`
      )
      return true
    } catch (error) {
      console.error(
        'Failed to initialize Discord REST API:',
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Get guild member by Discord ID
  async getGuildMember(discordId) {
    try {
      const response = await this.api.get(
        `/guilds/${this.guildId}/members/${discordId}`
      )
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('User not found in Discord server')
      }
      throw error
    }
  }

  // Add role to member
  async addRoleToMember(discordId, roleId) {
    try {
      const member = await this.getGuildMember(discordId)

      if (!member) {
        throw new Error('Member not found in server')
      }

      // Check if member already has the role
      if (member.roles.includes(roleId)) {
        return { success: true, message: 'User already has this role' }
      }

      await this.api.put(
        `/guilds/${this.guildId}/members/${discordId}/roles/${roleId}`
      )

      console.log(`Added role ${roleId} to ${member.user.username}`)

      return {
        success: true,
        message: 'Role added successfully',
        roleId,
        userId: discordId,
      }
    } catch (error) {
      console.error('Error adding role:', error.response?.data || error.message)
      throw error
    }
  }

  // Remove role from member
  async removeRoleFromMember(discordId, roleId) {
    try {
      const member = await this.getGuildMember(discordId)

      if (!member) {
        throw new Error('Member not found in server')
      }

      // Check if member has the role
      if (!member.roles.includes(roleId)) {
        return { success: true, message: 'User does not have this role' }
      }

      await this.api.delete(
        `/guilds/${this.guildId}/members/${discordId}/roles/${roleId}`
      )

      console.log(`Removed role ${roleId} from ${member.user.username}`)

      return {
        success: true,
        message: 'Role removed successfully',
        roleId,
        userId: discordId,
      }
    } catch (error) {
      console.error(
        'Error removing role:',
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Update user roles based on subscription
  async updateUserRoles(discordId, newSubscriptionPlan, currentRoles = []) {
    try {
      const roleMapping = {
        free: process.env.DISCORD_ROLE_FREE, // 🆓 Free Citizens
        starter: process.env.DISCORD_ROLE_BASIC, // ⭐ Starter
        pro: process.env.DISCORD_ROLE_PREMIUM, // 💎 Pro
        empire: process.env.DISCORD_ROLE_ENTERPRISE, // 🏆 Empire
      }

      const newRoleId = roleMapping[newSubscriptionPlan]

      if (!newRoleId) {
        throw new Error(`Invalid subscription plan: ${newSubscriptionPlan}`)
      }

      const results = []

      // Remove old subscription roles
      for (const [plan, roleId] of Object.entries(roleMapping)) {
        if (roleId && roleId !== newRoleId && currentRoles.includes(roleId)) {
          try {
            const result = await this.removeRoleFromMember(discordId, roleId)
            results.push({ action: 'removed', plan, ...result })
          } catch (error) {
            console.error(`Failed to remove role ${roleId}:`, error.message)
          }
        }
      }

      // Add new role
      try {
        const result = await this.addRoleToMember(discordId, newRoleId)
        results.push({ action: 'added', plan: newSubscriptionPlan, ...result })
      } catch (error) {
        console.error(`Failed to add role ${newRoleId}:`, error.message)
        throw error
      }

      return {
        success: true,
        newRole: newRoleId,
        plan: newSubscriptionPlan,
        actions: results,
      }
    } catch (error) {
      console.error('Error updating user roles:', error)
      throw error
    }
  }

  // Get all roles for a user
  async getUserRoles(discordId) {
    try {
      const member = await this.getGuildMember(discordId)

      if (!member) {
        return []
      }

      return member.roles.filter((roleId) => roleId !== this.guildId) // Filter out @everyone role
    } catch (error) {
      console.error('Error getting user roles:', error)
      return []
    }
  }

  // Check if user is in server
  async isUserInServer(discordId) {
    try {
      const member = await this.getGuildMember(discordId)
      return !!member
    } catch (error) {
      return false
    }
  }

  // Get server invite link
  async getInviteLink() {
    try {
      // Get guild channels
      const channelsResponse = await this.api.get(
        `/guilds/${this.guildId}/channels`
      )
      const channels = channelsResponse.data

      // Find a text channel
      const textChannel = channels.find((channel) => channel.type === 0) // Text channel

      if (textChannel) {
        const inviteResponse = await this.api.post(
          `/channels/${textChannel.id}/invites`,
          {
            max_age: 0, // Never expires
            max_uses: 0, // Unlimited uses
            unique: true,
          }
        )
        return `https://discord.gg/${inviteResponse.data.code}`
      }

      throw new Error('No suitable channel found for invite')
    } catch (error) {
      console.error('Error creating invite:', error)
      throw error
    }
  }

  // Get OAuth2 authorization URL
  getOAuthURL(redirectUri, state = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email guilds.join',
    })

    if (state) {
      params.append('state', state)
    }

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`
  }

  // Exchange OAuth2 code for access token
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
      throw error
    }
  }

  // Get user info from access token
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
      throw error
    }
  }

  // Add user to guild (if they're not already in it)
  async addUserToGuild(discordId, accessToken) {
    try {
      // Check if user is already in guild
      const isInGuild = await this.isUserInServer(discordId)
      if (isInGuild) {
        return { success: true, message: 'User already in guild' }
      }

      await this.api.put(`/guilds/${this.guildId}/members/${discordId}`, {
        access_token: accessToken,
      })

      return { success: true, message: 'User added to guild' }
    } catch (error) {
      // If user is already in guild, that's fine
      if (error.response?.status === 204) {
        return { success: true, message: 'User already in guild' }
      }

      console.error(
        'Error adding user to guild:',
        error.response?.data || error.message
      )
      throw error
    }
  }

  // Rate limit helper
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Create singleton instance
const discordService = new DiscordService()

export default discordService
