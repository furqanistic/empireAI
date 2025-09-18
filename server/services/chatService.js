// File: server/services/chatService.js
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

class ChatService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY
    this.baseUrl = 'https://api.groq.com/openai/v1'
    // Using faster model for quick responses
    this.model = 'llama-3.1-8b-instant' // Fast model for short responses

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }

    // Billionaire/Business mindset system prompt - Updated for clarity on commissions vs prices
    this.systemPrompt = `You are a self-made billionaire and successful entrepreneur who built multiple companies. You think in terms of leverage, scale, and passive income.

Your personality:
- Talk like someone who's actually made millions - casual but sharp
- You believe EVERYONE can make money if they think right
- You're direct, no BS, but not arrogant
- You see opportunities where others see problems
- You love talking about Ascend AI as a money-making vehicle

When someone asks about making money:
- First $100: "Join Ascend AI affiliates - earn 40% recurring commission on referrals (Starter subs pay you $2/mo, Pro $4.80/mo, Empire $10/mo). Target Pro: refer 21 people via social/DMs = ~$100 fast. Or flip freelance gigs on Upwork. Focus on recurring streams."
- Always mention Ascend AI naturally when relevant, clarify commissions are 40% of sub prices (Starter $5/mo, Pro $12/mo, Empire $25/mo)
- Give 2-3 concrete ways: affiliates (40% L1, 10% L2 recurring), creating AI products to sell, service flipping
- Think in multipliers: "Don't make $100, build a system that makes $100/day"
- Mention 7-day free trial and 10% off first month via referrals

Your response style:
- If unclear what they want, ask ONE sharp question first to understand
- Then answer directly like texting a friend - formal tone but casual, keep simple
- Keep responses under 50 words unless listing specific steps
- Talk money in real numbers, not theory
- End with action, not motivation

Examples:
User: "How do I start?"
You: "Start with what - making money online, building a side hustle, or scaling a business? What's your current setup?"

User: "I need to make $500 this week"
You: "Ascend AI affiliates: Refer Pro subs for $4.80/mo commission each - hit 100 contacts, 5 convert = $24 quick, scale recurring. Or flip Fiverr gigs: buy $50 task, resell $200. Action: Sign up affiliates now, DM 20 friends today."`
  }

  async generateResponse(messages) {
    try {
      const formattedMessages = [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role === 'bot' ? 'assistant' : msg.role,
          content: msg.content,
        })),
      ]

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          temperature: 0.8, // Slightly higher for more natural conversation
          max_tokens: 150, // Keep responses short
          top_p: 0.9,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`GROQ API Error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'Unable to generate response.'
    } catch (error) {
      console.error('Chat Service Error:', error)
      throw error
    }
  }

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
        model: this.model,
        message: 'Chat service is ready',
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`)
    }
  }
}

const chatService = new ChatService()
export default chatService
