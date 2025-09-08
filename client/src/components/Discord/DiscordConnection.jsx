// File: src/components/DiscordConnection.jsx
import React, { useEffect, useState } from 'react'
import axiosInstance from '../config/config.js'
import './DiscordConnection.css' // Add CSS file for styling

const DiscordConnection = () => {
  const [discordStatus, setDiscordStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Fetch Discord connection status
  const fetchDiscordStatus = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/auth/discord/status')
      setDiscordStatus(response.data.data.discord)
    } catch (error) {
      console.error('Error fetching Discord status:', error)
      if (error.response?.status === 401) {
        console.log('User not authenticated')
      }
    } finally {
      setLoading(false)
    }
  }

  // Connect Discord account
  const connectDiscord = async () => {
    try {
      setProcessing(true)
      // Get OAuth URL from backend
      const response = await axiosInstance.get('/auth/discord/connect')

      // Redirect to Discord OAuth
      window.location.href = response.data.data.authUrl
    } catch (error) {
      console.error('Error starting Discord connection:', error)
      alert('Failed to start Discord connection. Please try again.')
      setProcessing(false)
    }
  }

  // Disconnect Discord account
  const disconnectDiscord = async () => {
    if (
      !confirm(
        'Are you sure you want to disconnect your Discord account? You will lose any Discord-specific benefits.'
      )
    ) {
      return
    }

    try {
      setProcessing(true)
      await axiosInstance.delete('/auth/discord/disconnect')
      await fetchDiscordStatus()
      alert('Discord account disconnected successfully!')
    } catch (error) {
      console.error('Error disconnecting Discord:', error)
      alert('Failed to disconnect Discord account. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Get Discord server invite
  const getDiscordInvite = async () => {
    try {
      const response = await axiosInstance.get('/auth/discord/invite')
      window.open(response.data.data.inviteLink, '_blank')
    } catch (error) {
      console.error('Error getting Discord invite:', error)
      alert('Failed to get Discord server invite. Please try again.')
    }
  }

  useEffect(() => {
    fetchDiscordStatus()

    // Check URL params for Discord connection result
    const urlParams = new URLSearchParams(window.location.search)
    const discordParam = urlParams.get('discord')
    const reason = urlParams.get('reason')

    if (discordParam === 'linked') {
      alert('Discord account linked successfully! 🎉')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchDiscordStatus()
    } else if (discordParam === 'error') {
      let errorMessage = 'Failed to link Discord account'
      switch (reason) {
        case 'already_linked':
          errorMessage =
            'This Discord account is already linked to another user'
          break
        case 'user_not_found':
          errorMessage = 'User session expired. Please try again'
          break
        case 'expired_state':
          errorMessage = 'Connection expired. Please try again'
          break
        default:
          errorMessage = 'Failed to link Discord account. Please try again'
      }
      alert(errorMessage)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <div className='discord-connection loading'>
        <div className='loading-spinner'></div>
        <p>Loading Discord status...</p>
      </div>
    )
  }

  return (
    <div className='discord-connection'>
      <div className='discord-header'>
        <h3>
          <span className='discord-icon'>🎮</span>
          Discord Integration
        </h3>
        <p className='discord-subtitle'>
          Connect your Discord account to get exclusive roles and bonus points!
        </p>
      </div>

      {!discordStatus?.isConnected ? (
        <div className='not-connected'>
          <div className='benefits-list'>
            <h4>Benefits of connecting Discord:</h4>
            <ul>
              <li>🎯 Get exclusive server roles based on your subscription</li>
              <li>⭐ Earn +25 bonus points with daily claims</li>
              <li>💬 Access to exclusive Discord channels</li>
              <li>🚀 Early access to new features and updates</li>
              <li>👥 Connect with the community</li>
            </ul>
          </div>

          <button
            onClick={connectDiscord}
            disabled={processing}
            className='connect-btn'
          >
            {processing ? (
              <>
                <span className='spinner'></span>
                Connecting...
              </>
            ) : (
              <>
                <span className='discord-logo'>🎮</span>
                Connect Discord Account
              </>
            )}
          </button>

          <div className='help-text'>
            <p>
              Don't have Discord?{' '}
              <a
                href='https://discord.com'
                target='_blank'
                rel='noopener noreferrer'
              >
                Download it here
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div className='connected'>
          <div className='connection-success'>
            <span className='success-icon'>✅</span>
            <span>Discord Connected!</span>
          </div>

          <div className='discord-user-info'>
            <div className='user-details'>
              {discordStatus.avatar && discordStatus.username ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${discordStatus.discordId}/${discordStatus.avatar}.png?size=64`}
                  alt='Discord Avatar'
                  className='discord-avatar'
                  onError={(e) => {
                    e.target.src = `https://cdn.discordapp.com/embed/avatars/${
                      (discordStatus.discriminator || '0') % 5
                    }.png`
                  }}
                />
              ) : (
                <div className='default-avatar'>🎮</div>
              )}
              <div className='user-info'>
                <span className='username'>
                  {discordStatus.username}
                  {discordStatus.discriminator &&
                    `#${discordStatus.discriminator}`}
                </span>
                <span className='connected-date'>
                  Connected on{' '}
                  {new Date(discordStatus.connectedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className='role-status'>
            <h4>🏷️ Role Status</h4>
            <div className='role-info'>
              <div className='role-item'>
                <span className='label'>Expected Role:</span>
                <span className='value'>
                  {discordStatus.expectedRole
                    ? getRoleName(discordStatus.expectedRole)
                    : 'None'}
                </span>
              </div>

              {discordStatus.needsRoleUpdate && (
                <div className='warning'>
                  ⚠️ Your Discord roles need updating. Contact support if this
                  persists.
                </div>
              )}

              {discordStatus.lastRoleUpdate && (
                <div className='role-item'>
                  <span className='label'>Last Updated:</span>
                  <span className='value'>
                    {new Date(
                      discordStatus.lastRoleUpdate
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {discordStatus.isInServer === false && discordStatus.inviteLink && (
            <div className='invite-section'>
              <h4>📨 Join Our Discord Server</h4>
              <p>You need to join our Discord server to receive your roles:</p>
              <button onClick={getDiscordInvite} className='join-server-btn'>
                <span className='discord-logo'>🎮</span>
                Join Discord Server
              </button>
            </div>
          )}

          <div className='discord-actions'>
            <button
              onClick={disconnectDiscord}
              disabled={processing}
              className='disconnect-btn'
            >
              {processing ? (
                <>
                  <span className='spinner'></span>
                  Disconnecting...
                </>
              ) : (
                <>
                  <span>🔓</span>
                  Disconnect Discord
                </>
              )}
            </button>

            <button onClick={getDiscordInvite} className='server-btn'>
              <span>🌐</span>
              Visit Server
            </button>
          </div>
        </div>
      )}

      <div className='discord-footer'>
        <p>
          Having issues? Check our{' '}
          <a href='/help' target='_blank' rel='noopener noreferrer'>
            help documentation
          </a>{' '}
          or contact support.
        </p>
      </div>
    </div>
  )
}

// Helper function to get role display name
const getRoleName = (roleId) => {
  const roleNames = {
    [import.meta.env.VITE_DISCORD_ROLE_FREE]: '🆓 Free Citizens',
    [import.meta.env.VITE_DISCORD_ROLE_BASIC]: '⭐ Starter',
    [import.meta.env.VITE_DISCORD_ROLE_PREMIUM]: '💎 Pro',
    [import.meta.env.VITE_DISCORD_ROLE_ENTERPRISE]: '🏆 Empire',
  }

  return roleNames[roleId] || 'Unknown Role'
}

export default DiscordConnection
