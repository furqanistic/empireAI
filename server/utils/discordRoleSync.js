// File: utils/discordRoleSync.js
import discordService from '../services/discordService.js'

// Function to sync Discord roles when subscription changes
export const syncDiscordRolesOnSubscriptionChange = async (userId, newPlan) => {
  try {
    const User = await import('../models/User.js').then((m) => m.default)
    const user = await User.findById(userId)

    if (!user) {
      console.error('User not found for Discord role sync:', userId)
      return { success: false, error: 'User not found' }
    }

    // Check if user has Discord linked
    if (!user.discord?.isConnected || !user.discord?.discordId) {
      console.log(
        `User ${user.email} doesn't have Discord linked, skipping role sync`
      )
      return { success: true, message: 'No Discord account linked' }
    }

    // Update subscription in database first
    user.subscription = {
      ...user.subscription,
      plan: newPlan,
      isActive: true,
      status: 'active',
    }

    // Update Discord roles
    const roleResult = await discordService.updateUserRoles(
      user.discord.discordId,
      newPlan,
      user.discord.currentRoles || []
    )

    // Update user's current roles in database
    const currentRoles = await discordService.getUserRoles(
      user.discord.discordId
    )
    user.discord.currentRoles = currentRoles
    user.discord.lastRoleUpdate = new Date()

    await user.save()

    console.log(`Discord roles updated for ${user.email}: ${newPlan}`)

    return {
      success: true,
      message: 'Discord roles updated successfully',
      plan: newPlan,
      roleResult,
    }
  } catch (error) {
    console.error('Error syncing Discord roles:', error)
    return { success: false, error: error.message }
  }
}

// Add this to your existing subscription/payment controllers:

// Example: In your Stripe webhook handler or subscription update function
export const handleSubscriptionUpdate = async (req, res) => {
  try {
    // Your existing subscription logic...
    const { userId, newPlan } = req.body

    // Update user subscription in database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'subscription.plan': newPlan,
        'subscription.status': 'active',
        'subscription.isActive': true,
      },
      { new: true }
    )

    // Sync Discord roles
    const discordSync = await syncDiscordRolesOnSubscriptionChange(
      userId,
      newPlan
    )

    if (!discordSync.success) {
      console.error('Discord role sync failed:', discordSync.error)
      // Don't fail the subscription update if Discord sync fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Subscription updated successfully',
      data: {
        user,
        discordSync,
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Add this to your points claim function to award bonus points for Discord connection
export const claimDailyPointsWithDiscordBonus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Claim regular daily points
    const claimResult = await user.claimDailyPoints()

    // Bonus points for Discord connection
    if (user.discord?.isConnected) {
      const discordBonus = 25 // Extra 25 points for Discord users
      user.points += discordBonus
      user.totalPointsEarned += discordBonus
      await user.save()

      claimResult.pointsAwarded += discordBonus
      claimResult.totalPoints = user.points
      claimResult.discordBonus = discordBonus
    }

    res.status(200).json({
      status: 'success',
      message: 'Daily points claimed successfully!',
      data: claimResult,
    })
  } catch (error) {
    console.error('Error in claimDailyPoints:', error)
    next(error)
  }
}

// Example: Stripe webhook for subscription events
export const stripeWebhook = async (req, res) => {
  try {
    // Your Stripe webhook verification...
    const event = req.body

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        const subscription = event.data.object
        const customerId = subscription.customer

        // Find user by Stripe customer ID
        const user = await User.findOne({ stripeCustomerId: customerId })
        if (!user) break

        // Determine plan from Stripe price ID
        const planMapping = {
          [process.env.STRIPE_BASIC_PRICE_ID]: 'basic',
          [process.env.STRIPE_PREMIUM_PRICE_ID]: 'premium',
          [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
        }

        const newPlan =
          planMapping[subscription.items.data[0].price.id] || 'free'

        // Sync Discord roles
        await syncDiscordRolesOnSubscriptionChange(user._id, newPlan)
        break

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object
        const deletedCustomerId = deletedSub.customer

        const deletedUser = await User.findOne({
          stripeCustomerId: deletedCustomerId,
        })
        if (deletedUser) {
          await syncDiscordRolesOnSubscriptionChange(deletedUser._id, 'free')
        }
        break
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    res.status(500).json({ error: 'Webhook error' })
  }
}
