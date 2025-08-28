// File: controllers/auth.js
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'

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

export const signup = async (req, res, next) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { name, email, password, role, referralCode } = req.body

    // Check if all required fields are provided
    if (!name || !email || !password) {
      await session.abortTransaction()
      return next(createError(400, 'Please provide name, email and password'))
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      await session.abortTransaction()
      return next(createError(400, 'Please provide a valid email address'))
    }

    // Validate password strength
    if (password.length < 8) {
      await session.abortTransaction()
      return next(
        createError(400, 'Password must be at least 8 characters long')
      )
    }

    // Set default role to user if not provided
    const userRole = role || 'user'

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email }).session(session)
    if (existingUser) {
      await session.abortTransaction()
      return next(createError(400, 'User with this email already exists'))
    }

    let referrerUser = null

    // Handle referral code if provided
    if (referralCode && referralCode.trim()) {
      referrerUser = await User.findByReferralCode(
        referralCode.trim().toUpperCase()
      ).session(session)

      if (!referrerUser) {
        await session.abortTransaction()
        return next(createError(400, 'Invalid referral code'))
      }

      // Check if referrer is trying to refer themselves (edge case)
      if (referrerUser.email === email) {
        await session.abortTransaction()
        return next(createError(400, 'You cannot refer yourself'))
      }
    }

    // Create new user (password will be hashed by the pre-save middleware)
    const newUserData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
      referredBy: referrerUser ? referrerUser._id : null,
    }

    const [newUser] = await User.create([newUserData], { session })

    // If there's a referrer, add this user to their referrals and create notification
    if (referrerUser) {
      await referrerUser.addReferral(newUser._id)

      // Create notification for the referrer
      try {
        await Notification.createReferralNotification(referrerUser._id, newUser)
        console.log(`Created notification for referrer ${referrerUser.name}`)
      } catch (notificationError) {
        // Log error but don't fail the signup process
        console.error(
          'Failed to create referral notification:',
          notificationError
        )
      }

      console.log(`User ${referrerUser.name} referred ${newUser.name}`)
    }

    await session.commitTransaction()

    // Populate referral information for response
    const populatedUser = await User.findById(newUser._id)
      .populate('referredBy', 'name email referralCode')
      .select('-password')

    // Send token to the new user
    createSendToken(populatedUser, 201, res)
  } catch (err) {
    await session.abortTransaction()
    console.error('Error in signup:', err)

    if (err.code === 11000) {
      // Handle duplicate key errors
      const field = Object.keys(err.keyValue)[0]
      return next(createError(400, `${field} already exists`))
    }

    next(createError(500, 'An unexpected error occurred during signup'))
  } finally {
    session.endSession()
  }
}

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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
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
