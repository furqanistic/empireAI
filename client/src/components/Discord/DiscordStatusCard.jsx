// File: src/components/DiscordStatusCard.jsx
import axiosInstance from '@/config/config'
import { ExternalLink, Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const DiscordStatusCard = ({ onExpand }) => {
  const [discordStatus, setDiscordStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDiscordStatus = async () => {
      try {
        const response = await axiosInstance.get('/auth/discord/status')
        setDiscordStatus(response.data.data.discord)
      } catch (error) {
        console.error('Error fetching Discord status:', error)
        setDiscordStatus(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDiscordStatus()
  }, [])

  if (loading) {
    return (
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center flex-shrink-0'>
            <span className='text-xl'>🎮</span>
          </div>
          <div>
            <h3 className='text-[#EDEDED] font-semibold text-lg'>Discord</h3>
            <p className='text-gray-400 text-sm'>Loading status...</p>
          </div>
        </div>
        <div className='flex items-center justify-center py-4'>
          <div className='w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center flex-shrink-0'>
            <span className='text-xl'>🎮</span>
          </div>
          <div>
            <h3 className='text-[#EDEDED] font-semibold text-lg'>Discord</h3>
            <p className='text-gray-400 text-sm'>Community integration</p>
          </div>
        </div>

        <div
          className={`w-3 h-3 rounded-full ${
            discordStatus?.isConnected ? 'bg-emerald-500' : 'bg-gray-500'
          }`}
        ></div>
      </div>

      {discordStatus?.isConnected ? (
        <div className='space-y-4'>
          {/* Connected User Info */}
          <div className='flex items-center gap-3'>
            {discordStatus.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${discordStatus.discordId}/${discordStatus.avatar}.png?size=32`}
                alt='Discord Avatar'
                className='w-8 h-8 rounded-full border border-[#1E1E21]'
                onError={(e) => {
                  e.target.src = `https://cdn.discordapp.com/embed/avatars/${
                    (discordStatus.discriminator || '0') % 5
                  }.png`
                }}
              />
            ) : (
              <div className='w-8 h-8 rounded-full bg-[#1A1A1C] flex items-center justify-center text-sm'>
                🎮
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <div className='text-[#EDEDED] font-medium text-sm truncate'>
                {discordStatus.username}
              </div>
              <div className='text-gray-400 text-xs'>
                {discordStatus.expectedRole ? (
                  <span className='text-[#D4AF37]'>Role assigned</span>
                ) : (
                  <span>No role</span>
                )}
              </div>
            </div>
          </div>

          {/* Benefits Status */}
          <div className='bg-[#1A1A1C] rounded-lg p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-[#EDEDED] text-sm font-medium'>
                Daily Bonus
              </span>
              <span className='text-[#D4AF37] text-sm font-semibold'>
                +25 pts
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-emerald-500'></div>
              <span className='text-gray-400 text-xs'>Active</span>
            </div>
          </div>

          {/* Warnings */}
          {(discordStatus.needsRoleUpdate ||
            discordStatus.isInServer === false) && (
            <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2'>
              <div className='flex items-center gap-2'>
                <span className='text-yellow-500 text-sm'>⚠️</span>
                <span className='text-yellow-200 text-xs'>
                  {discordStatus.isInServer === false
                    ? 'Join server for roles'
                    : 'Role update needed'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Not Connected State */}
          <div className='text-center py-2'>
            <div className='text-[#EDEDED] font-medium mb-2'>Not Connected</div>
            <p className='text-gray-400 text-sm leading-relaxed'>
              Connect Discord for exclusive roles and +25 daily point bonus!
            </p>
          </div>

          {/* Benefits Preview */}
          <div className='grid grid-cols-2 gap-2'>
            <div className='bg-[#1A1A1C] rounded-lg p-2 text-center'>
              <div className='text-[#D4AF37] text-sm font-semibold'>⭐</div>
              <div className='text-gray-400 text-xs'>Bonus Points</div>
            </div>
            <div className='bg-[#1A1A1C] rounded-lg p-2 text-center'>
              <div className='text-[#5865F2] text-sm font-semibold'>🎯</div>
              <div className='text-gray-400 text-xs'>Server Roles</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className='mt-4 pt-4 border-t border-[#1E1E21]'>
        <button
          onClick={onExpand}
          className='w-full h-9 bg-[#D4AF37] text-black rounded-xl font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2'
        >
          {discordStatus?.isConnected ? (
            <>
              <Settings size={14} />
              Manage Discord
            </>
          ) : (
            <>
              <span className='text-sm'>🎮</span>
              Connect Discord
            </>
          )}
        </button>
      </div>

      {/* Quick Discord Link */}
      {discordStatus?.isConnected && (
        <div className='mt-3'>
          <a
            href='https://discord.gg/zYurEefP'
            target='_blank'
            rel='noopener noreferrer'
            className='w-full h-8 bg-[#5865F2] text-white rounded-lg font-medium text-sm hover:bg-[#5865F2]/90 transition-all duration-300 flex items-center justify-center gap-2'
          >
            <span className='text-xs'>💬</span>
            <span>Open Server</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  )
}

export default DiscordStatusCard
