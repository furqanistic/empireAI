// File: controllers/digitalProductWebhook.js
import { stripe } from '../config/stripe.js'
import DigitalProduct from '../models/DigitalProduct.js'
import User from '../models/User.js'

// Handle Stripe webhooks for digital product payments
export const handleDigitalProductWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_DIGITAL_PRODUCT_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Received event: ${event.type}`)

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object)
        break

      case 'invoice.payment_failed':
        // Handle failed payments (if using recurring billing)
        await handleInvoicePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

// Handle successful checkout session
const handleCheckoutSessionCompleted = async (session) => {
  try {
    console.log('Processing checkout session completed:', session.id)

    // Get session metadata
    const { productId, customerEmail, customerFirstName, customerLastName } =
      session.metadata

    if (!productId) {
      console.error('No product ID in session metadata')
      return
    }

    // Get the product
    const product = await DigitalProduct.findById(productId)
    if (!product) {
      console.error(`Product not found: ${productId}`)
      return
    }

    // Check if purchase already exists
    const existingPurchase = product.purchases.find(
      (p) => p.stripeSessionId === session.id
    )

    if (existingPurchase) {
      console.log(`Purchase already exists for session: ${session.id}`)
      return
    }

    // Find or create user
    let user = await User.findOne({ email: customerEmail })
    if (!user) {
      user = new User({
        name: `${customerFirstName} ${customerLastName}`,
        email: customerEmail,
        password: 'temp_password_' + Date.now(),
        role: 'user',
      })
      await user.save()
      console.log(`Created new user: ${user.email}`)
    }

    // Create purchase record
    const purchaseData = {
      user: user._id,
      email: customerEmail,
      name: `${customerFirstName} ${customerLastName}`,
      amount: session.amount_total / 100, // Convert from cents
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      status: 'completed',
      purchasedAt: new Date(),
    }

    // Add purchase to product
    await product.addPurchase(purchaseData)

    console.log(`Purchase processed successfully for product: ${product.name}`)

    // TODO: Send confirmation email to customer
    // await sendPurchaseConfirmationEmail(user.email, product, purchaseData)
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
    throw error
  }
}

// Handle successful payment intent
const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    console.log('Processing payment succeeded:', paymentIntent.id)

    // Find the product purchase by payment intent ID
    const product = await DigitalProduct.findOne({
      'purchases.stripePaymentIntentId': paymentIntent.id,
    })

    if (!product) {
      console.log(`No product found for payment intent: ${paymentIntent.id}`)
      return
    }

    // Find the specific purchase
    const purchase = product.purchases.find(
      (p) => p.stripePaymentIntentId === paymentIntent.id
    )

    if (!purchase) {
      console.error(
        `Purchase not found for payment intent: ${paymentIntent.id}`
      )
      return
    }

    // Update purchase status if needed
    if (purchase.status !== 'completed') {
      purchase.status = 'completed'
      await product.save()
      console.log(`Updated purchase status to completed: ${purchase._id}`)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

// Handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  try {
    console.log('Processing payment failed:', paymentIntent.id)

    // Find the product purchase by payment intent ID
    const product = await DigitalProduct.findOne({
      'purchases.stripePaymentIntentId': paymentIntent.id,
    })

    if (!product) {
      console.log(`No product found for payment intent: ${paymentIntent.id}`)
      return
    }

    // Find the specific purchase
    const purchase = product.purchases.find(
      (p) => p.stripePaymentIntentId === paymentIntent.id
    )

    if (!purchase) {
      console.error(
        `Purchase not found for payment intent: ${paymentIntent.id}`
      )
      return
    }

    // Update purchase status
    purchase.status = 'failed'
    await product.save()

    // TODO: Send payment failed notification
    // await sendPaymentFailedNotification(purchase.email, product)

    console.log(`Updated purchase status to failed: ${purchase._id}`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

// Handle charge dispute (chargeback)
const handleChargeDispute = async (dispute) => {
  try {
    console.log('Processing charge dispute:', dispute.id)

    const charge = dispute.charge

    // Find the product purchase by charge ID
    const product = await DigitalProduct.findOne({
      'purchases.stripePaymentIntentId': charge.payment_intent,
    })

    if (!product) {
      console.log(`No product found for charge: ${charge.id}`)
      return
    }

    // Find the specific purchase
    const purchase = product.purchases.find(
      (p) => p.stripePaymentIntentId === charge.payment_intent
    )

    if (!purchase) {
      console.error(`Purchase not found for charge: ${charge.id}`)
      return
    }

    // Mark purchase as disputed
    purchase.status = 'disputed'
    purchase.disputeId = dispute.id
    purchase.disputeReason = dispute.reason
    purchase.disputedAt = new Date()

    // Update product stats (reverse the sale)
    product.sales = Math.max(0, product.sales - 1)
    product.revenue = Math.max(0, product.revenue - purchase.amount)

    await product.save()

    // TODO: Notify product creator about dispute
    // await notifyCreatorOfDispute(product.creator, product, purchase, dispute)

    console.log(`Processed dispute for purchase: ${purchase._id}`)
  } catch (error) {
    console.error('Error handling charge dispute:', error)
    throw error
  }
}

// Handle failed invoice payment (for recurring billing if implemented)
const handleInvoicePaymentFailed = async (invoice) => {
  try {
    console.log('Processing invoice payment failed:', invoice.id)

    // This would be relevant if you implement recurring billing for digital products
    // For now, just log it
    console.log(
      'Invoice payment failed - not applicable for one-time digital product purchases'
    )
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
    throw error
  }
}

// Utility function to send purchase confirmation email (implement as needed)
const sendPurchaseConfirmationEmail = async (email, product, purchase) => {
  try {
    // TODO: Implement email sending logic
    console.log(
      `Should send confirmation email to ${email} for product: ${product.name}`
    )

    // Example using nodemailer or your preferred email service
    // const emailData = {
    //   to: email,
    //   subject: `Your purchase of ${product.name} is confirmed`,
    //   template: 'purchase-confirmation',
    //   data: {
    //     productName: product.name,
    //     amount: purchase.amount,
    //     downloadLink: `${process.env.FRONTEND_URL}/downloads?token=${generateDownloadToken()}`
    //   }
    // }
    // await emailService.send(emailData)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}

// Utility function to notify creator of dispute
const notifyCreatorOfDispute = async (
  creatorId,
  product,
  purchase,
  dispute
) => {
  try {
    // TODO: Implement creator notification logic
    console.log(
      `Should notify creator ${creatorId} of dispute for product: ${product.name}`
    )

    // Could create a notification in your app, send email, etc.
  } catch (error) {
    console.error('Error notifying creator of dispute:', error)
  }
}

export default {
  handleDigitalProductWebhook,
}
