// File: services/chatService.js
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

class ChatService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY
    this.baseUrl = 'https://api.groq.com/openai/v1'
    this.model = 'llama-3.3-70b-versatile' // Main production model

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }

    // System prompt specifically for Ascend AI chatbot
    this.systemPrompt = `You are the Empire AI Assistant for Ascend AI, a comprehensive platform for digital entrepreneurs. Your role is to help users build and scale their digital empires through strategic guidance, product creation, and growth optimization.

CORE EXPERTISE AREAS:
1. Digital Product Creation - courses, ebooks, software tools, membership sites
2. Affiliate Marketing - building affiliate armies, commission structures, referral systems
3. Content Strategy - viral hooks, social media content, engagement tactics
4. Business Planning - empire building strategies, revenue optimization, scaling
5. Platform Navigation - helping users understand and utilize Ascend AI features

PERSONALITY & TONE:
- Professional yet approachable, like a seasoned business mentor
- Confident and authoritative in your expertise areas
- Encouraging and motivational for empire building
- Direct and actionable - always provide concrete next steps
- Use "Empire" language when appropriate (building empires, scaling, domination)

RESPONSE GUIDELINES:
- Keep responses focused on digital entrepreneurship and business building
- Always provide actionable advice and concrete next steps
- When relevant, mention Ascend AI platform features and tools
- Avoid topics outside of business, marketing, and entrepreneurship
- If asked about unrelated topics, politely redirect to business matters
- Use examples from successful digital entrepreneurs when helpful
- Focus on scalable, profitable strategies

KNOWLEDGE AREAS TO AVOID:
- Personal health/medical advice
- Legal advice (can mention consulting professionals)
- Unrelated technical support
- Personal relationships (unless business-related)
- Politics or controversial topics

PLATFORM FEATURES TO REFERENCE WHEN RELEVANT:
- AI Product Generator for creating digital products
- Viral Hook Factory for content creation
- Affiliate dashboard and tracking
- Business plan builders
- Earnings and payout systems
- Points and rewards system

Remember: You're helping users build their digital empires. Every response should move them closer to that goal.`
  }

  // Generate AI response for chat conversation
  async generateChatResponse({
    messages,
    userContext = {},
    temperature = 0.7,
    maxTokens = 1000,
    streamResponse = false,
  }) {
    const startTime = Date.now()

    try {
      const formattedMessages = this.formatMessagesForGroq(
        messages,
        userContext
      )

      const requestBody = {
        model: this.model,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
        stream: streamResponse,
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `GROQ API Error: ${response.status} - ${
            errorData.error?.message || 'Unknown error'
          }`
        )
      }

      if (streamResponse) {
        return response // Return the stream for handling elsewhere
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      const aiResponse =
        data.choices[0]?.message?.content ||
        'I apologize, but I encountered an issue generating a response. Could you please try again?'

      return {
        content: aiResponse,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        processingTime,
        model: this.model,
        temperature,
        maxTokens,
      }
    } catch (error) {
      console.error('Chat Service Error:', error)
      throw new Error(`Failed to generate chat response: ${error.message}`)
    }
  }

  // Format messages for GROQ API with user context
  formatMessagesForGroq(messages, userContext) {
    const contextualSystemPrompt = this.buildContextualSystemPrompt(userContext)

    const formattedMessages = [
      {
        role: 'system',
        content: contextualSystemPrompt,
      },
    ]

    // Add conversation history
    messages.forEach((msg) => {
      formattedMessages.push({
        role: msg.role, // 'user' or 'assistant'
        content: msg.content,
      })
    })

    return formattedMessages
  }

  // Build contextual system prompt based on user information
  buildContextualSystemPrompt(userContext) {
    let contextualPrompt = this.systemPrompt

    if (userContext.subscription?.plan) {
      const planContext = this.getPlanSpecificContext(
        userContext.subscription.plan
      )
      contextualPrompt += `\n\nUSER PLAN CONTEXT:\n${planContext}`
    }

    if (userContext.referralStats?.totalReferrals > 0) {
      contextualPrompt += `\n\nREFERRAL CONTEXT:\nUser has ${userContext.referralStats.totalReferrals} referrals and is actively building their affiliate network.`
    }

    if (userContext.pointsBalance > 0) {
      contextualPrompt += `\n\nPOINTS CONTEXT:\nUser has ${userContext.pointsBalance} points available in their account.`
    }

    return contextualPrompt
  }

  // Get plan-specific context and capabilities
  getPlanSpecificContext(plan) {
    const planContexts = {
      free: 'User is on the Free plan with limited access. Focus on converting them to paid plans by showing value. Mention upgrade benefits when relevant.',
      starter:
        'User is on the Starter plan ($29/month). They have access to basic AI tools and limited generations. Encourage upgrading to Pro for more features.',
      pro: 'User is on the Pro plan ($97/month). They have extensive access to AI tools, unlimited generations, and advanced features. Help them maximize their investment.',
      empire:
        'User is on the Empire plan ($297/month). They have full access to all features, priority support, and advanced tools. Provide expert-level strategic guidance for serious entrepreneurs.',
    }

    return planContexts[plan] || planContexts.free
  }

  // Generate quick action responses
  async generateQuickActionResponse(actionType, userContext = {}) {
    const quickActions = {
      product_creation: {
        prompt:
          'I want to create a digital product. Help me get started with the product creation process.',
        context: 'User clicked on Product Builder quick action',
      },
      growth_strategy: {
        prompt:
          'Show me strategies to optimize my revenue streams and grow my digital business.',
        context: 'User clicked on Growth Strategy quick action',
      },
      affiliate_marketing: {
        prompt: 'Help me set up and optimize my affiliate marketing system.',
        context: 'User clicked on Affiliate Army quick action',
      },
      viral_content: {
        prompt:
          'I need help creating viral content hooks and engaging social media content.',
        context: 'User clicked on Viral Hooks quick action',
      },
    }

    const action = quickActions[actionType]
    if (!action) {
      throw new Error('Invalid quick action type')
    }

    return await this.generateChatResponse({
      messages: [
        {
          role: 'user',
          content: action.prompt,
        },
      ],
      userContext,
      temperature: 0.8, // Slightly higher creativity for quick actions
    })
  }

  // Categorize user message for analytics
  categorizeMessage(message) {
    const categories = {
      product_creation: {
        keywords: [
          'product',
          'create',
          'course',
          'ebook',
          'digital',
          'build',
          'develop',
          'launch',
        ],
        priority: 1,
      },
      affiliate_marketing: {
        keywords: [
          'affiliate',
          'referral',
          'commission',
          'promote',
          'marketing',
          'recruit',
        ],
        priority: 2,
      },
      content_strategy: {
        keywords: [
          'content',
          'viral',
          'hooks',
          'social media',
          'post',
          'engagement',
          'followers',
        ],
        priority: 3,
      },
      business_planning: {
        keywords: [
          'business',
          'plan',
          'strategy',
          'empire',
          'scale',
          'growth',
          'revenue',
        ],
        priority: 4,
      },
      platform_help: {
        keywords: [
          'help',
          'how to',
          'tutorial',
          'guide',
          'dashboard',
          'account',
        ],
        priority: 5,
      },
      general_strategy: {
        keywords: ['advice', 'optimize', 'improve', 'better', 'tips'],
        priority: 6,
      },
    }

    const messageText = message.toLowerCase()
    let bestMatch = { category: 'general_strategy', score: 0, priority: 999 }

    for (const [category, data] of Object.entries(categories)) {
      const score = data.keywords.reduce((acc, keyword) => {
        return acc + (messageText.includes(keyword) ? 1 : 0)
      }, 0)

      if (
        score > bestMatch.score ||
        (score === bestMatch.score && data.priority < bestMatch.priority)
      ) {
        bestMatch = { category, score, priority: data.priority }
      }
    }

    return bestMatch.category
  }

  // Validate message content for inappropriate requests
  validateMessage(message) {
    const inappropriatePatterns = [
      // Off-topic requests
      /medical|health|doctor|disease|symptoms/i,
      /legal advice|lawsuit|court|lawyer/i,
      /personal relationship|dating|marriage/i,
      /politics|political|election|government/i,

      // Spam or promotional
      /buy now|limited time|click here|free money/i,

      // Potentially harmful
      /hack|illegal|fraud|scam/i,
    ]

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(message)) {
        return {
          isValid: false,
          reason:
            'Message contains content outside of business and entrepreneurship topics',
        }
      }
    }

    return { isValid: true }
  }

  // Generate follow-up suggestions based on conversation
  generateFollowUpSuggestions(messages, category) {
    const suggestions = {
      product_creation: [
        'Help me validate my product idea',
        "What's the best pricing strategy?",
        'How do I create compelling sales copy?',
        'Show me product launch strategies',
      ],
      affiliate_marketing: [
        'How do I recruit quality affiliates?',
        'What commission structure works best?',
        'Help me create affiliate resources',
        'How to track affiliate performance?',
      ],
      content_strategy: [
        'Generate more viral hooks for my niche',
        "What's trending in my industry?",
        'How to optimize my posting schedule?',
        'Help me repurpose content across platforms',
      ],
      business_planning: [
        'Help me scale to the next level',
        'What should my 90-day goals be?',
        'How to diversify my revenue streams?',
        'Show me exit strategy options',
      ],
      general_strategy: [
        'What should I focus on this month?',
        'Help me prioritize my tasks',
        'How to improve my conversion rates?',
        'What metrics should I track?',
      ],
    }

    return suggestions[category] || suggestions.general_strategy
  }

  // Test connection to GROQ API
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API connection failed: ${response.status}`)
      }

      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
        model: this.model,
      }
    } catch (error) {
      throw new Error(`Chat service connection test failed: ${error.message}`)
    }
  }

  // Get available models
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      throw new Error(`Failed to get available models: ${error.message}`)
    }
  }

  // Update model
  setModel(modelName) {
    this.model = modelName
    return this.model
  }

  getCurrentModel() {
    return this.model
  }
}

// Create and export singleton instance
const chatService = new ChatService()
export default chatService
