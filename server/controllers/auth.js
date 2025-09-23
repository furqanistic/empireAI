// File: controllers/auth.js - FIXED WITH EMAIL VERIFICATION + RATE LIMITING
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import {
  checkEmailRateLimit,
  checkPasswordResetRateLimit,
  isValidEmail,
  sendOTPVerificationSuccessEmail,
  sendPasswordResetOTP,
  sendPasswordResetSuccessEmail,
  sendSignupVerificationEmail,
  sendWelcomeEmail,
} from '../services/emailService.js'

const signToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment variables')
  }
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user._id)
    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) *
            24 *
            60 *
            60 *
            1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    }

    res.cookie('jwt', token, cookieOptions)

    // Remove password from output
    user.password = undefined

    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user,
      },
    })
  } catch (error) {
    console.error('Error in createSendToken:', error)
    throw error
  }
}

// NEW: Send verification OTP for existing users (who try to login but aren't verified)
export const sendExistingUserVerificationOTP = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(createError(400, 'Please provide email address'))
    }

    if (!isValidEmail(email)) {
      return next(createError(400, 'Please provide a valid email address'))
    }

    // Find existing user
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
      isDeleted: false,
    })

    if (!existingUser) {
      return next(createError(404, 'No account found with this email address'))
    }

    // If already verified, redirect to login
    if (existingUser.isEmailVerified) {
      return next(
        createError(400, 'Email is already verified. Please sign in.')
      )
    }

    // Check rate limiting (FIXED - checking BEFORE generating OTP)
    const rateLimitCheck = checkEmailRateLimit(
      email.toLowerCase().trim(),
      'existing_verification'
    )
    if (!rateLimitCheck.allowed) {
      return next(createError(429, rateLimitCheck.message))
    }

    // Generate OTP and store it temporarily
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

    // Store temp data with OTP for existing user verification
    global.existingUserOTPStore = global.existingUserOTPStore || new Map()
    global.existingUserOTPStore.set(email.toLowerCase().trim(), {
      userId: existingUser._id,
      email: existingUser.email,
      name: existingUser.name,
      otp: otpHash,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      timestamp: Date.now(),
    })

    try {
      // Send OTP email (RATE LIMITED - PREVENTS MULTIPLE EMAILS)
      await sendSignupVerificationEmail(
        {
          name: existingUser.name,
          email: existingUser.email,
        },
        otp
      )

      console.log(`Existing user verification OTP sent to ${email}`)

      // In development, also log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Existing user verification OTP (DEV ONLY):', otp)
      }

      res.status(200).json({
        status: 'success',
        message: 'Verification code sent to your email address.',
        data: {
          email: existingUser.email,
          name: existingUser.name,
        },
        // Include additional info in development
        ...(process.env.NODE_ENV === 'development' && {
          dev: {
            otp,
            expiresIn: '10 minutes',
          },
        }),
      })
    } catch (emailError) {
      // Clean up temp data if email fails
      global.existingUserOTPStore?.delete(email.toLowerCase().trim())

      console.error(
        'Failed to send existing user verification OTP:',
        emailError
      )
      return next(
        createError(
          500,
          'There was an error sending the verification email. Please try again.'
        )
      )
    }
  } catch (error) {
    console.error('Error in sendExistingUserVerificationOTP:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
}

// NEW: Verify existing user email
export const verifyExistingUserEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return next(createError(400, 'Please provide email and OTP'))
    }

    if (!isValidEmail(email)) {
      return next(createError(400, 'Please provide a valid email address'))
    }

    if (!/^\d{6}$/.test(otp)) {
      return next(createError(400, 'OTP must be a 6-digit number'))
    }

    // Get temp data from store
    const tempData = global.existingUserOTPStore?.get(
      email.toLowerCase().trim()
    )
    if (!tempData) {
      return next(
        createError(
          400,
          'No pending verification found. Please request a new verification code.'
        )
      )
    }

    // Check if OTP expired
    if (tempData.otpExpires <= Date.now()) {
      global.existingUserOTPStore?.delete(email.toLowerCase().trim())
      return next(
        createError(
          400,
          'OTP has expired. Please request a new verification code.'
        )
      )
    }

    // Check attempts limit
    if (tempData.attempts >= 5) {
      return next(
        createError(
          400,
          'Too many failed attempts. Please request a new verification code.'
        )
      )
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    if (tempData.otp !== otpHash) {
      // Increment attempts
      tempData.attempts += 1
      global.existingUserOTPStore?.set(email.toLowerCase().trim(), tempData)

      return next(
        createError(
          400,
          `Invalid OTP. ${5 - tempData.attempts} attempts remaining.`
        )
      )
    }

    // OTP is valid, update user's email verification status
    const user = await User.findById(tempData.userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Mark email as verified
    user.isEmailVerified = true
    user.emailVerifiedAt = new Date()
    await user.save({ validateBeforeSave: false })

    // Clean up temp data
    global.existingUserOTPStore?.delete(email.toLowerCase().trim())

    console.log(`Email verified for existing user: ${user.email}`)

    // Get updated user for response
    const updatedUser = await User.findById(user._id)
      .populate('referredBy', 'name email referralCode')
      .select('-password')

    // Sign in the user automatically after verification
    createSendToken(updatedUser, 200, res)
  } catch (error) {
    console.error('Error in verifyExistingUserEmail:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
}
export const sendSignupOTP = async (req, res, next) => {
  try {
    const { name, email, password, referralCode } = req.body

    console.log('=== SIGNUP OTP REQUEST ===')
    console.log('Request body:', {
      name,
      email,
      hasPassword: !!password,
      referralCode,
    })

    // Check if all required fields are provided
    if (!name || !email || !password) {
      return next(createError(400, 'Please provide name, email and password'))
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return next(createError(400, 'Please provide a valid email address'))
    }

    // Validate password strength
    if (password.length < 8) {
      return next(
        createError(400, 'Password must be at least 8 characters long')
      )
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    })

    if (existingUser) {
      return next(createError(400, 'User with this email already exists'))
    }

    // Check rate limiting for this email (FIXES MULTIPLE EMAIL ISSUE)
    const rateLimitCheck = checkEmailRateLimit(
      email.toLowerCase().trim(),
      'signup'
    )
    if (!rateLimitCheck.allowed) {
      return next(createError(429, rateLimitCheck.message))
    }

    // Validate referral code if provided
    let referrerUser = null
    let referredBy = null

    if (referralCode && referralCode.trim()) {
      console.log(
        'Processing referral code:',
        referralCode.trim().toUpperCase()
      )

      try {
        referrerUser = await User.findByReferralCode(
          referralCode.trim().toUpperCase()
        )

        console.log(
          'Referrer lookup result:',
          referrerUser
            ? {
                id: referrerUser._id.toString(),
                name: referrerUser.name,
                email: referrerUser.email,
                referralCode: referrerUser.referralCode,
              }
            : 'No referrer found'
        )

        if (!referrerUser) {
          return next(createError(400, 'Invalid referral code'))
        }

        // Check if referrer is trying to refer themselves
        if (referrerUser.email === email.toLowerCase().trim()) {
          return next(createError(400, 'You cannot refer yourself'))
        }

        // Set the referredBy field
        referredBy = referrerUser._id
        console.log(
          'Valid referrer found. Setting referredBy to:',
          referredBy.toString()
        )
      } catch (referralError) {
        console.error('Error validating referral code:', referralError)
        return next(createError(400, 'Error validating referral code'))
      }
    } else {
      console.log('No referral code provided')
    }

    // Create temporary user data (store in session/cache or database with pending status)
    const tempUserData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed when creating the actual user
      referredBy: referredBy, // Store the ObjectId directly
      referralCode: referralCode?.trim().toUpperCase() || null,
      timestamp: Date.now(),
    }

    console.log('Storing temp user data:', {
      name: tempUserData.name,
      email: tempUserData.email,
      referredBy: tempUserData.referredBy
        ? tempUserData.referredBy.toString()
        : null,
      referralCode: tempUserData.referralCode,
      timestamp: tempUserData.timestamp,
    })

    // Generate OTP and store it temporarily
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

    // Store temp data with OTP (in production, use Redis with expiry)
    global.signupOTPStore = global.signupOTPStore || new Map()
    global.signupOTPStore.set(email.toLowerCase().trim(), {
      ...tempUserData,
      otp: otpHash,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    })

    console.log(
      'Stored in OTP store. Current store size:',
      global.signupOTPStore.size
    )

    try {
      // Send OTP email (RATE LIMITED - PREVENTS MULTIPLE EMAILS)
      const emailResult = await sendSignupVerificationEmail(
        {
          name: tempUserData.name,
          email: tempUserData.email,
        },
        otp
      )

      console.log(`Signup OTP sent to ${email}:`, emailResult.id)

      // In development, also log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Signup OTP (DEV ONLY):', otp)
      }

      res.status(200).json({
        status: 'success',
        message:
          'Please check your email for a 6-digit verification code to complete your registration.',
        data: {
          email: tempUserData.email,
          name: tempUserData.name,
          hasReferral: !!referredBy,
          referrerName: referrerUser?.name || null,
        },
        // Include additional info in development
        ...(process.env.NODE_ENV === 'development' && {
          dev: {
            otp,
            expiresIn: '10 minutes',
            referredBy: referredBy ? referredBy.toString() : null,
          },
        }),
      })
    } catch (emailError) {
      // Clean up temp data if email fails
      global.signupOTPStore?.delete(email.toLowerCase().trim())

      console.error('Failed to send signup OTP:', emailError)
      return next(
        createError(
          500,
          'There was an error sending the verification email. Please try again.'
        )
      )
    }
  } catch (error) {
    console.error('Error in sendSignupOTP:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
}

export const verifySignupOTP = async (req, res, next) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { email, otp } = req.body

    console.log('=== OTP VERIFICATION REQUEST ===')
    console.log('Email:', email)
    console.log('OTP:', otp)

    if (!email || !otp) {
      await session.abortTransaction()
      return next(createError(400, 'Please provide email and OTP'))
    }

    if (!isValidEmail(email)) {
      await session.abortTransaction()
      return next(createError(400, 'Please provide a valid email address'))
    }

    if (!/^\d{6}$/.test(otp)) {
      await session.abortTransaction()
      return next(createError(400, 'OTP must be a 6-digit number'))
    }

    // Get temp data from store
    const tempData = global.signupOTPStore?.get(email.toLowerCase().trim())

    console.log(
      'Temp data found:',
      tempData
        ? {
            email: tempData.email,
            name: tempData.name,
            referredBy: tempData.referredBy
              ? tempData.referredBy.toString()
              : null,
            referralCode: tempData.referralCode,
            otpExpires: new Date(tempData.otpExpires),
            attempts: tempData.attempts,
          }
        : 'No temp data found'
    )

    if (!tempData) {
      await session.abortTransaction()
      return next(
        createError(
          400,
          'No pending registration found. Please start the signup process again.'
        )
      )
    }

    // Check if OTP expired
    if (tempData.otpExpires <= Date.now()) {
      global.signupOTPStore?.delete(email.toLowerCase().trim())
      await session.abortTransaction()
      return next(
        createError(
          400,
          'OTP has expired. Please start the signup process again.'
        )
      )
    }

    // Check attempts limit
    if (tempData.attempts >= 5) {
      await session.abortTransaction()
      return next(
        createError(
          400,
          'Too many failed attempts. Please start the signup process again.'
        )
      )
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
    if (tempData.otp !== otpHash) {
      // Increment attempts
      tempData.attempts += 1
      global.signupOTPStore?.set(email.toLowerCase().trim(), tempData)

      await session.abortTransaction()
      return next(
        createError(
          400,
          `Invalid OTP. ${5 - tempData.attempts} attempts remaining.`
        )
      )
    }

    console.log('OTP verified successfully!')

    // Get referrer info if there was one - FIXED: Don't query during transaction
    let referrerUser = null
    if (tempData.referredBy) {
      try {
        // Query referrer outside of transaction first for logging
        referrerUser = await User.findById(tempData.referredBy)
        console.log(
          'Referrer found:',
          referrerUser
            ? {
                id: referrerUser._id.toString(),
                name: referrerUser.name,
                email: referrerUser.email,
                referralCode: referrerUser.referralCode,
              }
            : 'Referrer not found'
        )
      } catch (referrerError) {
        console.error('Error fetching referrer:', referrerError)
        // Continue with signup even if referrer fetch fails
      }
    }

    // Create new user with EMAIL VERIFIED
    const newUserData = {
      name: tempData.name,
      email: tempData.email,
      password: tempData.password, // Will be hashed by pre-save middleware
      role: 'user',
      referredBy: tempData.referredBy, // FIX: Use tempData.referredBy directly
      points: 100, // Give new users starting points
      totalPointsEarned: 100,
      isEmailVerified: true, // MARK EMAIL AS VERIFIED
      emailVerifiedAt: new Date(), // SET VERIFICATION DATE
    }

    console.log('Creating user with data:', {
      name: newUserData.name,
      email: newUserData.email,
      referredBy: newUserData.referredBy
        ? newUserData.referredBy.toString()
        : null,
      points: newUserData.points,
      isEmailVerified: newUserData.isEmailVerified,
    })

    const [newUser] = await User.create([newUserData], { session })

    console.log('User created successfully:', {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      referredBy: newUser.referredBy ? newUser.referredBy.toString() : null,
    })

    // If there's a referrer, add this user to their referrals
    if (referrerUser && tempData.referredBy) {
      try {
        console.log('Processing referral relationship...')

        // Get referrer with session for update
        const referrerInSession = await User.findById(
          tempData.referredBy
        ).session(session)

        if (referrerInSession) {
          // Add the referral
          await referrerInSession.addReferral(newUser._id)
          console.log(
            `Added referral: ${newUser.name} referred by ${referrerInSession.name}`
          )

          // Create notification for the referrer
          await Notification.create(
            [
              {
                recipient: referrerInSession._id,
                title: 'New Referral!',
                message: `${newUser.name} just joined using your referral code!`,
                type: 'referral',
                data: {
                  referredUserId: newUser._id,
                  referredUserName: newUser.name,
                  referredUserEmail: newUser.email,
                  referralCode: tempData.referralCode,
                },
                priority: 'medium',
              },
            ],
            { session }
          )

          console.log(
            `Created referral notification for ${referrerInSession.name}`
          )
        } else {
          console.error('Referrer not found in session')
        }
      } catch (referralError) {
        console.error('Error processing referral:', referralError)
        // Don't fail the signup if referral processing fails, but log it
      }
    } else {
      console.log('No referrer to process')
    }

    // Clean up temp data
    global.signupOTPStore?.delete(email.toLowerCase().trim())
    console.log(
      'Cleaned up temp data. Store size now:',
      global.signupOTPStore?.size || 0
    )

    await session.commitTransaction()
    console.log('Transaction committed successfully')

    // Send welcome email (don't fail if this fails)
    try {
      await sendWelcomeEmail(newUser)
      console.log('Welcome email sent')
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    // Populate user data for response
    const populatedUser = await User.findById(newUser._id)
      .populate('referredBy', 'name email referralCode')
      .select('-password')

    console.log('Populated user for response:', {
      id: populatedUser._id.toString(),
      name: populatedUser.name,
      email: populatedUser.email,
      referredBy: populatedUser.referredBy
        ? {
            id: populatedUser.referredBy._id.toString(),
            name: populatedUser.referredBy.name,
            referralCode: populatedUser.referredBy.referralCode,
          }
        : null,
    })

    // Sign in the user automatically after successful verification
    createSendToken(populatedUser, 201, res)
  } catch (err) {
    await session.abortTransaction()
    console.error('Error in verifySignupOTP:', err)

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]
      return next(createError(400, `${field} already exists`))
    }

    next(createError(500, 'An unexpected error occurred during signup'))
  } finally {
    session.endSession()
  }
}

