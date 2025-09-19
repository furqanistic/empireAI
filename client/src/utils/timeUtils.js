// File: client/src/utils/timeUtils.js
export const formatTimeAgo = (date) => {
  if (!date) return 'Unknown'

  const now = new Date()
  const createdAt = new Date(date)
  const diffMs = now - createdAt

  // If the date is in the future (shouldn't happen but handle it)
  if (diffMs < 0) return 'Just now'

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 10) return 'Just now'
  if (diffSeconds < 60)
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`
}

export const formatNotificationTime = (date) => {
  if (!date) return 'Unknown time'

  const createdAt = new Date(date)
  const now = new Date()
  const diffMs = now - createdAt
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  // If it's today, show time
  if (diffDays < 1) {
    return createdAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // If it's yesterday
  if (diffDays < 2) {
    return `Yesterday ${createdAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`
  }

  // If it's this week
  if (diffDays < 7) {
    return createdAt.toLocaleDateString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // If it's this year
  if (createdAt.getFullYear() === now.getFullYear()) {
    return createdAt.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Full date for older notifications
  return createdAt.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
