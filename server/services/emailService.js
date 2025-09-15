// File: services/emailService.js - FIXED RATE LIMITING + RESEND RESPONSE
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@updates.ascndlabs.com'

// Rate limiting store (use Redis in production)
const emailRateLimit = new Map()

// FIXED: Check email rate limiting (prevents multiple emails)
export const checkEmailRateLimit = (email, type = 'general') => {
  const key = `${email.toLowerCase().trim()}_${type}`
  const now = Date.now()
  const limit = emailRateLimit.get(key)

  if (limit && now - limit.lastSent < 60000) {
    // 1 minute cooldown
    const remainingTime = Math.ceil((60000 - (now - limit.lastSent)) / 1000)
    console.log(
      `Rate limit active for ${email} (${type}): ${remainingTime}s remaining`
    )
    return {
      allowed: false,
      message: `Please wait ${remainingTime} seconds before requesting another email`,
      remainingTime,
    }
  }

  return { allowed: true }
}

// FIXED: Update rate limit after sending email
const updateEmailRateLimit = (email, type = 'general') => {
  const key = `${email.toLowerCase().trim()}_${type}`
  const now = Date.now()
  emailRateLimit.set(key, {
    lastSent: now,
    count: (emailRateLimit.get(key)?.count || 0) + 1,
  })
  console.log(
    `Rate limit updated for ${email} (${type}) at ${new Date(
      now
    ).toISOString()}`
  )
}