// LEGACY: Keep original signup for backward compatibility (REMOVED - NOT NEEDED)
// Removed the legacy signup function as requested

// UPDATED: Signin with email verification check
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(createError(400, 'Please provide email and password'))
    }

    // Find user and include password for comparison
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
      isDeleted: false,
    }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(createError(401, 'Incorrect email or password'))
    }

    // CHECK IF EMAIL IS VERIFIED
    if (!user.isEmailVerified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        data: {
          email: user.email,
          name: user.name,
          needsVerification: true,
        },
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    // Populate user data for response
    const populatedUser = await User.findById(user._id)
      .populate('referredBy', 'name email referralCode')
      .select('-password')

    createSendToken(populatedUser, 200, res)
  } catch (err) {
    console.error('Error in signin:', err)
    next(createError(500, 'An unexpected error occurred during login'))
  }
}

// Forgot Password - Send OTP email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(createError(400, 'Please provide your email address'))
    }

    if (!isValidEmail(email)) {
      return next(createError(400, 'Please provide a valid email address'))
    }

    // Check rate limiting for this email (FIXES MULTIPLE EMAIL ISSUE)
    const rateLimitCheck = checkPasswordResetRateLimit(
      email.toLowerCase().trim()
    )

    if (!rateLimitCheck.allowed) {
      return next(createError(429, rateLimitCheck.message))
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
      isDeleted: false,
    })

    // Always return success message for security (don't reveal if email exists)
    const successMessage =
      'If an account with that email exists, we have sent a 6-digit OTP to reset your password.'

    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: successMessage,
      })
    }

    // Generate OTP
    const otp = user.createPasswordResetOTP()

    // Save user with OTP (don't run validations)
    await user.save({ validateBeforeSave: false })

    try {
      // Send OTP email (RATE LIMITED - PREVENTS MULTIPLE EMAILS)
      const emailResult = await sendPasswordResetOTP(user, otp)

      console.log(`Password reset OTP sent to ${user.email}:`, emailResult.id)

      // In development, also log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Password reset OTP (DEV ONLY):', otp)
      }

      res.status(200).json({
        status: 'success',
        message: successMessage,
        // Include additional info in development
        ...(process.env.NODE_ENV === 'development' && {
          dev: {
            otp,
            expiresIn: '10 minutes',
            email: user.email,
          },
        }),
      })
    } catch (emailError) {
      // If email fails, clear the OTP
      user.passwordResetOTP = undefined
      user.passwordResetOTPExpires = undefined
      await user.save({ validateBeforeSave: false })

      console.error('Failed to send password reset OTP:', emailError)
      return next(
        createError(
          500,
          'There was an error sending the email. Please try again later.'
        )
      )
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
}

