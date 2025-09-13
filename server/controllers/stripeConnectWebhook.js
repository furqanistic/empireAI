// File: controllers/stripeConnectWebhook.js - FIXED VERSION
import { stripe } from '../config/stripe.js'
import Earnings from '../models/Earnings.js'
import Payout from '../models/Payout.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import { createRenewalEarning } from '../utils/earningsIntegration.js'

// Handle Stripe Connect webhooks - IMPROVED ERROR HANDLING
export const handleStripeConnectWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    )

    console.log(`✅ Webhook signature verified for event: ${event.type}`)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`📡 Processing Connect webhook event: ${event.type}`)

  try {
    // Handle the event with improved error handling
    switch (event.type) {
      // Account events
      case 'account.updated':
        await handleAccountUpdated(event.data.object)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object)
        break

      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object)
        break

      // Payout events
      case 'payout.created':
        await handlePayoutCreated(event.data.object)
        break

      case 'payout.updated':
        await handlePayoutUpdated(event.data.object)
        break

      case 'payout.paid':
        await handlePayoutPaid(event.data.object)
        break

      case 'payout.failed':
        await handlePayoutFailed(event.data.object)
        break

      case 'payout.canceled':
        await handlePayoutCanceled(event.data.object)
        break

      // Transfer events
      case 'transfer.created':
        await handleTransferCreated(event.data.object)
        break

      case 'transfer.updated':
        await handleTransferUpdated(event.data.object)
        break

      case 'transfer.paid':
        await handleTransferPaid(event.data.object)
        break

      case 'transfer.failed':
        await handleTransferFailed(event.data.object)
        break

      // Subscription events (for earnings creation)
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break

      // ADD MISSING EVENTS THAT MIGHT BE SELECTED IN YOUR WEBHOOK
      case 'account.external_account.created':
      case 'account.external_account.updated':
      case 'account.external_account.deleted':
        console.log(`📝 External account event: ${event.type}`)
        // Handle external account events if needed
        break

      case 'person.created':
      case 'person.updated':
        console.log(`👤 Person event: ${event.type}`)
        // Handle person events if needed
        break

      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        console.log(`💳 Payment intent event: ${event.type}`)
        // Handle payment intent events if needed
        break

      case 'charge.succeeded':
      case 'charge.failed':
        console.log(`⚡ Charge event: ${event.type}`)
        // Handle charge events if needed
        break

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
      // Still return success to avoid retries
    }

    // IMPORTANT: Always return 200 success response
    console.log(`✅ Successfully processed webhook: ${event.type}`)
    res.status(200).json({
      received: true,
      eventType: event.type,
      eventId: event.id,
    })
  } catch (error) {
    console.error(`❌ Error processing Connect webhook ${event.type}:`, error)

    // Log the full error for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      eventType: event.type,
      eventId: event.id,
    })

    // IMPORTANT: Return 200 even on processing errors to prevent Stripe retries
    // unless it's a critical error that should be retried
    if (
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    ) {
      return res.status(500).json({
        error: 'Temporary error, please retry',
        eventType: event.type,
      })
    }

    // For other errors, return success to prevent endless retries
    res.status(200).json({
      received: true,
      error: error.message,
      eventType: event.type,
      note: 'Event received but processing failed',
    })
  }
}

// Handle account updated - IMPROVED
const handleAccountUpdated = async (account) => {
  try {
    console.log('🔄 Processing account updated:', account.id)

    const user = await User.findOne({
      'stripeConnect.accountId': account.id,
    })

    if (!user) {
      console.log(`⚠️ User not found for account: ${account.id}`)
      return
    }

    // Update user's Connect account status
    await user.updateConnectAccountStatus(account)

    console.log(`✅ Updated Connect account status for user: ${user.email}`)
  } catch (error) {
    console.error('❌ Error handling account updated:', error)
    throw error
  }
}

// Handle account deauthorized - IMPROVED
const handleAccountDeauthorized = async (application) => {
  try {
    console.log('🔄 Processing account deauthorized:', application.account)

    const user = await User.findOne({
      'stripeConnect.accountId': application.account,
    })

    if (!user) {
      console.log(`⚠️ User not found for account: ${application.account}`)
      return
    }

    // Reset Connect account info
    user.stripeConnect = {
      accountId: null,
      isVerified: false,
      onboardingCompleted: false,
      capabilities: {},
      requirementsNeeded: [],
    }

    await user.save()

    console.log(`✅ Deauthorized Connect account for user: ${user.email}`)
  } catch (error) {
    console.error('❌ Error handling account deauthorized:', error)
    throw error
  }
}

