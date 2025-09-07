// File: controllers/stripeConnectWebhook.js
import { stripe } from '../config/stripe.js'
import Earnings from '../models/Earnings.js'
import Payout from '../models/Payout.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import { createRenewalEarning } from '../utils/earningsIntegration.js'

// Handle Stripe Connect webhooks
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
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Received Connect event: ${event.type}`)

  try {
    // Handle the event
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

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error processing Connect webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

// Handle account updated
const handleAccountUpdated = async (account) => {
  try {
    console.log('Processing account updated:', account.id)

    const user = await User.findOne({
      'stripeConnect.accountId': account.id,
    })

    if (!user) {
      console.log(`User not found for account: ${account.id}`)
      return
    }

    // Update user's Connect account status
    await user.updateConnectAccountStatus(account)

    console.log(`Updated Connect account status for user: ${user.email}`)
  } catch (error) {
    console.error('Error handling account updated:', error)
    throw error
  }
}

// Handle account deauthorized
const handleAccountDeauthorized = async (application) => {
  try {
    console.log('Processing account deauthorized:', application.account)

    const user = await User.findOne({
      'stripeConnect.accountId': application.account,
    })

    if (!user) {
      console.log(`User not found for account: ${application.account}`)
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

    console.log(`Deauthorized Connect account for user: ${user.email}`)
  } catch (error) {
    console.error('Error handling account deauthorized:', error)
    throw error
  }
}

// Handle capability updated
const handleCapabilityUpdated = async (capability) => {
  try {
    console.log('Processing capability updated:', capability.account)

    const user = await User.findOne({
      'stripeConnect.accountId': capability.account,
    })

    if (!user) {
      console.log(`User not found for account: ${capability.account}`)
      return
    }

    // Update capability status
    if (!user.stripeConnect.capabilities) {
      user.stripeConnect.capabilities = {}
    }

    user.stripeConnect.capabilities[capability.id] = capability.status
    await user.save()

    console.log(`Updated capability ${capability.id} for user: ${user.email}`)
  } catch (error) {
    console.error('Error handling capability updated:', error)
    throw error
  }
}

// Handle payout created
const handlePayoutCreated = async (payout) => {
  try {
    console.log('Processing payout created:', payout.id)

    // Find the payout in our database
    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    })

    if (dbPayout) {
      dbPayout.status = 'processing'
      await dbPayout.save()
      console.log(`Updated payout status to processing: ${dbPayout._id}`)
    }
  } catch (error) {
    console.error('Error handling payout created:', error)
    throw error
  }
}

// Handle payout updated
const handlePayoutUpdated = async (payout) => {
  try {
    console.log('Processing payout updated:', payout.id)

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
      console.log(`Updated payout status: ${dbPayout._id}`)
    }
  } catch (error) {
    console.error('Error handling payout updated:', error)
    throw error
  }
}

// Handle payout paid
const handlePayoutPaid = async (payout) => {
  try {
    console.log('Processing payout paid:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    }).populate('user')

    if (!dbPayout) {
      console.log(`Payout not found: ${payout.id}`)
      return
    }

    // Mark payout as paid
    await dbPayout.markAsPaid(new Date(payout.arrival_date * 1000))

    // Update user earnings info
    if (dbPayout.user) {
      await dbPayout.user.updateEarningsInfo()
    }

    console.log(`Marked payout as paid: ${dbPayout._id}`)
  } catch (error) {
    console.error('Error handling payout paid:', error)
    throw error
  }
}

// Handle payout failed
const handlePayoutFailed = async (payout) => {
  try {
    console.log('Processing payout failed:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    }).populate('user')

    if (!dbPayout) {
      console.log(`Payout not found: ${payout.id}`)
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

    console.log(`Marked payout as failed: ${dbPayout._id}`)
  } catch (error) {
    console.error('Error handling payout failed:', error)
    throw error
  }
}

// Handle payout canceled
const handlePayoutCanceled = async (payout) => {
  try {
    console.log('Processing payout canceled:', payout.id)

    const dbPayout = await Payout.findOne({
      stripePayoutId: payout.id,
    }).populate('user')

    if (!dbPayout) {
      console.log(`Payout not found: ${payout.id}`)
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

    console.log(`Canceled payout: ${dbPayout._id}`)
  } catch (error) {
    console.error('Error handling payout canceled:', error)
    throw error
  }
}

// Handle transfer created
const handleTransferCreated = async (transfer) => {
  try {
    console.log('Processing transfer created:', transfer.id)

    // Find payout by transfer ID
    const payout = await Payout.findOne({
      stripeTransferId: transfer.id,
    })

    if (payout) {
      payout.status = 'processing'
      await payout.save()
      console.log(`Updated payout status for transfer: ${transfer.id}`)
    }
  } catch (error) {
    console.error('Error handling transfer created:', error)
    throw error
  }
}

// Handle transfer paid
const handleTransferPaid = async (transfer) => {
  try {
    console.log('Processing transfer paid:', transfer.id)

    // This indicates the transfer to the Connect account was successful
    // The actual payout status will be updated by payout events
    console.log(`Transfer paid successfully: ${transfer.id}`)
  } catch (error) {
    console.error('Error handling transfer paid:', error)
    throw error
  }
}

// Handle transfer failed
const handleTransferFailed = async (transfer) => {
  try {
    console.log('Processing transfer failed:', transfer.id)

    const payout = await Payout.findOne({
      stripeTransferId: transfer.id,
    }).populate('user')

    if (!payout) {
      console.log(`Payout not found for transfer: ${transfer.id}`)
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

    console.log(`Transfer failed, marked payout as failed: ${payout._id}`)
  } catch (error) {
    console.error('Error handling transfer failed:', error)
    throw error
  }
}

// Handle invoice payment succeeded (for creating renewal earnings)
const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    console.log('Processing invoice payment succeeded:', invoice.id)

    if (!invoice.subscription) {
      console.log('Invoice has no subscription, skipping')
      return
    }

    // Get subscription from our database
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    })

    if (!subscription) {
      console.log(`Subscription not found: ${invoice.subscription}`)
      return
    }

    // Check if this is a renewal (not the first payment)
    const isRenewal = invoice.billing_reason === 'subscription_cycle'

    if (isRenewal) {
      // Create renewal earning
      try {
        await createRenewalEarning(subscription, invoice.payment_intent)
        console.log(
          `Created renewal earning for subscription: ${subscription._id}`
        )
      } catch (earningError) {
        console.error('Error creating renewal earning:', earningError)
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
    throw error
  }
}

// Handle subscription updated
const handleSubscriptionUpdated = async (subscription) => {
  try {
    console.log('Processing subscription updated:', subscription.id)

    // Update subscription in our database
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    })

    if (dbSubscription) {
      await dbSubscription.updateFromStripe(subscription)
      console.log(`Updated subscription: ${dbSubscription._id}`)
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

export default {
  handleStripeConnectWebhook,
}