// Verify OTP for password reset
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return next(createError(400, 'Please provide email and OTP'))
    }

    if (!isValidEmail(email)) {
      return next(createError(400, 'Please provide a valid email address'))
    }

    if (!/^\d{6}$/.test(otp)) {
      return next(createError(400, 'OTP must be a 6-digit number'))
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
      isDeleted: false,
    }).select(
      '+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts +passwordResetLastAttempt'
    )

    if (!user) {
      return next(createError(400, 'Invalid request. Please try again.'))
    }

    // Check if user has an OTP set
    if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
      return next(
        createError(400, 'No OTP found. Please request a new password reset.')
      )
    }

    // Validate OTP
    const validation = user.validatePasswordResetOTP(otp)

    // Save the user to update attempt counts
    await user.save({ validateBeforeSave: false })

    if (!validation.isValid) {
      return next(createError(400, validation.error))
    }

    // OTP is valid - send success notification email
    try {
      await sendOTPVerificationSuccessEmail(user)
    } catch (emailError) {
      console.error(
        'Failed to send OTP verification success email:',
        emailError
      )
      // Continue with success response even if email fails
    }

    // Generate a temporary token for password reset (valid for 15 minutes)
    const resetToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        purpose: 'password_reset',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    console.log(`OTP verified successfully for user: ${user.email}`)

    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        resetToken, // This token will be used for password reset
        expiresIn: 15 * 60, // 15 minutes in seconds
      },
    })
  } catch (error) {
    console.error('Error in verifyOTP:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
}

// Reset Password - Now requires reset token from OTP verification
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, password, confirmPassword } = req.body

    if (!resetToken) {
      return next(createError(400, 'Reset token is required'))
    }

    if (!password || !confirmPassword) {
      return next(
        createError(400, 'Please provide password and confirm password')
      )
    }

    if (password !== confirmPassword) {
      return next(
        createError(400, 'Password and confirm password do not match')
      )
    }

    if (password.length < 8) {
      return next(
        createError(400, 'Password must be at least 8 characters long')
      )
    }

    // Verify the reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(
          createError(
            400,
            'Reset token has expired. Please verify your OTP again.'
          )
        )
      }
      return next(createError(400, 'Invalid reset token'))
    }

    // Check if token is for password reset
    if (decoded.purpose !== 'password_reset') {
      return next(createError(400, 'Invalid reset token purpose'))
    }

    // Find user
    const user = await User.findById(decoded.userId).select(
      '+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts +passwordResetLastAttempt'
    )

    if (!user) {
      return next(
        createError(
          400,
          'User not found. Please start the password reset process again.'
        )
      )
    }

    // Verify email matches
    if (user.email !== decoded.email) {
      return next(createError(400, 'Invalid reset token'))
    }

    // Check if user still has valid OTP (additional security)
    if (!user.passwordResetOTP || user.passwordResetOTPExpires <= Date.now()) {
      return next(
        createError(
          400,
          'Reset session has expired. Please start the password reset process again.'
        )
      )
    }

    // Update password (will be hashed by pre-save middleware)
    // The pre-save middleware will also clear the OTP fields
    user.password = password
    user.passwordChangedAt = new Date()

    await user.save()

    console.log(`Password reset successful for user: ${user.email}`)

    // Send success notification email (don't fail if this fails)
    try {
      await sendPasswordResetSuccessEmail(user)
    } catch (emailError) {
      console.error('Failed to send password reset success email:', emailError)
      // Continue with success response even if email fails
    }

    // Create notification with correct field names and enum value
    try {
      await Notification.create({
        recipient: user._id,
        title: 'Password Reset Successful',
        message:
          'Your password has been successfully updated using OTP verification.',
        type: 'security_alert',
        data: {
          action: 'password_reset_otp',
          timestamp: new Date(),
        },
        priority: 'high',
      })
    } catch (notificationError) {
      console.error(
        'Failed to create password reset notification:',
        notificationError
      )
    }

    // Get updated user for response
    const updatedUser = await User.findById(user._id)
      .populate('referredBy', 'name email referralCode')
      .select('-password')

    // Sign in the user with new password
    createSendToken(updatedUser, 200, res)
  } catch (error) {
    console.error('Error in resetPassword:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
}

// Claim daily points
export const claimDailyPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Check if user can claim points
    const claimCheck = user.canClaimDailyPoints()

    if (!claimCheck.canClaim) {
      return next(
        createError(
          400,
          `You can claim again in ${claimCheck.hoursUntilNext} hours`
        )
      )
    }

    // Claim the points
    const claimResult = await user.claimDailyPoints()

    // Create notification for successful claim
    try {
      await Notification.create({
        recipient: user._id,
        title: 'Daily Points Claimed!',
        message: `You've earned ${claimResult.pointsAwarded} points! Current streak: ${claimResult.streak} days`,
        type: 'points',
        data: {
          pointsAwarded: claimResult.pointsAwarded,
          streak: claimResult.streak,
          totalPoints: claimResult.totalPoints,
        },
        priority: 'medium',
      })
    } catch (notificationError) {
      console.error('Failed to create points notification:', notificationError)
    }

    res.status(200).json({
      status: 'success',
      message: 'Daily points claimed successfully!',
      data: {
        pointsAwarded: claimResult.pointsAwarded,
        totalPoints: claimResult.totalPoints,
        streak: claimResult.streak,
        nextClaimIn: claimResult.nextClaimIn,
      },
    })
  } catch (error) {
    console.error('Error in claimDailyPoints:', error)
    next(error)
  }
}