// Handle capability updated
const handleCapabilityUpdated = async (capability) => {
  try {
    console.log('🔄 Processing capability updated:', capability.account)

    const user = await User.findOne({
      'stripeConnect.accountId': capability.account,
    })

    if (!user) {
      console.log(`⚠️ User not found for account: ${capability.account}`)
      return
    }

    // Update capability status
    if (!user.stripeConnect.capabilities) {
      user.stripeConnect.capabilities = {}
    }

    user.stripeConnect.capabilities[capability.id] = capability.status
    user.stripeConnect.lastUpdated = new Date()
    await user.save()

    console.log(
      `✅ Updated capability ${capability.id} for user: ${user.email}`
    )
  } catch (error) {
    console.error('❌ Error handling capability updated:', error)
    throw error
  }
}

// Handle payout created
const handlePayoutCreated = async (payout) => {
  try {
    console.log('🔄 Processing payout created:', payout.id)

    // Find the payout in our database
    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    })

    if (dbPayout) {
      dbPayout.status = 'processing'
      await dbPayout.save()
      console.log(`✅ Updated payout status to processing: ${dbPayout._id}`)
    } else {
      console.log(`⚠️ Payout not found in database: ${payout.id}`)
    }
  } catch (error) {
    console.error('❌ Error handling payout created:', error)
    throw error
  }
}

