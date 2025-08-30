// File: services/groqService.js
import dotenv from 'dotenv'
import fetch from 'node-fetch'
dotenv.config({ quiet: true })

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY
    this.baseUrl = 'https://api.groq.com/openai/v1'
    this.model = 'llama-3.3-70b-versatile' // Main production model

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }
  }

  // Generate viral hooks using GROQ API
  async generateViralHooks({ platform, niche, tone, customPrompt = '' }) {
    const startTime = Date.now()

    try {
      const prompt = this.buildPrompt(platform, niche, tone, customPrompt)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a world-class copywriter and viral content expert. Your job is to create scroll-stopping hooks that grab attention and drive massive engagement. Always return exactly 5 hooks, numbered 1-5, with each hook on a new line.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.9, // Higher creativity
          max_tokens: 800,
          top_p: 0.9,
          frequency_penalty: 0.5, // Reduce repetition
          presence_penalty: 0.3,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `GROQ API Error: ${response.status} - ${
            errorData.error?.message || 'Unknown error'
          }`
        )
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      // Parse the generated hooks
      const content = data.choices[0].message.content
      const hooks = this.parseHooks(content)

      return {
        hooks,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        processingTime,
        model: this.model,
        rawContent: content,
      }
    } catch (error) {
      console.error('GROQ Service Error:', error)
      throw new Error(`Failed to generate hooks: ${error.message}`)
    }
  }

  // Build the prompt for hook generation
  buildPrompt(platform, niche, tone, customPrompt) {
    const platformSpecs = {
      instagram: {
        context: 'Instagram posts and reels',
        specs: 'Visual-first platform, hashtag-friendly, mobile-optimized',
        maxLength: '125 characters for optimal engagement',
      },
      tiktok: {
        context: 'TikTok videos',
        specs: 'Short-form video, trend-aware, catchy and memorable',
        maxLength: '100 characters, punchy and energetic',
      },
      twitter: {
        context: 'Twitter/X posts',
        specs: 'Fast-paced, news-style, discussion-starting',
        maxLength: '240 characters, Twitter-optimized',
      },
      linkedin: {
        context: 'LinkedIn professional posts',
        specs: 'Professional, industry-focused, thought leadership',
        maxLength: '150 characters, business-appropriate',
      },
      email: {
        context: 'Email subject lines',
        specs: 'Inbox-standing, open-worthy, personal',
        maxLength: '50 characters for mobile preview',
      },
      youtube: {
        context: 'YouTube video titles',
        specs: 'Search-friendly, click-worthy, descriptive',
        maxLength: '60 characters for full display',
      },
    }

    const toneSpecs = {
      urgent:
        'Create FOMO, use time-sensitive language, emphasize scarcity and immediate action',
      controversial:
        'Challenge common beliefs, spark debate, use polarizing statements',
      curiosity:
        'Create information gaps, tease valuable insights, make people desperate to know more',
      emotional:
        'Trigger strong emotions, use personal stories, connect deeply with feelings',
      authority:
        'Position as expert, use confident language, share insider knowledge',
      storytelling:
        'Use narrative hooks, create intrigue, promise compelling stories',
    }

    const nicheContext = {
      entrepreneurship:
        'business building, startups, making money, financial freedom',
      fitness: 'workouts, health, body transformation, wellness',
      relationships: 'dating, marriage, family, social skills',
      finance: 'investing, saving, wealth building, financial planning',
      'self-improvement':
        'productivity, mindset, personal growth, success habits',
      technology: 'tech trends, gadgets, software, digital innovation',
      marketing: 'advertising, branding, social media, sales',
      health: 'nutrition, mental health, medical, lifestyle',
      travel: 'destinations, experiences, adventure, culture',
      education: 'learning, skills, courses, knowledge',
      fashion: 'style, trends, clothing, beauty',
      food: 'recipes, cooking, restaurants, nutrition',
    }

    const platformSpec = platformSpecs[platform]
    const toneSpec = toneSpecs[tone]
    const nicheSpec = nicheContext[niche]

    let prompt = `Create 5 viral hooks for ${
      platformSpec.context
    } in the ${niche} niche.

PLATFORM REQUIREMENTS:
- ${platformSpec.specs}
- Optimal length: ${platformSpec.maxLength}

TONE REQUIREMENTS (${tone.toUpperCase()}):
${toneSpec}

NICHE FOCUS:
Target audience interested in: ${nicheSpec}

HOOK REQUIREMENTS:
1. Each hook must be scroll-stopping and attention-grabbing
2. Use psychological triggers that drive engagement
3. Make people want to read/watch more
4. Be specific and concrete, avoid vague statements
5. Include power words and emotional triggers

${customPrompt ? `ADDITIONAL CONTEXT:\n${customPrompt}\n` : ''}

FORMAT:
Return exactly 5 hooks, formatted as:
1. [First hook]
2. [Second hook] 
3. [Third hook]
4. [Fourth hook]
5. [Fifth hook]

Generate viral hooks now:`

    return prompt
  }

  // Parse hooks from AI response
  parseHooks(content) {
    try {
      const lines = content.trim().split('\n')
      const hooks = []

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine) {
          // Remove numbering (1., 2., etc.) and clean up
          const cleanHook = trimmedLine
            .replace(/^\d+\.\s*/, '') // Remove "1. ", "2. ", etc.
            .replace(/^[-*]\s*/, '') // Remove "- " or "* "
            .trim()

          if (cleanHook && cleanHook.length > 10) {
            // Ensure it's not just numbering
            hooks.push(cleanHook)
          }
        }
      }

      // Ensure we have exactly 5 hooks
      if (hooks.length < 5) {
        // If we don't have enough hooks, generate some fallbacks
        while (hooks.length < 5) {
          hooks.push(
            `Hook ${hooks.length + 1}: Generated content for your niche`
          )
        }
      }

      // Take only first 5 hooks if we have more
      return hooks.slice(0, 5)
    } catch (error) {
      console.error('Error parsing hooks:', error)
      // Return fallback hooks
      return [
        'Stop scrolling if this applies to you...',
        'Everyone is doing this wrong (except the top 1%)',
        'I discovered this at 3AM and it changed everything',
        "The secret that successful people don't want you to know",
        'This simple trick will transform your results',
      ]
    }
  }

  // Test the connection to GROQ API
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

      const data = await response.json()
      return {
        status: 'connected',
        availableModels: data.data?.length || 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`GROQ connection test failed: ${error.message}`)
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

  // Change the model being used
  setModel(modelName) {
    this.model = modelName
    return this.model
  }

  // Get current model
  getCurrentModel() {
    return this.model
  }
}

// Create and export singleton instance
const groqService = new GroqService()
export default groqService