// Get user points status
export const getPointsStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const claimStatus = user.canClaimDailyPoints()

    res.status(200).json({
      status: 'success',
      data: {
        points: user.points,
        totalPointsEarned: user.totalPointsEarned,
        pointsSpent: user.pointsSpent,
        dailyClaimStreak: user.dailyClaimStreak,
        canClaimDaily: claimStatus.canClaim,
        hoursUntilNextClaim: claimStatus.hoursUntilNext,
        lastDailyClaim: user.lastDailyClaim,
      },
    })
  } catch (error) {
    console.error('Error in getPointsStatus:', error)
    next(error)
  }
}

// Get points leaderboard
export const getPointsLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const topEarners = await User.getTopPointEarners(limit)

    res.status(200).json({
      status: 'success',
      results: topEarners.length,
      data: {
        leaderboard: topEarners,
      },
    })
  } catch (error) {
    console.error('Error in getPointsLeaderboard:', error)
    next(error)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { role, name, email } = req.body
    const userId = req.params.id || req.user.id // Support both admin updates and self-updates

    // Find the user first
    const existingUser = await User.findById(userId)

    // If no user found with that ID
    if (!existingUser) {
      return next(createError(404, 'No user found with that ID'))
    }

    // Check if user is trying to update their own profile or is admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return next(createError(403, 'You can only update your own profile'))
    }

    // Validate role if being updated (only admins can change roles)
    if (role && req.user.role !== 'admin') {
      return next(createError(403, 'Only admins can change user roles'))
    }

    if (role && !['admin', 'user'].includes(role)) {
      return next(createError(400, 'Invalid role provided'))
    }

    // Validate email if being updated
    if (email) {
      if (!isValidEmail(email)) {
        return next(createError(400, 'Please provide a valid email address'))
      }

      // Check if email is already taken by another user
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId },
      })

      if (emailExists) {
        return next(createError(400, 'Email is already taken by another user'))
      }
    }

    // Prepare update data
    const updateData = {}
    if (role && req.user.role === 'admin') updateData.role = role
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.toLowerCase().trim()

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).populate('referredBy', 'name email referralCode')

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    })
  } catch (error) {
    console.error('Error in updateUser:', error)
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
      {
        new: true,
      }
    )

    if (!user) {
      return next(createError(404, 'No user found with that ID'))
    }

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (error) {
    console.error('Error in deleteUser:', error)
    next(error)
  }
}

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user.id // Support both getting other profiles and own profile

    // Check if user is trying to access their own profile or is admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return next(createError(403, 'You can only access your own profile'))
    }

    const user = await User.findById(userId)
      .populate('referredBy', 'name email referralCode')
      .populate('referrals.user', 'name email joinedAt')

    if (!user) {
      return next(createError(404, 'No user found with that ID'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    })
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    next(error)
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const users = await User.find({ isDeleted: false })
      .populate('referredBy', 'name email referralCode')
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalUsers = await User.countDocuments({ isDeleted: false })

    res.status(200).json({
      status: 'success',
      results: users.length,
      totalResults: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: {
        users,
      },
    })
  } catch (error) {
    console.error('Error in getAllUsers:', error)
    next(error)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(
        createError(
          400,
          'Please provide current password, new password, and confirm password'
        )
      )
    }

    if (newPassword !== confirmPassword) {
      return next(
        createError(400, 'New password and confirm password do not match')
      )
    }

    if (newPassword.length < 8) {
      return next(
        createError(400, 'New password must be at least 8 characters long')
      )
    }

    if (currentPassword === newPassword) {
      return next(
        createError(400, 'New password must be different from current password')
      )
    }

    const user = await User.findById(req.user.id).select('+password')

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(createError(401, 'Your current password is incorrect'))
    }

    // Set new password (will be hashed by pre-save middleware)
    user.password = newPassword
    await user.save()

    // Get updated user without password
    const updatedUser = await User.findById(user._id).populate(
      'referredBy',
      'name email referralCode'
    )

    createSendToken(updatedUser, 200, res)
  } catch (error) {
    console.error('Error in changePassword:', error)
    next(error)
  }
}

export const logout = async (req, res, next) => {
  try {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Error in logout:', error)
    next(error)
  }
}
