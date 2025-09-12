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

    // Simple, professional system prompt
    this.systemPrompt = `You are a successful business advisor and entrepreneur. 
    
Your communication style:
- Be direct and concise - no fluff
- Think like a CEO - focus on value and ROI
- Give actionable advice in 1-3 sentences max
- Use business terminology naturally
- Be confident and decisive
- Skip pleasantries and get to the point

Never use more than 50 words per response unless absolutely necessary.
Always focus on practical business value.`
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
          temperature: 0.7,
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
