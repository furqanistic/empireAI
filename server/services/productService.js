// File: services/productService.js
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

class ProductService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY
    this.baseUrl = 'https://api.groq.com/openai/v1'

    // Use different models based on detail level
    this.models = {
      standard: 'llama-3.3-70b-versatile',
      detailed: 'llama-3.1-70b-versatile',
    }

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }
  }

  // Generate complete digital product with optional detail level
  async generateCompleteProduct({
    productType,
    niche,
    audience,
    priceRange,
    complexity,
    customContext = '',
    detailLevel = 'standard',
  }) {
    const startTime = Date.now()

    try {
      // Choose model and settings based on detail level
      const model = this.models[detailLevel] || this.models.standard
      const maxTokens = detailLevel === 'detailed' ? 8000 : 4000
      const temperature = detailLevel === 'detailed' ? 0.9 : 0.8

      const prompt = this.buildProductPrompt(
        productType,
        niche,
        audience,
        priceRange,
        complexity,
        customContext,
        detailLevel
      )

      const fetchFunction = global.fetch || (await import('node-fetch')).default

      const response = await fetchFunction(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                detailLevel === 'detailed'
                  ? 'You are a world-class business strategist and digital product expert with 20+ years of experience. Create highly detailed, comprehensive digital product blueprints that leave no stone unturned. Include extensive market analysis, detailed implementation steps, comprehensive marketing strategies, and thorough business planning. ALWAYS return your response as valid JSON format with complete, detailed product information. Do not include any text before or after the JSON object.'
                  : 'You are a world-class business strategist and digital product expert. Create comprehensive, actionable digital product blueprints that entrepreneurs can immediately implement. ALWAYS return your response as valid JSON format with complete product details. Do not include any text before or after the JSON object.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        }),
      })

      if (!response.ok) {
        let errorMessage = `GROQ API Error: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = `GROQ API Error: ${response.status} - ${
            errorData.error?.message || errorData.message || 'Unknown error'
          }`
        } catch (parseError) {
          const errorText = await response.text()
          errorMessage = `GROQ API Error: ${response.status} - ${errorText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from GROQ API')
      }

      const processingTime = Date.now() - startTime

      // Parse the generated product
      const content = data.choices[0].message.content
      const product = this.parseProduct(
        content,
        productType,
        niche,
        audience,
        priceRange,
        complexity,
        detailLevel
      )

      return {
        product,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        processingTime,
        model,
        detailLevel,
        rawContent: content,
      }
    } catch (error) {
      console.error('Product Service Error:', error)

      if (error.message.includes('GROQ_API_KEY')) {
        throw new Error(
          'GROQ API key is missing or invalid. Please check your environment variables.'
        )
      } else if (error.message.includes('fetch')) {
        throw new Error(
          'Network error: Unable to connect to GROQ API. Please check your internet connection.'
        )
      } else if (error.message.includes('JSON')) {
        throw new Error('Invalid response from AI service. Please try again.')
      } else {
        throw new Error(`Failed to generate product: ${error.message}`)
      }
    }
  }

  // Build comprehensive prompt for product generation
  buildProductPrompt(
    productType,
    niche,
    audience,
    priceRange,
    complexity,
    customContext,
    detailLevel = 'standard'
  ) {
    const productTypeSpecs = {
      course: {
        structure:
          detailLevel === 'detailed'
            ? '12-20 comprehensive modules with 5-8 detailed lessons each, including practical exercises, case studies, and implementation guides'
            : '8-12 modules with 3-5 lessons each',
        deliverables:
          detailLevel === 'detailed'
            ? 'HD video lessons, downloadable worksheets, interactive templates, private community access, live Q&A sessions, bonus masterclasses, implementation guides, progress tracking tools'
            : 'Video lessons, worksheets, templates, community access',
        duration:
          detailLevel === 'detailed'
            ? '12-16 weeks comprehensive program with lifetime access'
            : '6-12 weeks completion time',
      },
      ebook: {
        structure:
          detailLevel === 'detailed'
            ? '15-25 comprehensive chapters with actionable content, case studies, worksheets, and implementation checklists'
            : '8-15 chapters with actionable content',
        deliverables:
          detailLevel === 'detailed'
            ? 'Premium PDF guide, bonus templates, checklists, video summaries, audio version, implementation roadmap'
            : 'PDF guide, bonus templates, checklists',
        duration:
          detailLevel === 'detailed'
            ? '6-8 hours comprehensive reading with lifetime reference'
            : '2-4 hours reading time',
      },
      template: {
        structure:
          detailLevel === 'detailed'
            ? 'Collection of 25-50 professional templates with variations, customization guides, and industry-specific versions'
            : 'Collection of 10-25 professional templates',
        deliverables:
          detailLevel === 'detailed'
            ? 'Editable files, comprehensive instruction guides, video tutorials, customization examples, industry variations'
            : 'Editable files, instruction guide, examples',
        duration:
          detailLevel === 'detailed'
            ? 'Immediate implementation with ongoing customization support'
            : 'Immediate implementation',
      },
      coaching: {
        structure:
          detailLevel === 'detailed'
            ? '16-24 week comprehensive program with weekly sessions, monthly intensives, and quarterly reviews'
            : '12-week program with weekly sessions',
        deliverables:
          detailLevel === 'detailed'
            ? '1-on-1 calls, group sessions, resources, accountability, VIP support, bonus intensives, lifetime alumni access'
            : '1-on-1 calls, group sessions, resources, accountability',
        duration:
          detailLevel === 'detailed'
            ? '6 months intensive program with lifetime support'
            : '3 months intensive program',
      },
      software: {
        structure:
          detailLevel === 'detailed'
            ? 'Comprehensive SaaS application with advanced features, integrations, automation, and enterprise capabilities'
            : 'SaaS application with core features',
        deliverables:
          detailLevel === 'detailed'
            ? 'Web app, mobile app, API, comprehensive documentation, training materials, onboarding, support system'
            : 'Web app, mobile app, API, documentation',
        duration:
          detailLevel === 'detailed'
            ? 'Ongoing subscription service with regular updates and premium support'
            : 'Ongoing subscription service',
      },
      mastermind: {
        structure:
          detailLevel === 'detailed'
            ? '18-24 month exclusive community program with multiple tiers and VIP access'
            : '12-month exclusive community program',
        deliverables:
          detailLevel === 'detailed'
            ? 'Monthly calls, quarterly intensives, private network, exclusive resources, VIP events, mentorship matching, success coaching'
            : 'Monthly calls, private network, resources, events',
        duration:
          detailLevel === 'detailed'
            ? '2 years commitment with lifetime alumni benefits'
            : '1 year commitment',
      },
      workshop: {
        structure:
          detailLevel === 'detailed'
            ? '5-7 day comprehensive intensive training series with hands-on practicum and follow-up sessions'
            : '3-day intensive training series',
        deliverables:
          detailLevel === 'detailed'
            ? 'Live sessions, recordings, comprehensive workbooks, certificates, follow-up coaching, implementation support, alumni community'
            : 'Live sessions, recordings, workbooks, certificates',
        duration:
          detailLevel === 'detailed'
            ? '1 week intensive + 90 days implementation support'
            : '3 days + 30 days implementation',
      },
      membership: {
        structure:
          detailLevel === 'detailed'
            ? 'Premium monthly content + exclusive community access + VIP benefits and bonuses'
            : 'Monthly content + community access',
        deliverables:
          detailLevel === 'detailed'
            ? 'New content monthly, exclusive forums, live Q&As, archives, bonus content, VIP calls, member-only events'
            : 'New content monthly, forums, live Q&As, archives',
        duration:
          detailLevel === 'detailed'
            ? 'Ongoing premium monthly subscription with VIP tiers'
            : 'Ongoing monthly subscription',
      },
    }

    const priceRangeSpecs = {
      budget: {
        range: '$9-$49',
        strategy:
          'Volume-based, impulse purchase, broad appeal, social proof focus',
      },
      mid: {
        range: '$97-$497',
        strategy:
          'Value-focused, problem-solving, targeted audience, transformation promise',
      },
      premium: {
        range: '$997-$2,997',
        strategy:
          'Transformation-based, comprehensive solution, exclusive positioning, premium experience',
      },
      elite: {
        range: '$5,000+',
        strategy:
          'Ultra-premium, done-with-you, luxury positioning, limited availability, VIP experience',
      },
    }

    const complexitySpecs = {
      simple:
        'Quick wins, easy implementation, minimal time investment, immediate results',
      moderate:
        'Comprehensive system, structured approach, medium time investment, sustained results',
      advanced:
        'Complete transformation, intensive program, significant time investment, life-changing results',
    }

    const audienceSpecs = {
      beginners:
        'New to the field, need fundamentals, step-by-step guidance, basic terminology',
      intermediate:
        'Some experience, ready to advance, practical strategies, skill building',
      advanced:
        'Experienced practitioners, optimization focused, advanced techniques, mastery level',
      entrepreneurs:
        'Business owners, profit-focused, scalable solutions, ROI-driven',
      professionals:
        'Career advancement, industry expertise, professional development, skill enhancement',
      creators:
        'Content creators, personal brand building, audience growth, monetization strategies',
    }

    const nicheContext = {
      business:
        'entrepreneurship, startups, business strategy, leadership, operations, scaling',
      marketing:
        'digital marketing, advertising, social media, content marketing, conversion optimization',
      fitness:
        'workouts, nutrition, body transformation, health coaching, wellness programs',
      finance:
        'investing, wealth building, financial planning, passive income, money management',
      development:
        'personal growth, productivity, mindset, habits, success psychology',
      technology:
        'tech skills, programming, AI, automation, digital tools, software development',
      design:
        'graphic design, UI/UX, creative skills, visual branding, digital art',
      relationships:
        'dating, marriage, communication, social skills, family dynamics',
      productivity:
        'time management, organization, systems, efficiency, work-life balance',
      investing:
        'stock market, real estate, crypto, passive income, wealth strategies',
      content:
        'content creation, influencer marketing, social media, video production',
      spirituality:
        'mindfulness, meditation, personal transformation, consciousness, life purpose',
    }

    const productSpec = productTypeSpecs[productType]
    const priceSpec = priceRangeSpecs[priceRange]
    const complexitySpec = complexitySpecs[complexity]
    const audienceSpec = audienceSpecs[audience]
    const nicheSpec = nicheContext[niche]

    const detailInstructions =
      detailLevel === 'detailed'
        ? `
IMPORTANT: This is a DETAILED generation. Provide:
- Comprehensive modules (12-20 instead of 8-12)
- Detailed lesson breakdowns (5-8 lessons per module instead of 3-5)
- Extensive marketing angles (8-10 instead of 5)
- Detailed bonus offerings (5-6 bonuses instead of 2-3)
- Comprehensive launch sequence (10-14 days instead of 5-7)
- In-depth sales copy with multiple headlines and subheadlines
- Detailed technical requirements and implementation steps
- Comprehensive revenue projections with multiple scenarios

Make everything 2-3x more detailed and comprehensive than standard.`
        : ''

    const moduleCount = detailLevel === 'detailed' ? '12-20' : '8-12'
    const lessonCount = detailLevel === 'detailed' ? '5-8' : '3-5'
    const marketingCount = detailLevel === 'detailed' ? '8-10' : '5'
    const bonusCount = detailLevel === 'detailed' ? '5-6' : '2-3'

    return `Create a complete digital product blueprint for a ${productType} targeting ${audience} in the ${niche} niche.

PRODUCT SPECIFICATIONS:
- Type: ${productType} (${productSpec.structure})
- Target: ${audienceSpec}
- Niche: ${nicheSpec}
- Price Range: ${priceSpec.range}
- Complexity: ${complexitySpec}
- Detail Level: ${detailLevel.toUpperCase()}

${detailInstructions}

REQUIREMENTS:
${customContext ? `Custom Requirements: ${customContext}\n` : ''}

CRITICAL: You MUST respond ONLY with valid JSON. No text before or after the JSON object.

Generate a comprehensive product blueprint with this EXACT JSON structure:

{
  "title": "Compelling product name that's marketable and clear",
  "overview": "${
    detailLevel === 'detailed'
      ? '4-6 paragraph extremely detailed description covering market opportunity, target transformation, unique methodology, success stories, and complete value proposition'
      : '2-3 paragraph detailed description of the product and its benefits'
  }",
  "outline": {
    "modules": [
      {
        "title": "Module name",
        "description": "What this module covers in detail",
        "lessons": ${
          detailLevel === 'detailed'
            ? '["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4", "Lesson 5", "Lesson 6", "Lesson 7", "Lesson 8"]'
            : '["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4"]'
        }
      }
    ]
  },
  "pricing": {
    "mainPrice": "Primary price point in ${priceSpec.range} range",
    "strategy": "Detailed pricing psychology and positioning strategy",
    "paymentPlans": ["Payment option 1", "Payment option 2", "Payment option 3"]
  },
  "marketing": {
    "angles": [${Array.from(
      { length: detailLevel === 'detailed' ? 10 : 5 },
      (_, i) => `"Marketing angle ${i + 1} - compelling hook"`
    ).join(', ')}]
  },
  "bonuses": [${Array.from(
    { length: detailLevel === 'detailed' ? 6 : 3 },
    (_, i) =>
      `{"title": "Bonus ${
        i + 1
      } name", "description": "What this bonus provides and its value"}`
  ).join(', ')}],
  "launch": {
    "sequence": [${Array.from(
      { length: detailLevel === 'detailed' ? 14 : 7 },
      (_, i) =>
        `{"day": ${i + 1}, "title": "Launch phase ${
          i + 1
        } name", "description": "What happens on day ${i + 1}"}`
    ).join(', ')}]
  },
  "sales": {
    "headline": "Primary sales headline",
    "subheadline": "Supporting subheadline",
    "bulletPoints": [${Array.from(
      { length: detailLevel === 'detailed' ? 8 : 4 },
      (_, i) => `"Benefit point ${i + 1}"`
    ).join(', ')}]
  },
  "technical": {
    "requirements": [${Array.from(
      { length: detailLevel === 'detailed' ? 6 : 3 },
      (_, i) => `"Technical requirement ${i + 1}"`
    ).join(', ')}]
  },
  "revenue": {
    "Conservative": "Revenue projection for conservative scenario",
    "Realistic": "Revenue projection for realistic scenario", 
    "Optimistic": "Revenue projection for optimistic scenario",
    "Monthly recurring potential": "Monthly recurring revenue potential if applicable"
  }
}