// FIXED: Check password reset rate limiting (more restrictive)
export const checkPasswordResetRateLimit = (email) => {
  const key = `${email.toLowerCase().trim()}_reset`
  const now = Date.now()
  const limit = emailRateLimit.get(key)

  if (limit) {
    // Max 3 attempts per hour
    if (limit.count >= 3 && now - limit.firstAttempt < 3600000) {
      return {
        allowed: false,
        message:
          'Too many password reset attempts. Please try again in 1 hour.',
      }
    }

    // 2 minute cooldown between attempts for password reset
    if (now - limit.lastSent < 120000) {
      const remainingTime = Math.ceil((120000 - (now - limit.lastSent)) / 1000)
      return {
        allowed: false,
        message: `Please wait ${Math.ceil(
          remainingTime / 60
        )} minutes before requesting another password reset`,
      }
    }
  }

  return { allowed: true }
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// FIXED: Send signup verification email with proper rate limiting
export const sendSignupVerificationEmail = async (user, otp) => {
  const email = user.email.toLowerCase().trim()

  // STRICT rate limiting check
  const rateLimitCheck = checkEmailRateLimit(email, 'signup')
  if (!rateLimitCheck.allowed) {
    console.log(`Signup email blocked by rate limit for ${email}`)
    throw new Error(rateLimitCheck.message)
  }

  try {
    console.log(`Attempting to send signup verification email to ${email}`)

    const emailData = {
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify Your Email - Ascend AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #121214; border: 1px solid #1E1E21; border-radius: 12px; padding: 40px; text-align: center;">
              <div style="margin-bottom: 32px;">
                <h1 style="color: #D4AF37; font-size: 24px; margin: 0; font-weight: bold;">Ascend AI</h1>
              </div>
              
              <h2 style="color: #EDEDED; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Verify Your Email</h2>
              <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Hi ${user.name},<br><br>
                Welcome to Ascend AI! To complete your registration, please verify your email address using the code below:
              </p>
              
              <div style="background-color: #0B0B0C; border: 1px solid #1E1E21; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 8px 0;">Your verification code:</p>
                <div style="color: #D4AF37; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; margin: 8px 0;">
                  ${otp}
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0 0;">This code expires in 10 minutes</p>
              </div>
              
              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.5; margin: 32px 0 0 0;">
                If you didn't request this verification, please ignore this email.
              </p>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E21;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">
                  © 2024 Ascend AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await resend.emails.send(emailData)

    // FIXED: Handle Resend response properly
    const messageId = result?.data?.id || result?.id || 'unknown'

    // Update rate limit ONLY after successful send
    updateEmailRateLimit(email, 'signup')

    console.log(
      `Signup verification email sent successfully to ${email}, ID: ${messageId}`
    )
    return { id: messageId, success: true }
  } catch (error) {
    console.error('Failed to send signup verification email:', error)
    throw new Error('Failed to send verification email')
  }
}

// NEW: Send email verification for existing users
export const sendEmailVerificationOTP = async (user, otp) => {
  const email = user.email.toLowerCase().trim()

  // Rate limiting check for email verification
  const rateLimitCheck = checkEmailRateLimit(email, 'email_verification')
  if (!rateLimitCheck.allowed) {
    console.log(`Email verification blocked by rate limit for ${email}`)
    throw new Error(rateLimitCheck.message)
  }

  try {
    console.log(`Attempting to send email verification OTP to ${email}`)

    const emailData = {
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify Your Email Address - Ascend AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #121214; border: 1px solid #1E1E21; border-radius: 12px; padding: 40px; text-align: center;">
              <div style="margin-bottom: 32px;">
                <h1 style="color: #D4AF37; font-size: 24px; margin: 0; font-weight: bold;">Ascend AI</h1>
              </div>
              
              <h2 style="color: #EDEDED; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Verify Your Email Address</h2>
              <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Hi ${user.name},<br><br>
                To continue using your Ascend AI account, please verify your email address using the code below:
              </p>
              
              <div style="background-color: #0B0B0C; border: 1px solid #1E1E21; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 8px 0;">Your verification code:</p>
                <div style="color: #D4AF37; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; margin: 8px 0;">
                  ${otp}
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0 0;">This code expires in 10 minutes</p>
              </div>
              
              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.5; margin: 32px 0 0 0;">
                After verification, you'll be able to access your account normally.
              </p>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E21;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">
                  © 2024 Ascend AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await resend.emails.send(emailData)

    // Handle Resend response properly
    const messageId = result?.data?.id || result?.id || 'unknown'

    // Update rate limit ONLY after successful send
    updateEmailRateLimit(email, 'email_verification')

    console.log(
      `Email verification OTP sent successfully to ${email}, ID: ${messageId}`
    )
    return { id: messageId, success: true }
  } catch (error) {
    console.error('Failed to send email verification OTP:', error)
    throw new Error('Failed to send verification email')
  }
}

// FIXED: Send password reset OTP with proper rate limiting
export const sendPasswordResetOTP = async (user, otp) => {
  const email = user.email.toLowerCase().trim()

  // STRICT rate limiting check
  const rateLimitCheck = checkPasswordResetRateLimit(email)
  if (!rateLimitCheck.allowed) {
    console.log(`Password reset email blocked by rate limit for ${email}`)
    throw new Error(rateLimitCheck.message)
  }

  try {
    console.log(`Attempting to send password reset OTP to ${email}`)

    const emailData = {
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Reset Code - Ascend AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #121214; border: 1px solid #1E1E21; border-radius: 12px; padding: 40px; text-align: center;">
              <div style="margin-bottom: 32px;">
                <h1 style="color: #D4AF37; font-size: 24px; margin: 0; font-weight: bold;">Ascend AI</h1>
              </div>
              
              <h2 style="color: #EDEDED; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Password Reset</h2>
              <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Hi ${user.name},<br><br>
                We received a request to reset your password. Use the code below to continue:
              </p>
              
              <div style="background-color: #0B0B0C; border: 1px solid #1E1E21; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 8px 0;">Your reset code:</p>
                <div style="color: #D4AF37; font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 4px; margin: 8px 0;">
                  ${otp}
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0 0;">This code expires in 10 minutes</p>
              </div>
              
              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.5; margin: 32px 0 0 0;">
                If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E21;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">
                  © 2024 Ascend AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await resend.emails.send(emailData)

    // Handle Resend response properly
    const messageId = result?.data?.id || result?.id || 'unknown'

    // Update rate limit for password reset ONLY after successful send
    const key = `${email}_reset`
    const existing = emailRateLimit.get(key)
    emailRateLimit.set(key, {
      firstAttempt: existing?.firstAttempt || Date.now(),
      lastSent: Date.now(),
      count: (existing?.count || 0) + 1,
    })

    console.log(
      `Password reset email sent successfully to ${email}, ID: ${messageId}`
    )
    return { id: messageId, success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

// Send OTP verification success email
export const sendOTPVerificationSuccessEmail = async (user) => {
  try {
    const emailData = {
      from: FROM_EMAIL,
      to: user.email,
      subject: 'OTP Verified Successfully - Ascend AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verified</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #121214; border: 1px solid #1E1E21; border-radius: 12px; padding: 40px; text-align: center;">
              <div style="margin-bottom: 32px;">
                <h1 style="color: #D4AF37; font-size: 24px; margin: 0; font-weight: bold;">Ascend AI</h1>
              </div>
              
              <div style="width: 64px; height: 64px; background-color: #059669; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px;">✓</span>
              </div>
              
              <h2 style="color: #EDEDED; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">OTP Verified Successfully</h2>
              <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Hi ${user.name},<br><br>
                Your OTP has been verified successfully. You can now proceed to reset your password.
              </p>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E21;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">
                  © 2024 Ascend AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await resend.emails.send(emailData)
    console.log(`OTP verification success email sent to ${user.email}`)
    return result
  } catch (error) {
    console.error('Failed to send OTP verification success email:', error)
    // Don't throw error for notification emails
  }
}

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (user) => {
  try {
    const emailData = {
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Password Reset Successful - Ascend AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #121214; border: 1px solid #1E1E21; border-radius: 12px; padding: 40px; text-align: center;">
              <div style="margin-bottom: 32px;">
                <h1 style="color: #D4AF37; font-size: 24px; margin: 0; font-weight: bold;">Ascend AI</h1>
              </div>
              
              <div style="width: 64px; height: 64px; background-color: #059669; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px;">✓</span>
              </div>
              
              <h2 style="color: #EDEDED; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Password Reset Successful</h2>
              <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Hi ${user.name},<br><br>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              
              <a href="${
                process.env.FRONTEND_URL || 'http://localhost:5173'
              }/auth" 
                 style="display: inline-block; background-color: #D4AF37; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0;">
                Sign In Now
              </a>
              
              <p style="color: #9CA3AF; font-size: 14px; line-height: 1.5; margin: 32px 0 0 0;">
                If you didn't make this change, please contact our support team immediately.
              </p>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E21;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">
                  © 2024 Ascend AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await resend.emails.send(emailData)
    console.log(`Password reset success email sent to ${user.email}`)
    return result
  } catch (error) {
    console.error('Failed to send password reset success email:', error)
    // Don't throw error for notification emails
  }
}

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  try {
    const emailData = {
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to Ascend AI! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Ascend AI</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #121214; border: 1px solid #1E1E21; border-radius: 12px; padding: 40px; text-align: center;">
              <div style="margin-bottom: 32px;">
                <h1 style="color: #D4AF37; font-size: 24px; margin: 0; font-weight: bold;">Ascend AI</h1>
              </div>
              
              <h2 style="color: #EDEDED; font-size: 20px; margin: 0 0 16px 0; font-weight: 600;">Welcome to Ascend AI! 🚀</h2>
              <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0;">
                Hi ${user.name},<br><br>
                Welcome to Ascend AI! Your account has been successfully created and verified. 
                You've started with <strong style="color: #D4AF37;">100 points</strong> to get you going!
              </p>
              
              <div style="background-color: #0B0B0C; border: 1px solid #1E1E21; border-radius: 8px; padding: 24px; margin: 32px 0; text-align: left;">
                <h3 style="color: #EDEDED; font-size: 16px; margin: 0 0 16px 0;">Getting Started:</h3>
                <ul style="color: #9CA3AF; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Claim daily points to grow your balance</li>
                  <li>Refer friends to earn bonus points</li>
                  <li>Explore our AI tools and features</li>
                  <li>Upgrade to unlock premium features</li>
                </ul>
              </div>
              
              <a href="${
                process.env.FRONTEND_URL || 'http://localhost:5173'
              }/dashboard" 
                 style="display: inline-block; background-color: #D4AF37; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0;">
                Get Started
              </a>
              
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #1E1E21;">
                <p style="color: #6B7280; font-size: 12px; margin: 0;">
                  © 2024 Ascend AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await resend.emails.send(emailData)
    console.log(`Welcome email sent to ${user.email}`)
    return result
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    // Don't throw error for welcome emails
  }
}

// Clear rate limits (for admin use or testing)
export const clearEmailRateLimit = (email, type = null) => {
  const normalizedEmail = email.toLowerCase().trim()
  if (type) {
    emailRateLimit.delete(`${normalizedEmail}_${type}`)
  } else {
    // Clear all rate limits for this email
    const keysToDelete = []
    for (const key of emailRateLimit.keys()) {
      if (key.startsWith(`${normalizedEmail}_`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => emailRateLimit.delete(key))
  }
  console.log(`Cleared rate limits for ${normalizedEmail}`)
}

// Get rate limit status (for debugging)
export const getRateLimitStatus = (email, type = 'general') => {
  const key = `${email.toLowerCase().trim()}_${type}`
  const limit = emailRateLimit.get(key)

  if (!limit) {
    return { hasLimit: false, canSend: true }
  }

  const now = Date.now()
  const timeSinceLastSent = now - limit.lastSent
  const cooldownTime = type === 'reset' ? 120000 : 60000 // 2 min for reset, 1 min for others
  const canSend = timeSinceLastSent >= cooldownTime

  return {
    hasLimit: true,
    canSend,
    lastSent: new Date(limit.lastSent),
    timeSinceLastSent: Math.floor(timeSinceLastSent / 1000),
    remainingCooldown: canSend
      ? 0
      : Math.ceil((cooldownTime - timeSinceLastSent) / 1000),
    count: limit.count,
  }
}
