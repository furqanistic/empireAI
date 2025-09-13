// File: services/emailService.js - RESEND EMAIL SERVICE
import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
const createPasswordResetTemplate = (name, resetUrl, expiryMinutes = 10) => {
  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Ascend AI</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #D4AF37 0%, #F4E4B8 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #000;
              margin-bottom: 10px;
            }
            .header-subtitle {
              color: #333;
              font-size: 16px;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
            }
            .message {
              font-size: 16px;
              margin-bottom: 30px;
              color: #555;
              line-height: 1.6;
            }
            .reset-button {
              display: inline-block;
              background-color: #D4AF37;
              color: #000;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: background-color 0.3s ease;
            }
            .reset-button:hover {
              background-color: #B8941F;
            }
            .expiry-notice {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #856404;
            }
            .alternative-link {
              background-color: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
              border: 1px solid #e9ecef;
            }
            .alternative-link p {
              font-size: 14px;
              color: #6c757d;
              margin-bottom: 10px;
            }
            .link-text {
              word-break: break-all;
              background-color: #ffffff;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #dee2e6;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: #495057;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              font-size: 14px;
              color: #6c757d;
              margin-bottom: 10px;
            }
            .support-info {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
            }
            .warning {
              background-color: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #721c24;
            }
            @media only screen and (max-width: 600px) {
              .container {
                margin: 0 10px;
              }
              .header, .content, .footer {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ascend AI</div>
              <div class="header-subtitle">Password Reset Request</div>
            </div>
            
            <div class="content">
              <div class="greeting">Hi ${name},</div>
              
              <div class="message">
                We received a request to reset the password for your Ascend AI account. If you made this request, click the button below to reset your password.
              </div>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="reset-button">Reset Password</a>
              </div>
              
              <div class="expiry-notice">
                <strong>⏰ Time Limit:</strong> This reset link will expire in ${expiryMinutes} minutes for security reasons.
              </div>
              
              <div class="alternative-link">
                <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                <div class="link-text">${resetUrl}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure, and no changes have been made.
              </div>
              
              <div class="message" style="margin-top: 30px;">
                Need help? Our support team is here to assist you at any time.
              </div>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Ascend AI Team</p>
              
              <div class="support-info">
                <p>Questions? Contact us at <strong>support@ascend-ai.com</strong></p>
                <p>© 2024 Ascend AI. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

We received a request to reset the password for your Ascend AI account.

Reset your password: ${resetUrl}

This link will expire in ${expiryMinutes} minutes for security reasons.

If you didn't request this password reset, please ignore this email. Your account remains secure.

Best regards,
The Ascend AI Team

Questions? Contact us at support@ascend-ai.com
© 2024 Ascend AI. All rights reserved.
    `.trim(),
  }
}

const createPasswordResetSuccessTemplate = (name) => {
  return {
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful - Ascend AI</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #fff;
              margin-bottom: 10px;
            }
            .header-subtitle {
              color: #fff;
              font-size: 16px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
            }
            .message {
              font-size: 16px;
              margin-bottom: 30px;
              color: #555;
              line-height: 1.6;
            }
            .success-box {
              background-color: #d4edda;
              border: 1px solid #c3e6cb;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .success-box h3 {
              color: #155724;
              margin-bottom: 10px;
            }
            .success-box p {
              color: #155724;
              font-size: 14px;
            }
            .login-button {
              display: inline-block;
              background-color: #D4AF37;
              color: #000;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: background-color 0.3s ease;
            }
            .login-button:hover {
              background-color: #B8941F;
            }
            .security-tips {
              background-color: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
              text-align: left;
            }
            .security-tips h4 {
              color: #495057;
              margin-bottom: 15px;
            }
            .security-tips ul {
              color: #6c757d;
              font-size: 14px;
              padding-left: 20px;
            }
            .security-tips li {
              margin-bottom: 8px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer p {
              font-size: 14px;
              color: #6c757d;
              margin-bottom: 10px;
            }
            @media only screen and (max-width: 600px) {
              .container {
                margin: 0 10px;
              }
              .header, .content, .footer {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <div class="logo">Ascend AI</div>
              <div class="header-subtitle">Password Reset Successful</div>
            </div>
            
            <div class="content">
              <div class="greeting">Hi ${name},</div>
              
              <div class="success-box">
                <h3>Password Updated Successfully!</h3>
                <p>Your password has been changed and your account is secure.</p>
              </div>
              
              <div class="message">
                Your Ascend AI account password has been successfully updated. You can now sign in with your new password.
              </div>
              
              <a href="${
                process.env.FRONTEND_URL || 'http://localhost:5173'
              }/auth" class="login-button">Sign In Now</a>
              
              <div class="security-tips">
                <h4>🔒 Security Tips:</h4>
                <ul>
                  <li>Keep your password private and don't share it with anyone</li>
                  <li>Use a unique password that you don't use elsewhere</li>
                  <li>Consider enabling two-factor authentication</li>
                  <li>Sign out of your account when using shared devices</li>
                </ul>
              </div>
              
              <div class="message">
                If you didn't change your password, please contact our support team immediately.
              </div>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Ascend AI Team</p>
              <p>Questions? Contact us at <strong>support@ascend-ai.com</strong></p>
              <p>© 2024 Ascend AI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${name},

Password Updated Successfully!

Your Ascend AI account password has been successfully updated. You can now sign in with your new password.

Sign in at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth

Security Tips:
- Keep your password private and don't share it with anyone
- Use a unique password that you don't use elsewhere
- Consider enabling two-factor authentication
- Sign out of your account when using shared devices

If you didn't change your password, please contact our support team immediately.

Best regards,
The Ascend AI Team

Questions? Contact us at support@ascend-ai.com
© 2024 Ascend AI. All rights reserved.
    `.trim(),
  }
}