${
  detailLevel === 'detailed'
    ? `Make this extremely comprehensive with ${moduleCount} modules, ${lessonCount} lessons each, ${marketingCount} marketing angles, ${bonusCount} bonuses, extensive implementation guides, and thorough business planning.`
    : 'Make the product highly specific, actionable, and valuable.'
} Ensure all content is professional and market-ready.`
  }

  // Parse and structure the product data with improved error handling
  parseProduct(
    content,
    productType,
    niche,
    audience,
    priceRange,
    complexity,
    detailLevel = 'standard'
  ) {
    try {
      // Clean the content to extract JSON
      let cleanedContent = content.trim()

      // Remove any markdown code blocks
      cleanedContent = cleanedContent.replace(/```json\n?/g, '')
      cleanedContent = cleanedContent.replace(/```\n?/g, '')

      // Find JSON content
      const jsonStart = cleanedContent.indexOf('{')
      const jsonEnd = cleanedContent.lastIndexOf('}') + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        console.warn('No JSON found in response, using fallback generation')
        return this.generateFallbackProduct(
          productType,
          niche,
          audience,
          priceRange,
          complexity,
          detailLevel
        )
      }

      const jsonString = cleanedContent.substring(jsonStart, jsonEnd)
      const parsedProduct = JSON.parse(jsonString)

      // Validate and return the parsed product
      return this.validateAndNormalizeProduct(
        parsedProduct,
        productType,
        niche,
        audience,
        priceRange,
        complexity,
        detailLevel
      )
    } catch (error) {
      console.error('Error parsing product JSON:', error)
      console.log('Raw content:', content)
      return this.generateFallbackProduct(
        productType,
        niche,
        audience,
        priceRange,
        complexity,
        detailLevel
      )
    }
  }

  // Validate and normalize the parsed product
  validateAndNormalizeProduct(
    parsedProduct,
    productType,
    niche,
    audience,
    priceRange,
    complexity,
    detailLevel
  ) {
    return {
      title:
        parsedProduct.title ||
        this.generateFallbackTitle(productType, niche, audience),
      overview:
        parsedProduct.overview ||
        this.generateFallbackOverview(
          productType,
          niche,
          audience,
          complexity,
          detailLevel
        ),
      outline:
        parsedProduct.outline ||
        this.generateFallbackOutline(productType, niche, detailLevel),
      pricing:
        parsedProduct.pricing || this.generateFallbackPricing(priceRange),
      marketing:
        parsedProduct.marketing ||
        this.generateFallbackMarketing(niche, audience, detailLevel),
      bonuses:
        parsedProduct.bonuses ||
        this.generateFallbackBonuses(productType, detailLevel),
      launch: parsedProduct.launch || this.generateFallbackLaunch(detailLevel),
      sales:
        parsedProduct.sales ||
        this.generateFallbackSales(productType, niche, detailLevel),
      technical:
        parsedProduct.technical ||
        this.generateFallbackTechnical(productType, detailLevel),
      revenue:
        parsedProduct.revenue || this.generateFallbackRevenue(priceRange),
    }
  }

  // Fallback methods for when JSON parsing fails
  generateFallbackProduct(
    productType,
    niche,
    audience,
    priceRange,
    complexity,
    detailLevel = 'standard'
  ) {
    return {
      title: this.generateFallbackTitle(productType, niche, audience),
      overview: this.generateFallbackOverview(
        productType,
        niche,
        audience,
        complexity,
        detailLevel
      ),
      outline: this.generateFallbackOutline(productType, niche, detailLevel),
      pricing: this.generateFallbackPricing(priceRange),
      marketing: this.generateFallbackMarketing(niche, audience, detailLevel),
      bonuses: this.generateFallbackBonuses(productType, detailLevel),
      launch: this.generateFallbackLaunch(detailLevel),
      sales: this.generateFallbackSales(productType, niche, detailLevel),
      technical: this.generateFallbackTechnical(productType, detailLevel),
      revenue: this.generateFallbackRevenue(priceRange),
    }
  }

  generateFallbackTitle(productType, niche, audience) {
    const titles = {
      course: `The ${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Mastery Course for ${
        audience.charAt(0).toUpperCase() + audience.slice(1)
      }`,
      ebook: `The Complete ${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Guide`,
      template: `${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Templates Collection`,
      coaching: `${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Coaching Program`,
      software: `${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Management Platform`,
      mastermind: `Elite ${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Mastermind`,
      workshop: `${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Intensive Workshop`,
      membership: `${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } Community & Resources`,
    }
    return (
      titles[productType] ||
      `${niche.charAt(0).toUpperCase() + niche.slice(1)} ${
        productType.charAt(0).toUpperCase() + productType.slice(1)
      }`
    )
  }

  generateFallbackOverview(
    productType,
    niche,
    audience,
    complexity,
    detailLevel = 'standard'
  ) {
    if (detailLevel === 'detailed') {
      return `A comprehensive ${complexity} ${productType} designed specifically for ${audience} in the ${niche} space. This program combines proven strategies with practical implementation to deliver real, measurable results. Whether you're looking to master the fundamentals or take your skills to the next level, this ${productType} provides the roadmap and resources you need to succeed.

This isn't just another ${productType} - it's a complete transformation system built from years of experience and tested with hundreds of successful students. You'll discover the exact methods that industry leaders use to achieve breakthrough results, along with step-by-step implementation guides that ensure you can apply everything immediately.

The program is structured to take you from where you are now to where you want to be, with comprehensive support and accountability every step of the way. By the end of this journey, you'll have not just the knowledge, but the practical skills and confidence to achieve lasting success in ${niche}.

What sets this apart is the focus on real-world application. Every lesson, every strategy, every tool has been tested and proven to work. You're not just learning theory - you're building a complete system that you can implement immediately and scale over time.`
    }

    return `A comprehensive ${complexity} ${productType} designed specifically for ${audience} in the ${niche} space. This program combines proven strategies with practical implementation to deliver real, measurable results. Whether you're looking to master the fundamentals or take your skills to the next level, this ${productType} provides the roadmap and resources you need to succeed.`
  }

  generateFallbackOutline(productType, niche, detailLevel = 'standard') {
    const moduleCount = detailLevel === 'detailed' ? 15 : 8
    const lessonCount = detailLevel === 'detailed' ? 6 : 4

    const modules = []

    for (let i = 0; i < Math.min(moduleCount, 15); i++) {
      const lessons = []
      for (let j = 0; j < lessonCount; j++) {
        lessons.push(`Lesson ${j + 1}: Core Concept ${j + 1}`)
      }

      modules.push({
        title: `Module ${i + 1}: ${this.getModuleTitle(i, niche)}`,
        description: `Master the key concepts and practical applications for ${this.getModuleTitle(
          i,
          niche
        ).toLowerCase()}`,
        lessons,
      })
    }

    return { modules }
  }

  getModuleTitle(index, niche) {
    const titles = [
      'Foundation & Strategy',
      'Core Principles',
      'Implementation Tactics',
      'Advanced Techniques',
      'Optimization Strategies',
      'Scaling Systems',
      'Automation & Efficiency',
      'Advanced Analytics',
      'Leadership & Management',
      'Innovation & Growth',
      'Market Expansion',
      'Strategic Partnerships',
      'Future Planning',
      'Mastery Integration',
      'Legacy Building',
    ]
    return (
      titles[index] ||
      `Advanced ${niche.charAt(0).toUpperCase() + niche.slice(1)} Strategies`
    )
  }

  generateFallbackPricing(priceRange) {
    const pricing = {
      budget: {
        price: '$39',
        plans: ['One-time payment: $39', '2 payments of $20'],
      },
      mid: {
        price: '$297',
        plans: [
          'One-time payment: $297 (Save $50)',
          '3 payments of $116',
          '6 payments of $59',
        ],
      },
      premium: {
        price: '$1,497',
        plans: [
          'One-time payment: $1,497 (Save $200)',
          '3 payments of $565',
          '6 payments of $297',
        ],
      },
      elite: {
        price: '$7,997',
        plans: [
          'One-time investment: $7,997',
          '3 payments of $2,797',
          '6 payments of $1,497',
          '12 payments of $797',
        ],
      },
    }

    const selected = pricing[priceRange]
    return {
      mainPrice: selected.price,
      strategy:
        'Strategic pricing positioned for value delivery and market penetration with multiple payment options for accessibility.',
      paymentPlans: selected.plans,
    }
  }

  generateFallbackMarketing(niche, audience, detailLevel = 'standard') {
    const angles = [
      `Stop struggling with ${niche} - discover the exact system that creates consistent results`,
      `The #1 mistake ${audience} make in ${niche} (and how to fix it immediately)`,
      `From zero to hero: the step-by-step ${niche} transformation system`,
      `Why 95% of ${audience} fail at ${niche} (and the simple solution that works)`,
      `The secret ${niche} strategy that industry experts don't want you to know`,
    ]

    if (detailLevel === 'detailed') {
      angles.push(
        `How I went from complete beginner to ${niche} expert in record time (and you can too)`,
        `The ${niche} method that's disrupting the entire industry`,
        `Copy my proven ${niche} blueprint that generated 6-figure results`,
        `The counterintuitive ${niche} approach that's working better than everything else`,
        `Why traditional ${niche} advice is dead wrong (and what actually works in 2025)`
      )
    }

    return { angles }
  }

  generateFallbackBonuses(productType, detailLevel = 'standard') {
    const bonuses = [
      {
        title: 'Quick Start Implementation Guide',
        description:
          'Get up and running immediately with our step-by-step quick start guide ($197 value)',
      },
      {
        title: 'Premium Templates & Resources',
        description:
          'Professional templates and resources to accelerate your progress ($297 value)',
      },
      {
        title: 'Private Community Access',
        description:
          'Exclusive access to our private community for ongoing support and networking ($497 value)',
      },
    ]

    if (detailLevel === 'detailed') {
      bonuses.push(
        {
          title: 'Master Class Video Series',
          description:
            'Exclusive video training series with advanced strategies and case studies ($597 value)',
        },
        {
          title: 'One-on-One Strategy Session',
          description:
            'Personal 60-minute strategy session to customize your action plan ($997 value)',
        },
        {
          title: 'Lifetime Updates & New Releases',
          description:
            'Get all future updates and new course releases at no additional cost ($1,497 value)',
        }
      )
    }

    return bonuses
  }

  generateFallbackLaunch(detailLevel = 'standard') {
    const sequence = [
      {
        day: 1,
        title: 'The Big Announcement',
        description:
          'Introduce the product with compelling origin story and transformation promise',
      },
      {
        day: 3,
        title: 'Problem/Solution Reveal',
        description:
          'Address the main pain points and reveal your unique solution approach',
      },
      {
        day: 5,
        title: 'Social Proof Showcase',
        description: 'Share success stories, testimonials, and case studies',
      },
      {
        day: 7,
        title: 'Cart Open + Early Bird',
        description:
          'Launch with limited-time early bird pricing for first 48 hours',
      },
      {
        day: 10,
        title: 'Final Call',
        description: 'Last chance messaging with urgency and scarcity elements',
      },
    ]

    if (detailLevel === 'detailed') {
      sequence.push(
        {
          day: 2,
          title: 'Behind the Scenes',
          description: 'Share the journey and development process',
        },
        {
          day: 4,
          title: 'Method Deep Dive',
          description: 'Detailed explanation of your unique methodology',
        },
        {
          day: 6,
          title: 'Objection Handling',
          description: 'Address common concerns and objections',
        },
        {
          day: 8,
          title: 'Bonus Reveals',
          description: 'Unveil special bonuses and limited-time offers',
        },
        {
          day: 9,
          title: 'Success Predictions',
          description: 'Show what success looks like for different user types',
        },
        {
          day: 11,
          title: 'FAQ Session',
          description: 'Live Q&A session addressing all questions',
        },
        {
          day: 12,
          title: 'Community Preview',
          description: 'Give a sneak peek of the private community',
        },
        {
          day: 13,
          title: 'Last 24 Hours',
          description: 'Final countdown with urgency messaging',
        },
        {
          day: 14,
          title: 'Final Final Call',
          description: 'Absolute last chance with countdown timer',
        }
      )
    }

    return { sequence }
  }

  generateFallbackSales(productType, niche, detailLevel = 'standard') {
    const headlines = [
      `Finally... The Complete System To Master ${
        niche.charAt(0).toUpperCase() + niche.slice(1)
      } (Even If You're Starting From Zero)`,
    ]

    const bulletPoints = [
      `The 'Foundation First' framework that ensures lasting success from day one`,
      `My secret implementation system that delivers results in record time`,
      `The psychology behind sustainable growth (and why most people get this wrong)`,
      `Real case studies showing exactly how others achieved breakthrough results`,
    ]

    if (detailLevel === 'detailed') {
      bulletPoints.push(
        `The exact tools and resources I use to stay ahead of 99% of the competition`,
        `My personal method for overcoming obstacles that stop most people cold`,
        `The insider strategies that industry experts charge $10,000+ to reveal`,
        `How to avoid the costly mistakes that drain time, money, and motivation`
      )
    }

    return {
      headline: headlines[0],
      subheadline: `Discover the proven step-by-step blueprint that's helped thousands transform their ${niche} results`,
      bulletPoints,
    }
  }

  generateFallbackTechnical(productType, detailLevel = 'standard') {
    const requirements = {
      course: [
        'Learning Management System (Teachable/Thinkific)',
        'Video hosting platform',
        'Email marketing system',
        'Payment processing',
      ],
      ebook: [
        'PDF creation software',
        'Email delivery system',
        'Payment processing',
        'Download delivery system',
      ],
      template: [
        'Design software access',
        'File hosting service',
        'Email delivery',
        'Payment processing',
      ],
      coaching: [
        'Video conferencing platform',
        'Scheduling system',
        'Client management system',
        'Payment processing',
      ],
      software: [
        'Web development framework',
        'Database system',
        'Cloud hosting',
        'Payment processing',
        'API integrations',
      ],
      mastermind: [
        'Community platform',
        'Video conferencing',
        'Event management system',
        'Payment processing',
      ],
      workshop: [
        'Live streaming platform',
        'Registration system',
        'Certificate generation',
        'Payment processing',
      ],
      membership: [
        'Membership platform',
        'Content management',
        'Community features',
        'Recurring billing system',
      ],
    }

    let reqs = requirements[productType] || [
      'Platform setup',
      'Payment processing',
      'Content delivery',
      'Customer management',
    ]

    if (detailLevel === 'detailed') {
      reqs.push(
        'Advanced analytics system',
        'Automation tools',
        'Customer support system'
      )
    }

    return { requirements: reqs }
  }

  generateFallbackRevenue(priceRange) {
    const revenue = {
      budget: {
        Conservative: '$3,900 (100 customers)',
        Realistic: '$9,750 (250 customers)',
        Optimistic: '$19,500 (500 customers)',
        'Monthly recurring potential': 'N/A for one-time product',
      },
      mid: {
        Conservative: '$29,700 (100 customers)',
        Realistic: '$74,250 (250 customers)',
        Optimistic: '$148,500 (500 customers)',
        'Monthly recurring potential': '$2,970 with add-on services',
      },
      premium: {
        Conservative: '$74,850 (50 customers)',
        Realistic: '$224,550 (150 customers)',
        Optimistic: '$449,100 (300 customers)',
        'Monthly recurring potential': '$14,970 with premium support',
      },
      elite: {
        Conservative: '$199,925 (25 customers)',
        Realistic: '$399,850 (50 customers)',
        Optimistic: '$799,700 (100 customers)',
        'Monthly recurring potential': '$39,985 with ongoing services',
      },
    }

    return revenue[priceRange]
  }

  // Test connection to AI service
  async testConnection() {
    try {
      const fetchFunction = global.fetch || (await import('node-fetch')).default

      const response = await fetchFunction(`${this.baseUrl}/models`, {
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
      throw new Error(`AI service connection test failed: ${error.message}`)
    }
  }

  // List available models
  async listAvailableModels() {
    try {
      const fetchFunction = global.fetch || (await import('node-fetch')).default

      const response = await fetchFunction(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json()
      return data.data.map((model) => ({
        id: model.id,
        created: model.created,
        owned_by: model.owned_by,
      }))
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`)
    }
  }
}

// Create and export singleton instance
const productService = new ProductService()
export default productService
