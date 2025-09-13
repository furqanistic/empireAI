// File: src/components/DiscordConnection.jsx - TAILWIND ONLY VERSION
import axiosInstance from '@/config/config'
import React, { useEffect, useState } from 'react'

const DiscordConnection = () => {
  const [discordStatus, setDiscordStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Fetch Discord connection status
  const fetchDiscordStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.get('/auth/discord/status')
      setDiscordStatus(response.data.data.discord)
    } catch (error) {
      console.error('Error fetching Discord status:', error)
      if (error.response?.status === 401) {
        setError('Please log in to view Discord status')
      } else {
        setError('Failed to load Discord status')
      }
    } finally {
      setLoading(false)
    }
  }

  // Connect Discord account
  const connectDiscord = async () => {
    try {
      setProcessing(true)
      setError(null)
      const response = await axiosInstance.get('/auth/discord/auth')
      window.location.href = response.data.data.authUrl
    } catch (error) {
      console.error('Error starting Discord connection:', error)
      setError('Failed to start Discord connection. Please try again.')
      setProcessing(false)
    }
  }

  // Disconnect Discord account
  const disconnectDiscord = async () => {
    if (
      !window.confirm(
        'Are you sure you want to disconnect your Discord account? You will lose Discord-specific benefits like bonus points and server roles.'
      )
    ) {
      return
    }

    try {
      setProcessing(true)
      setError(null)
      await axiosInstance.delete('/auth/discord/disconnect')
      await fetchDiscordStatus()
      setError(null)
      alert('Discord account disconnected successfully!')
    } catch (error) {
      console.error('Error disconnecting Discord:', error)
      setError('Failed to disconnect Discord account. Please try again.')
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
      setError('Failed to get Discord server invite. Please try again.')
    }
  }

  useEffect(() => {
    fetchDiscordStatus()

    // Check URL params for Discord connection result
    const urlParams = new URLSearchParams(window.location.search)
    const discordParam = urlParams.get('discord')
    const reason = urlParams.get('reason')

    if (discordParam === 'linked') {
      window.history.replaceState({}, document.title, window.location.pathname)
      alert('Discord account linked successfully! 🎉')
      fetchDiscordStatus()
    } else if (discordParam === 'error') {
      let errorMessage = 'Failed to link Discord account'
      switch (reason) {
        case 'already_linked':
          errorMessage =
            'This Discord account is already linked to another user'
          break
        case 'user_not_found':
          errorMessage = 'User session expired. Please log in and try again'
          break
        case 'expired_state':
          errorMessage = 'Connection expired. Please try again'
          break
        case 'server_error':
          errorMessage = 'Server error occurred. Please try again later'
          break
        default:
          errorMessage = 'Failed to link Discord account. Please try again'
      }
      setError(errorMessage)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <div className='bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] rounded-xl p-6 text-white relative overflow-hidden'>
        <div className='absolute inset-0 bg-white/5 backdrop-blur-sm'></div>
        <div className='relative z-10 flex flex-col items-center justify-center min-h-[120px]'>
          <div className='w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4'></div>
          <p className='text-white/90'>Loading Discord status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] rounded-xl p-6 text-white relative overflow-hidden'>
      {/* Background overlay */}
      <div className='absolute inset-0 bg-white/5 backdrop-blur-sm rounded-xl'></div>

      {/* Content */}
      <div className='relative z-10'>
        {/* Header */}
        <div className='text-center mb-6'>
          <h3 className='text-2xl font-bold mb-2 flex items-center justify-center gap-2'>
            <span className='text-2xl'>🎮</span>
            Discord Integration
          </h3>
          <p className='text-white/90'>
            Connect your Discord account to get exclusive roles and bonus
            points!
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500/40 rounded-lg p-3 mb-6 flex items-center gap-2'>
            <span className='text-red-300'>⚠️</span>
            <span className='text-red-100 flex-1'>{error}</span>
            <button
              onClick={() => setError(null)}
              className='text-red-300 hover:text-red-100 text-lg font-bold'
            >
              ×
            </button>
          </div>
        )}

        {!discordStatus?.isConnected ? (
          <div className='text-center'>
            {/* Benefits List */}
            <div className='mb-6 text-left'>
              <h4 className='text-lg font-semibold mb-3 text-center'>
                Benefits of connecting Discord:
              </h4>
              <ul className='space-y-2'>
                <li className='flex items-center gap-3'>
                  <span>🎯</span>
                  <span>
                    Get exclusive server roles based on your subscription
                  </span>
                </li>
                <li className='flex items-center gap-3'>
                  <span>⭐</span>
                  <span>Earn +25 bonus points with daily claims</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span>💬</span>
                  <span>Access to exclusive Discord channels</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span>🚀</span>
                  <span>Early access to new features and updates</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span>👥</span>
                  <span>Connect with the community</span>
                </li>
              </ul>
            </div>

            {/* Connect Button */}
            <button
              onClick={connectDiscord}
              disabled={processing}
              className='bg-white text-[#5865F2] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3 mx-auto mb-4 min-w-[220px]'
            >
              {processing ? (
                <>
                  <div className='w-5 h-5 border-2 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin'></div>
                  Connecting...
                </>
              ) : (
                <>
                  <span className='text-xl'>🎮</span>
                  Connect Discord Account
                </>
              )}
            </button>

            {/* Help Text */}
            <div className='text-white/80 text-sm'>
              <p>
                Don't have Discord?{' '}
                <a
                  href='https://discord.com'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-white underline hover:text-white/80'
                >
                  Download it here
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Connected Success */}
            <div className='flex items-center justify-center gap-2 text-lg font-semibold mb-4'>
              <span className='text-xl'>✅</span>
              <span>Discord Connected!</span>
            </div>

            {/* User Info */}
            <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
              <div className='flex items-center gap-3'>
                {discordStatus.avatar && discordStatus.username ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${discordStatus.discordId}/${discordStatus.avatar}.png?size=64`}
                    alt='Discord Avatar'
                    className='w-12 h-12 rounded-full border-2 border-white/20'
                    onError={(e) => {
                      e.target.src = `https://cdn.discordapp.com/embed/avatars/${
                        (discordStatus.discriminator || '0') % 5
                      }.png`
                    }}
                  />
                ) : (
                  <div className='w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl'>
                    🎮
                  </div>
                )}
                <div className='flex-1'>
                  <div className='font-semibold'>
                    {discordStatus.username}
                    {discordStatus.discriminator &&
                      `#${discordStatus.discriminator}`}
                  </div>
                  <div className='text-white/80 text-sm'>
                    Connected on{' '}
                    {new Date(discordStatus.connectedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Role Status */}
            <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
              <h4 className='flex items-center gap-2 font-semibold mb-3'>
                <span>🏷️</span>
                Role Status
              </h4>

              <div className='space-y-2'>
                {discordStatus.lastRoleUpdate && (
                  <div className='flex justify-between items-center'>
                    <span className='text-white/80'>Last Updated:</span>
                    <span className='font-semibold'>
                      {new Date(
                        discordStatus.lastRoleUpdate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {discordStatus.needsRoleUpdate && (
                <div className='mt-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-2 text-sm'>
                  ⚠️ Your Discord roles need updating. Contact support if this
                  persists.
                </div>
              )}
            </div>

            {/* Join Server Section */}
            {discordStatus.isInServer === false && discordStatus.inviteLink && (
              <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center'>
                <h4 className='flex items-center justify-center gap-2 font-semibold mb-2'>
                  <span>📨</span>
                  Join Our Discord Server
                </h4>
                <p className='text-white/80 mb-4'>
                  You need to join our Discord server to receive your roles:
                </p>
                <button
                  onClick={getDiscordInvite}
                  className='bg-[#00D4AA] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#00C29A] transition-all duration-300 flex items-center justify-center gap-2 mx-auto'
                >
                  <span>🎮</span>
                  Join Discord Server
                </button>
              </div>
            )}

            {/* Actions */}
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <button
                onClick={disconnectDiscord}
                disabled={processing}
                className='bg-red-500/20 border border-red-500/40 text-red-100 px-6 py-2 rounded-lg font-semibold hover:bg-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2'
              >
                {processing ? (
                  <>
                    <div className='w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin'></div>
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <span>🔓</span>
                    Disconnect Discord
                  </>
                )}
              </button>

              <button
                onClick={getDiscordInvite}
                className='bg-white/20 border border-white/30 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2'
              >
                <span>🌐</span>
                Visit Server
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className='text-center mt-6 text-white/80 text-sm'>
          <p>
            Having issues? Check our{' '}
            <a
              href='/help'
              target='_blank'
              rel='noopener noreferrer'
              className='text-white underline hover:text-white/80'
            >
              help documentation
            </a>{' '}
            or contact support.
          </p>
        </div>
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