// Handle payout updated
const handlePayoutUpdated = async (payout) => {
  try {
    console.log('🔄 Processing payout updated:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    })

    if (dbPayout) {
      // Update payout status based on Stripe status
      if (payout.status === 'in_transit') {
        dbPayout.status = 'in_transit'
      } else if (payout.status === 'paid') {
        dbPayout.status = 'paid'
        dbPayout.paidAt = new Date(payout.arrival_date * 1000)
      }

      await dbPayout.save()
      console.log(`✅ Updated payout status: ${dbPayout._id}`)
    } else {
      console.log(`⚠️ Payout not found in database: ${payout.id}`)
    }
  } catch (error) {
    console.error('❌ Error handling payout updated:', error)
    throw error
  }
}

// Handle payout paid - IMPROVED
const handlePayoutPaid = async (payout) => {
  try {
    console.log('🔄 Processing payout paid:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    }).populate('user')

    if (!dbPayout) {
      console.log(`⚠️ Payout not found: ${payout.id}`)
      return
    }

    // Mark payout as paid
    await dbPayout.markAsPaid(new Date(payout.arrival_date * 1000))

    // Update user earnings info
    if (dbPayout.user) {
      await dbPayout.user.updateEarningsInfo()
    }

    console.log(`✅ Marked payout as paid: ${dbPayout._id}`)
  } catch (error) {
    console.error('❌ Error handling payout paid:', error)
    throw error
  }
}

// Handle payout failed - IMPROVED
const handlePayoutFailed = async (payout) => {
  try {
    console.log('🔄 Processing payout failed:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    }).populate('user')

    if (!dbPayout) {
      console.log(`⚠️ Payout not found: ${payout.id}`)
      return
    }

    // Mark payout as failed
    await dbPayout.markAsFailed(payout.failure_code, payout.failure_message)

    // Release earnings back to available
    await Earnings.updateMany(
      { _id: { $in: dbPayout.earnings } },
      { $unset: { payout: 1 } }
    )

    // Update user earnings info
    if (dbPayout.user) {
      await dbPayout.user.updateEarningsInfo()
    }

    console.log(`✅ Marked payout as failed: ${dbPayout._id}`)
  } catch (error) {
    console.error('❌ Error handling payout failed:', error)
    throw error
  }
}

// Handle payout canceled
const handlePayoutCanceled = async (payout) => {
  try {
    console.log('🔄 Processing payout canceled:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    }).populate('user')

    if (!dbPayout) {
      console.log(`⚠️ Payout not found: ${payout.id}`)
      return
    }

    // Cancel payout
    await dbPayout.cancel('Canceled by Stripe')

    // Release earnings back to available
    await Earnings.updateMany(
      { _id: { $in: dbPayout.earnings } },
      { $unset: { payout: 1 } }
    )

    // Update user earnings info
    if (dbPayout.user) {
      await dbPayout.user.updateEarningsInfo()
    }

    console.log(`✅ Canceled payout: ${dbPayout._id}`)
  } catch (error) {
    console.error('❌ Error handling payout canceled:', error)
    throw error
  }
}

// Handle transfer created
const handleTransferCreated = async (transfer) => {
  try {
    console.log('🔄 Processing transfer created:', transfer.id)

    // Find payout by transfer ID
    const payout = await Payout.findOne({
      stripeTransferId: transfer.id,
    })

    if (payout) {
      payout.status = 'processing'
      await payout.save()
      console.log(`✅ Updated payout status for transfer: ${transfer.id}`)
    } else {
      console.log(`⚠️ Payout not found for transfer: ${transfer.id}`)
    }
  } catch (error) {
    console.error('❌ Error handling transfer created:', error)
    throw error
  }
}

// Handle transfer updated
const handleTransferUpdated = async (transfer) => {
  try {
    console.log('🔄 Processing transfer updated:', transfer.id)
    // Additional logic can be added here if needed
  } catch (error) {
    console.error('❌ Error handling transfer updated:', error)
    throw error
  }
}

// Handle transfer paid
const handleTransferPaid = async (transfer) => {
  try {
    console.log('🔄 Processing transfer paid:', transfer.id)
    // This indicates the transfer to the Connect account was successful
    console.log(`✅ Transfer paid successfully: ${transfer.id}`)
  } catch (error) {
    console.error('❌ Error handling transfer paid:', error)
    throw error
  }
}

// Handle transfer failed
const handleTransferFailed = async (transfer) => {
  try {
    console.log('🔄 Processing transfer failed:', transfer.id)

    const payout = await Payout.findOne({
      stripeTransferId: transfer.id,
    }).populate('user')

    if (!payout) {
      console.log(`⚠️ Payout not found for transfer: ${transfer.id}`)
      return
    }

    // Mark payout as failed
    await payout.markAsFailed(transfer.failure_code, transfer.failure_message)

    // Release earnings back to available
    await Earnings.updateMany(
      { _id: { $in: payout.earnings } },
      { $unset: { payout: 1 } }
    )

    // Update user earnings info
    if (payout.user) {
      await payout.user.updateEarningsInfo()
    }

    console.log(`✅ Transfer failed, marked payout as failed: ${payout._id}`)
  } catch (error) {
    console.error('❌ Error handling transfer failed:', error)
    throw error
  }
}

// Handle invoice payment succeeded (for creating renewal earnings)
const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    console.log('🔄 Processing invoice payment succeeded:', invoice.id)

    if (!invoice.subscription) {
      console.log('⚠️ Invoice has no subscription, skipping')
      return
    }

    // Get subscription from our database
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    })

    if (!subscription) {
      console.log(`⚠️ Subscription not found: ${invoice.subscription}`)
      return
    }

    // Check if this is a renewal (not the first payment)
    const isRenewal = invoice.billing_reason === 'subscription_cycle'

    if (isRenewal) {
      // Create renewal earning
      try {
        await createRenewalEarning(subscription, invoice.payment_intent)
        console.log(
          `✅ Created renewal earning for subscription: ${subscription._id}`
        )
      } catch (earningError) {
        console.error('❌ Error creating renewal earning:', earningError)
      }
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment succeeded:', error)
    throw error
  }
}

// Handle subscription updated
const handleSubscriptionUpdated = async (subscription) => {
  try {
    console.log('🔄 Processing subscription updated:', subscription.id)

    // Update subscription in our database
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    })

    if (dbSubscription) {
      await dbSubscription.updateFromStripe(subscription)
      console.log(`✅ Updated subscription: ${dbSubscription._id}`)
    } else {
      console.log(`⚠️ Subscription not found in database: ${subscription.id}`)
    }
  } catch (error) {
    console.error('❌ Error handling subscription updated:', error)
    throw error
  }
}

export default {
  handleStripeConnectWebhook,
}