// Main email sending functions
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${
      process.env.FRONTEND_URL || 'http://localhost:5173'
    }/reset-password/${resetToken}`

    const template = createPasswordResetTemplate(user.name, resetUrl, 10)

    const emailData = {
      from:
        process.env.RESEND_FROM_EMAIL || 'Ascend AI <noreply@ascend-ai.com>',
      to: user.email,
      subject: 'Reset Your Ascend AI Password',
      html: template.html,
      text: template.text,
    }

    console.log('Sending password reset email to:', user.email)
    const result = await resend.emails.send(emailData)

    console.log('Password reset email sent successfully:', result.id)
    return {
      success: true,
      messageId: result.id,
      resetUrl: resetUrl, // For development/testing purposes
    }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

export const sendPasswordResetSuccessEmail = async (user) => {
  try {
    const template = createPasswordResetSuccessTemplate(user.name)

    const emailData = {
      from:
        process.env.RESEND_FROM_EMAIL || 'Ascend AI <noreply@ascend-ai.com>',
      to: user.email,
      subject: 'Password Reset Successful - Ascend AI',
      html: template.html,
      text: template.text,
    }

    console.log('Sending password reset success email to:', user.email)
    const result = await resend.emails.send(emailData)

    console.log('Password reset success email sent successfully:', result.id)
    return {
      success: true,
      messageId: result.id,
    }
  } catch (error) {
    console.error('Error sending password reset success email:', error)
    // Don't throw error here as password was already reset successfully
    // Just log the error and continue
    return {
      success: false,
      error: error.message,
    }
  }
}

// Test email function for development
export const sendTestEmail = async (to = 'test@example.com') => {
  try {
    const result = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || 'Ascend AI <noreply@ascend-ai.com>',
      to: to,
      subject: 'Test Email - Resend Integration',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify Resend integration.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `
        Test Email
        
        This is a test email to verify Resend integration.
        Timestamp: ${new Date().toISOString()}
      `,
    })

    console.log('Test email sent successfully:', result.id)
    return result
  } catch (error) {
    console.error('Error sending test email:', error)
    throw error
  }
}

// Email validation helper
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Rate limiting helper for password reset emails
const resetEmailAttempts = new Map()

export const checkPasswordResetRateLimit = (email) => {
  const now = Date.now()
  const attempts = resetEmailAttempts.get(email) || []

  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(
    (timestamp) => now - timestamp < 60 * 60 * 1000
  )

  // Allow max 3 attempts per hour
  if (recentAttempts.length >= 3) {
    const oldestAttempt = Math.min(...recentAttempts)
    const timeUntilReset = Math.ceil(
      (oldestAttempt + 60 * 60 * 1000 - now) / (60 * 1000)
    )

    return {
      allowed: false,
      timeUntilReset: timeUntilReset,
      message: `Too many password reset attempts. Try again in ${timeUntilReset} minutes.`,
    }
  }

  // Add current attempt and update map
  recentAttempts.push(now)
  resetEmailAttempts.set(email, recentAttempts)

  return {
    allowed: true,
    remainingAttempts: 3 - recentAttempts.length,
  }
}

export default {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendTestEmail,
  isValidEmail,
  checkPasswordResetRateLimit,
}
