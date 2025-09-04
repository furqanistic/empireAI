// File: controllers/businessPlanController.js - COMPLETE WITH AI CHART GENERATION
import { createError } from '../error.js'
import BusinessPlan from '../models/BusinessPlan.js'
import groqService from '../services/groqService.js'

// Generate business plan with AI-generated charts
export const generateBusinessPlan = async (req, res, next) => {
  try {
    const { niche, businessModel, targetMarket, customContext } = req.body
    const userId = req.user.id

    // Basic validation
    if (!niche || !businessModel || !targetMarket) {
      return next(
        createError(
          400,
          'Niche, business model, and target market are required'
        )
      )
    }

    // Create initial business plan record
    const businessPlan = new BusinessPlan({
      user: userId,
      niche,
      businessModel,
      targetMarket,
      customContext: customContext || '',
      status: 'pending',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    })

    await businessPlan.save()

    try {
      // Generate business plan with AI (including chart data)
      const aiResult = await callGroqAPI(
        niche,
        businessModel,
        targetMarket,
        customContext
      )

      // Create structured plan with AI-generated chart data
      const structuredPlan = createStructuredPlan(
        aiResult.content,
        niche,
        businessModel
      )

      // Update business plan with results
      businessPlan.generatedPlan = structuredPlan
      businessPlan.tokenUsage = aiResult.usage
      businessPlan.processingTime = aiResult.processingTime
      businessPlan.modelUsed = aiResult.model
      businessPlan.status = 'completed'
      businessPlan.dataSource = 'ai_generated'

      await businessPlan.save()

      // Return success response
      res.status(200).json({
        status: 'success',
        data: {
          id: businessPlan._id,
          plan: structuredPlan,
          metadata: {
            niche,
            businessModel,
            targetMarket,
            customContext: customContext || null,
            processingTime: aiResult.processingTime,
            tokenUsage: aiResult.usage,
            dataSource: 'ai_generated',
          },
        },
      })
    } catch (aiError) {
      console.error('AI Generation Error:', aiError)

      // Update record with error
      businessPlan.status = 'failed'
      businessPlan.error = {
        message: aiError.message,
        code: 'AI_GENERATION_ERROR',
      }
      await businessPlan.save()

      // Return fallback plan with dynamic charts instead of error
      const fallbackPlan = createFallbackPlan(
        niche,
        businessModel,
        targetMarket
      )

      businessPlan.generatedPlan = fallbackPlan
      businessPlan.status = 'completed'
      businessPlan.dataSource = 'fallback'
      await businessPlan.save()

      res.status(200).json({
        status: 'success',
        data: {
          id: businessPlan._id,
          plan: fallbackPlan,
          metadata: {
            niche,
            businessModel,
            targetMarket,
            customContext: customContext || null,
            note: 'Generated using intelligent fallback data due to AI service issue',
            dataSource: 'fallback',
          },
        },
      })
    }
  } catch (error) {
    console.error('Business Plan Generation Error:', error)
    next(createError(500, 'Failed to generate business plan'))
  }
}

// Call GROQ API with enhanced prompt for chart data
const callGroqAPI = async (
  niche,
  businessModel,
  targetMarket,
  customContext
) => {
  const startTime = Date.now()

  const prompt = createPrompt(niche, businessModel, targetMarket, customContext)

  const response = await fetch(`${groqService.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqService.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: groqService.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a business strategy expert with deep knowledge of various industries and markets. Create comprehensive, realistic business plans with accurate market data, competitor analysis, and industry-specific insights. Use simple formatting without special characters or markdown. Provide specific, actionable data that reflects real market conditions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 3500,
      top_p: 0.9,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `GROQ API Error: ${response.status} - ${
        errorData.error?.message || 'Unknown error'
      }`
    )
  }

  const data = await response.json()
  const processingTime = Date.now() - startTime

  return {
    content: data.choices[0].message.content,
    usage: data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
    processingTime,
    model: groqService.model,
  }
}

// Enhanced AI prompt that requests chart data
const createPrompt = (niche, businessModel, targetMarket, customContext) => {
  const nicheNames = {
    fitness: 'Fitness & Health',
    tech: 'Technology & SaaS',
    finance: 'Finance & Investment',
    education: 'Education & Courses',
    ecommerce: 'E-commerce & Retail',
    food: 'Food & Beverage',
    travel: 'Travel & Hospitality',
    fashion: 'Fashion & Beauty',
    pets: 'Pet Care & Services',
    home: 'Home & Garden',
    entertainment: 'Entertainment & Gaming',
    creative: 'Creative & Art',
  }

  const modelNames = {
    saas: 'SaaS Platform',
    ecommerce: 'E-commerce Store',
    marketplace: 'Marketplace',
    coaching: 'Coaching/Consulting',
    subscription: 'Subscription Service',
    content: 'Content/Media',
  }

  const marketNames = {
    b2c: 'B2C (Business to Consumer)',
    b2b: 'B2B (Business to Business)',
    b2b2c: 'B2B2C (Business to Business to Consumer)',
  }

  return `Create a comprehensive business plan for: ${nicheNames[niche]} ${
    modelNames[businessModel]
  } targeting ${marketNames[targetMarket]}

${customContext ? `Additional Context: ${customContext}` : ''}

Please provide the following sections with EXACT formatting:

MARKET ANALYSIS:
Write 2-3 sentences about market size, growth trends, and opportunities specific to this niche and business model combination.

ROADMAP:
Month 1: [Milestone] - [Description]
Month 2: [Milestone] - [Description]
Month 3: [Milestone] - [Description]
Month 4: [Milestone] - [Description]
Month 5: [Milestone] - [Description]
Month 6: [Milestone] - [Description]
Month 7: [Milestone] - [Description]
Month 8: [Milestone] - [Description]
Month 9: [Milestone] - [Description]
Month 10: [Milestone] - [Description]
Month 11: [Milestone] - [Description]
Month 12: [Milestone] - [Description]

REVENUE PROJECTIONS:
Month 3: $X,XXX (+XX%)
Month 6: $X,XXX (+XX%)
Month 9: $X,XXX (+XX%)
Year 1: $XX,XXX (+XX%)
Year 2: $XXX,XXX (+XX%)
Year 3: $XXX,XXX (+XX%)

PRODUCT LINEUP:
Plan Name: Description - $XX/month
Plan Name: Description - $XX/month
Plan Name: Description - $XX/month
Plan Name: Description - $XX/month

MARKET SEGMENTS:
Segment Name: XX% - Description of this specific customer segment for ${
    nicheNames[niche]
  }
Segment Name: XX% - Description of this specific customer segment for ${
    nicheNames[niche]
  }
Segment Name: XX% - Description of this specific customer segment for ${
    nicheNames[niche]
  }
Segment Name: XX% - Description of this specific customer segment for ${
    nicheNames[niche]
  }

COMPETITIVE ANALYSIS:
Your Business: Market Share X%, Satisfaction XX%, Innovation XX%
[Real Competitor Name]: Market Share XX%, Satisfaction XX%, Innovation XX%
[Real Competitor Name]: Market Share XX%, Satisfaction XX%, Innovation XX%
[Real Competitor Name]: Market Share XX%, Satisfaction XX%, Innovation XX%
Other Players: Market Share XX%, Satisfaction XX%, Innovation XX%

Use real competitor names from the ${
    nicheNames[niche]
  } industry. Make all percentages realistic and ensure market segments total approximately 100% and market share totals around 100%. Base satisfaction and innovation scores on realistic industry benchmarks.`
}

// Enhanced parsing with comprehensive chart data extraction
const createStructuredPlan = (aiContent, niche, businessModel) => {
  console.log('AI Response Length:', aiContent.length)

  try {
    // Split into lines and clean
    const lines = aiContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    let marketAnalysis = ''
    const roadmapItems = []
    const revenueProjections = []
    const productLineup = []
    const marketSegments = []
    const competitiveAnalysis = []

    let currentSection = ''

    for (const line of lines) {
      const lowerLine = line.toLowerCase()

      // Detect sections
      if (lowerLine.includes('market analysis')) {
        currentSection = 'market'
        continue
      }
      if (lowerLine.includes('roadmap')) {
        currentSection = 'roadmap'
        continue
      }
      if (lowerLine.includes('revenue')) {
        currentSection = 'revenue'
        continue
      }
      if (
        lowerLine.includes('product lineup') ||
        (lowerLine.includes('product') && lowerLine.includes(':'))
      ) {
        currentSection = 'product'
        continue
      }
      if (
        lowerLine.includes('market segments') ||
        lowerLine.includes('segments')
      ) {
        currentSection = 'segments'
        continue
      }
      if (
        lowerLine.includes('competitive') ||
        lowerLine.includes('competition')
      ) {
        currentSection = 'competitive'
        continue
      }

      // Process content based on current section
      if (
        currentSection === 'market' &&
        line.length > 20 &&
        !line.includes(':') &&
        !lowerLine.includes('roadmap')
      ) {
        marketAnalysis += line + ' '
      }

      if (currentSection === 'roadmap' && roadmapItems.length < 12) {
        const roadmapMatch = line.match(
          /^.*?month\s*(\d+)[:\-\s]+([^:\-]+)[\-:]\s*(.+)/i
        )
        if (roadmapMatch && parseInt(roadmapMatch[1]) <= 12) {
          roadmapItems.push({
            milestone: roadmapMatch[2].trim(),
            description: roadmapMatch[3].trim(),
            position: roadmapItems.length + 1,
          })
        }
      }

      if (currentSection === 'revenue' && revenueProjections.length < 6) {
        const revenueMatch = line.match(
          /(month\s*\d+|year\s*\d+)[:\s]*(\$[\d,]+)[:\s]*\(([^)]+)\)/i
        )
        if (revenueMatch) {
          revenueProjections.push({
            period: revenueMatch[1].replace(/\s+/g, ' ').trim(),
            revenue: revenueMatch[2],
            growth: revenueMatch[3],
            position: revenueProjections.length + 1,
          })
        }
      }

      if (currentSection === 'product' && productLineup.length < 4) {
        const productMatch = line.match(
          /^([^:\-]+)[\-:]\s*([^$\-]+)[\-\s]*\$(\d+)/i
        )
        if (productMatch) {
          productLineup.push({
            name: productMatch[1].trim(),
            description: productMatch[2].trim(),
            price: `$${productMatch[3]}/month`,
            position: productLineup.length + 1,
          })
        }
      }

      if (currentSection === 'segments' && marketSegments.length < 4) {
        const segmentMatch = line.match(
          /^([^:\-]+)[\-:]\s*(\d+)%[:\s]*[\-\s]*(.+)/i
        )
        if (segmentMatch && parseInt(segmentMatch[2]) <= 100) {
          marketSegments.push({
            name: segmentMatch[1].trim(),
            percentage: parseInt(segmentMatch[2]),
            description: segmentMatch[3].trim(),
          })
        }
      }

      if (currentSection === 'competitive' && competitiveAnalysis.length < 5) {
        const compMatch = line.match(
          /^([^:\-]+)[\-:]\s*market\s*share\s*(\d+)%.*?satisfaction\s*(\d+)%.*?innovation\s*(\d+)%/i
        )
        if (compMatch) {
          competitiveAnalysis.push({
            company: compMatch[1].trim(),
            marketShare: parseInt(compMatch[2]),
            satisfaction: parseInt(compMatch[3]),
            innovation: parseInt(compMatch[4]),
          })
        }
      }
    }

    // Log parsing results
    console.log('Parsed Results:', {
      marketAnalysisLength: marketAnalysis.length,
      roadmapCount: roadmapItems.length,
      revenueCount: revenueProjections.length,
      productCount: productLineup.length,
      segmentsCount: marketSegments.length,
      competitiveCount: competitiveAnalysis.length,
    })

    // Create final plan with AI data + intelligent fallbacks
    return createFinalPlan(
      marketAnalysis.trim(),
      roadmapItems,
      revenueProjections,
      productLineup,
      marketSegments,
      competitiveAnalysis,
      niche,
      businessModel
    )
  } catch (error) {
    console.error('Parsing Error:', error)
    return createFallbackPlan(niche, businessModel, targetMarket)
  }
}

// Enhanced final plan creation with comprehensive chart data
const createFinalPlan = (
  marketAnalysis,
  roadmapItems,
  revenueProjections,
  productLineup,
  marketSegments,
  competitiveAnalysis,
  niche,
  businessModel
) => {
  const nicheNames = {
    fitness: 'Fitness & Health',
    tech: 'Technology & SaaS',
    finance: 'Finance & Investment',
    education: 'Education & Courses',
    ecommerce: 'E-commerce & Retail',
    food: 'Food & Beverage',
    travel: 'Travel & Hospitality',
    fashion: 'Fashion & Beauty',
    pets: 'Pet Care & Services',
    home: 'Home & Garden',
    entertainment: 'Entertainment & Gaming',
    creative: 'Creative & Art',
  }

  const modelNames = {
    saas: 'SaaS Platform',
    ecommerce: 'E-commerce Store',
    marketplace: 'Marketplace',
    coaching: 'Coaching/Consulting',
    subscription: 'Subscription Service',
    content: 'Content/Media',
  }

  // Apply intelligent fallbacks with minimum thresholds
  const plan = {
    title: `${nicheNames[niche]} ${modelNames[businessModel]}`,
    marketAnalysis:
      marketAnalysis && marketAnalysis.length > 50
        ? marketAnalysis
        : getDefaultMarketAnalysis(niche, businessModel),
    roadmap:
      roadmapItems.length >= 10
        ? roadmapItems.slice(0, 12)
        : getDefaultRoadmap(),
    revenueProjections:
      revenueProjections.length >= 4
        ? revenueProjections.slice(0, 6)
        : getDefaultRevenue(businessModel),
    productLineup:
      productLineup.length >= 3
        ? productLineup.slice(0, 4)
        : getDefaultProducts(businessModel),
    marketSegments:
      marketSegments.length >= 3
        ? marketSegments.slice(0, 4)
        : getDefaultSegments(niche),
    competitiveAnalysis:
      competitiveAnalysis.length >= 3
        ? competitiveAnalysis.slice(0, 5)
        : getDefaultCompetitive(niche),
  }

  return plan
}

// Niche-specific market segments with realistic data
const getDefaultSegments = (niche) => {
  const segmentMap = {
    fitness: [
      {
        name: 'Fitness Enthusiasts',
        percentage: 35,
        description:
          'Dedicated individuals focused on regular workouts and health tracking',
      },
      {
        name: 'Weight Loss Seekers',
        percentage: 25,
        description:
          'People primarily motivated by weight management and body transformation',
      },
      {
        name: 'Busy Professionals',
        percentage: 25,
        description:
          'Working adults seeking efficient, time-saving fitness solutions',
      },
      {
        name: 'Senior Health Focus',
        percentage: 15,
        description:
          'Older adults prioritizing mobility, strength, and overall wellness',
      },
    ],
    tech: [
      {
        name: 'Early Adopters',
        percentage: 20,
        description:
          'Tech-savvy users who embrace cutting-edge solutions and new technologies',
      },
      {
        name: 'Enterprise Clients',
        percentage: 40,
        description:
          'Large organizations needing scalable, secure business solutions',
      },
      {
        name: 'SMB Market',
        percentage: 30,
        description:
          'Small to medium businesses seeking cost-effective productivity tools',
      },
      {
        name: 'Individual Users',
        percentage: 10,
        description:
          'Personal users and freelancers with basic functionality needs',
      },
    ],
    finance: [
      {
        name: 'Young Professionals',
        percentage: 30,
        description:
          'Career-focused millennials building their financial foundation',
      },
      {
        name: 'High Net Worth',
        percentage: 25,
        description:
          'Affluent individuals with complex investment and wealth management needs',
      },
      {
        name: 'Retirement Planning',
        percentage: 30,
        description:
          'People aged 45+ focused on long-term retirement strategies',
      },
      {
        name: 'Beginner Investors',
        percentage: 15,
        description:
          'New investors learning about financial markets and investment basics',
      },
    ],
    education: [
      {
        name: 'Professional Development',
        percentage: 35,
        description:
          'Working professionals upgrading skills for career advancement',
      },
      {
        name: 'Career Changers',
        percentage: 25,
        description:
          'Individuals transitioning to new career paths or industries',
      },
      {
        name: 'Students & Recent Graduates',
        percentage: 25,
        description:
          'Current students and recent graduates enhancing their qualifications',
      },
      {
        name: 'Lifelong Learners',
        percentage: 15,
        description:
          'People pursuing knowledge for personal enrichment and curiosity',
      },
    ],
    ecommerce: [
      {
        name: 'Impulse Buyers',
        percentage: 30,
        description:
          'Shoppers motivated by deals, trending products, and social influence',
      },
      {
        name: 'Research-Heavy Buyers',
        percentage: 25,
        description:
          'Customers who thoroughly research and compare before purchasing',
      },
      {
        name: 'Brand Loyalists',
        percentage: 25,
        description:
          'Repeat customers with strong preferences for trusted brands',
      },
      {
        name: 'Price-Sensitive Shoppers',
        percentage: 20,
        description:
          'Budget-conscious consumers seeking maximum value and deals',
      },
    ],
    food: [
      {
        name: 'Health-Conscious Eaters',
        percentage: 35,
        description:
          'Consumers prioritizing nutrition, organic, and wellness-focused foods',
      },
      {
        name: 'Convenience Seekers',
        percentage: 30,
        description: 'Busy individuals wanting quick, easy meal solutions',
      },
      {
        name: 'Gourmet Enthusiasts',
        percentage: 20,
        description:
          'Food lovers seeking premium, artisanal, and unique culinary experiences',
      },
      {
        name: 'Budget Families',
        percentage: 15,
        description: 'Families looking for affordable, nutritious meal options',
      },
    ],
    travel: [
      {
        name: 'Adventure Travelers',
        percentage: 30,
        description:
          'Active travelers seeking unique experiences and outdoor activities',
      },
      {
        name: 'Luxury Travelers',
        percentage: 25,
        description:
          'Affluent customers wanting premium comfort and exclusive experiences',
      },
      {
        name: 'Budget Backpackers',
        percentage: 25,
        description:
          'Cost-conscious travelers maximizing experiences on minimal budgets',
      },
      {
        name: 'Business Travelers',
        percentage: 20,
        description:
          'Corporate travelers needing efficient, convenient travel solutions',
      },
    ],
    fashion: [
      {
        name: 'Trendy Millennials',
        percentage: 35,
        description:
          'Fashion-forward young adults following latest trends and social media',
      },
      {
        name: 'Professional Wardrobe',
        percentage: 25,
        description:
          'Working professionals seeking stylish, work-appropriate clothing',
      },
      {
        name: 'Sustainable Fashion',
        percentage: 25,
        description:
          'Environmentally conscious consumers choosing eco-friendly brands',
      },
      {
        name: 'Plus Size Market',
        percentage: 15,
        description:
          'Underserved market seeking stylish, well-fitting clothing options',
      },
    ],
    pets: [
      {
        name: 'Premium Pet Parents',
        percentage: 40,
        description:
          'Dedicated owners willing to spend on high-quality pet products and services',
      },
      {
        name: 'Health-Focused Owners',
        percentage: 30,
        description:
          'Pet parents prioritizing veterinary care and pet wellness',
      },
      {
        name: 'Convenience Seekers',
        percentage: 20,
        description:
          'Busy pet owners wanting easy, time-saving pet care solutions',
      },
      {
        name: 'Budget-Conscious Families',
        percentage: 10,
        description:
          'Families seeking affordable but reliable pet care options',
      },
    ],
    home: [
      {
        name: 'DIY Enthusiasts',
        percentage: 35,
        description:
          'Homeowners who enjoy hands-on projects and home improvements',
      },
      {
        name: 'Professional Services',
        percentage: 30,
        description:
          'Busy homeowners preferring to hire experts for home projects',
      },
      {
        name: 'Smart Home Adopters',
        percentage: 20,
        description:
          'Tech-savvy homeowners investing in automation and smart devices',
      },
      {
        name: 'Sustainable Living',
        percentage: 15,
        description:
          'Environmentally conscious homeowners choosing eco-friendly solutions',
      },
    ],
    entertainment: [
      {
        name: 'Casual Gamers',
        percentage: 40,
        description:
          'Mainstream audience enjoying accessible, easy-to-play entertainment',
      },
      {
        name: 'Hardcore Enthusiasts',
        percentage: 25,
        description:
          'Dedicated fans seeking premium, complex entertainment experiences',
      },
      {
        name: 'Social Players',
        percentage: 20,
        description:
          'Users who prefer multiplayer and social entertainment experiences',
      },
      {
        name: 'Mobile-First Users',
        percentage: 15,
        description:
          'Consumers primarily using mobile devices for entertainment consumption',
      },
    ],
    creative: [
      {
        name: 'Professional Creatives',
        percentage: 30,
        description:
          'Working artists, designers, and creators monetizing their skills',
      },
      {
        name: 'Hobbyist Artists',
        percentage: 35,
        description:
          'Recreational creators pursuing artistic interests in their spare time',
      },
      {
        name: 'Content Creators',
        percentage: 20,
        description:
          'Digital creators building audiences and monetizing content online',
      },
      {
        name: 'Art Collectors',
        percentage: 15,
        description:
          'Enthusiasts who appreciate and invest in creative works and art pieces',
      },
    ],
  }

  return (
    segmentMap[niche] || [
      {
        name: 'Primary Market',
        percentage: 40,
        description:
          'Main target audience with core product needs and high engagement',
      },
      {
        name: 'Secondary Market',
        percentage: 30,
        description:
          'Additional customer segment with related interests and moderate usage',
      },
      {
        name: 'Niche Enthusiasts',
        percentage: 20,
        description:
          'Specialized users with specific requirements and high loyalty',
      },
      {
        name: 'Emerging Segment',
        percentage: 10,
        description: 'Growing market with future potential and evolving needs',
      },
    ]
  )
}

// Industry-specific competitive analysis with real companies
const getDefaultCompetitive = (niche) => {
  const competitorMap = {
    fitness: [
      {
        company: 'Your Fitness Platform',
        marketShare: 5,
        satisfaction: 88,
        innovation: 92,
      },
      {
        company: 'MyFitnessPal',
        marketShare: 35,
        satisfaction: 75,
        innovation: 65,
      },
      {
        company: 'Fitbit Ecosystem',
        marketShare: 25,
        satisfaction: 78,
        innovation: 70,
      },
      {
        company: 'Nike Training Club',
        marketShare: 15,
        satisfaction: 82,
        innovation: 75,
      },
      {
        company: 'Other Fitness Apps',
        marketShare: 20,
        satisfaction: 68,
        innovation: 58,
      },
    ],
    tech: [
      {
        company: 'Your SaaS Solution',
        marketShare: 3,
        satisfaction: 90,
        innovation: 95,
      },
      {
        company: 'Microsoft 365',
        marketShare: 45,
        satisfaction: 72,
        innovation: 60,
      },
      {
        company: 'Google Workspace',
        marketShare: 25,
        satisfaction: 78,
        innovation: 68,
      },
      {
        company: 'Slack Technologies',
        marketShare: 17,
        satisfaction: 85,
        innovation: 78,
      },
      {
        company: 'Legacy Enterprise Systems',
        marketShare: 10,
        satisfaction: 55,
        innovation: 40,
      },
    ],
    finance: [
      {
        company: 'Your Fintech Platform',
        marketShare: 2,
        satisfaction: 89,
        innovation: 93,
      },
      {
        company: 'Traditional Banks',
        marketShare: 50,
        satisfaction: 65,
        innovation: 45,
      },
      {
        company: 'Charles Schwab',
        marketShare: 15,
        satisfaction: 80,
        innovation: 65,
      },
      {
        company: 'Robinhood',
        marketShare: 18,
        satisfaction: 75,
        innovation: 85,
      },
      {
        company: 'Other Investment Apps',
        marketShare: 15,
        satisfaction: 70,
        innovation: 60,
      },
    ],
    education: [
      {
        company: 'Your Learning Platform',
        marketShare: 4,
        satisfaction: 87,
        innovation: 90,
      },
      {
        company: 'Coursera',
        marketShare: 30,
        satisfaction: 78,
        innovation: 70,
      },
      { company: 'Udemy', marketShare: 25, satisfaction: 72, innovation: 65 },
      {
        company: 'LinkedIn Learning',
        marketShare: 20,
        satisfaction: 76,
        innovation: 68,
      },
      {
        company: 'Traditional Education',
        marketShare: 21,
        satisfaction: 60,
        innovation: 45,
      },
    ],
    ecommerce: [
      {
        company: 'Your E-commerce Store',
        marketShare: 2,
        satisfaction: 88,
        innovation: 92,
      },
      { company: 'Amazon', marketShare: 40, satisfaction: 78, innovation: 85 },
      {
        company: 'Shopify Merchants',
        marketShare: 25,
        satisfaction: 75,
        innovation: 70,
      },
      {
        company: 'Traditional Retailers',
        marketShare: 20,
        satisfaction: 65,
        innovation: 50,
      },
      {
        company: 'Other Online Stores',
        marketShare: 13,
        satisfaction: 70,
        innovation: 60,
      },
    ],
    food: [
      {
        company: 'Your Food Service',
        marketShare: 3,
        satisfaction: 85,
        innovation: 88,
      },
      {
        company: 'DoorDash',
        marketShare: 30,
        satisfaction: 70,
        innovation: 75,
      },
      {
        company: 'Uber Eats',
        marketShare: 25,
        satisfaction: 68,
        innovation: 72,
      },
      {
        company: 'Traditional Restaurants',
        marketShare: 35,
        satisfaction: 75,
        innovation: 55,
      },
      {
        company: 'Other Delivery Services',
        marketShare: 7,
        satisfaction: 65,
        innovation: 60,
      },
    ],
    travel: [
      {
        company: 'Your Travel Platform',
        marketShare: 2,
        satisfaction: 90,
        innovation: 95,
      },
      {
        company: 'Booking.com',
        marketShare: 35,
        satisfaction: 75,
        innovation: 65,
      },
      { company: 'Airbnb', marketShare: 25, satisfaction: 80, innovation: 85 },
      {
        company: 'Expedia Group',
        marketShare: 20,
        satisfaction: 70,
        innovation: 60,
      },
      {
        company: 'Traditional Travel Agencies',
        marketShare: 18,
        satisfaction: 65,
        innovation: 45,
      },
    ],
    fashion: [
      {
        company: 'Your Fashion Brand',
        marketShare: 3,
        satisfaction: 85,
        innovation: 90,
      },
      {
        company: 'Amazon Fashion',
        marketShare: 30,
        satisfaction: 70,
        innovation: 75,
      },
      { company: 'SHEIN', marketShare: 15, satisfaction: 65, innovation: 80 },
      {
        company: 'Traditional Retailers',
        marketShare: 35,
        satisfaction: 72,
        innovation: 55,
      },
      {
        company: 'Other Online Fashion',
        marketShare: 17,
        satisfaction: 68,
        innovation: 65,
      },
    ],
    pets: [
      {
        company: 'Your Pet Service',
        marketShare: 4,
        satisfaction: 88,
        innovation: 92,
      },
      { company: 'Chewy', marketShare: 35, satisfaction: 85, innovation: 75 },
      { company: 'Petco', marketShare: 25, satisfaction: 70, innovation: 60 },
      {
        company: 'PetSmart',
        marketShare: 20,
        satisfaction: 68,
        innovation: 58,
      },
      {
        company: 'Local Pet Stores',
        marketShare: 16,
        satisfaction: 75,
        innovation: 50,
      },
    ],
    home: [
      {
        company: 'Your Home Platform',
        marketShare: 3,
        satisfaction: 87,
        innovation: 90,
      },
      {
        company: 'Home Depot',
        marketShare: 30,
        satisfaction: 75,
        innovation: 65,
      },
      {
        company: 'Amazon Home Services',
        marketShare: 20,
        satisfaction: 72,
        innovation: 78,
      },
      { company: "Lowe's", marketShare: 25, satisfaction: 73, innovation: 62 },
      {
        company: 'Local Contractors',
        marketShare: 22,
        satisfaction: 70,
        innovation: 55,
      },
    ],
    entertainment: [
      {
        company: 'Your Entertainment App',
        marketShare: 2,
        satisfaction: 88,
        innovation: 95,
      },
      { company: 'Netflix', marketShare: 30, satisfaction: 80, innovation: 85 },
      { company: 'YouTube', marketShare: 25, satisfaction: 75, innovation: 80 },
      {
        company: 'Gaming Platforms',
        marketShare: 25,
        satisfaction: 78,
        innovation: 82,
      },
      {
        company: 'Traditional Media',
        marketShare: 18,
        satisfaction: 60,
        innovation: 45,
      },
    ],
    creative: [
      {
        company: 'Your Creative Platform',
        marketShare: 4,
        satisfaction: 89,
        innovation: 92,
      },
      {
        company: 'Adobe Creative Cloud',
        marketShare: 40,
        satisfaction: 75,
        innovation: 85,
      },
      { company: 'Canva', marketShare: 20, satisfaction: 85, innovation: 80 },
      {
        company: 'Etsy Marketplace',
        marketShare: 15,
        satisfaction: 78,
        innovation: 70,
      },
      {
        company: 'Other Creative Tools',
        marketShare: 21,
        satisfaction: 70,
        innovation: 65,
      },
    ],
  }

  return (
    competitorMap[niche] || [
      {
        company: 'Your Business',
        marketShare: 5,
        satisfaction: 85,
        innovation: 90,
      },
      {
        company: 'Industry Leader',
        marketShare: 40,
        satisfaction: 70,
        innovation: 60,
      },
      {
        company: 'Established Player',
        marketShare: 30,
        satisfaction: 68,
        innovation: 55,
      },
      {
        company: 'Emerging Competitor',
        marketShare: 15,
        satisfaction: 78,
        innovation: 75,
      },
      {
        company: 'Other Providers',
        marketShare: 10,
        satisfaction: 65,
        innovation: 50,
      },
    ]
  )
}

// Business model specific defaults
const getDefaultMarketAnalysis = (niche, businessModel) => {
  const nicheNames = {
    fitness: 'fitness and health',
    tech: 'technology and SaaS',
    finance: 'financial services',
    education: 'education and training',
    ecommerce: 'e-commerce and retail',
    food: 'food and beverage',
    travel: 'travel and hospitality',
    fashion: 'fashion and beauty',
    pets: 'pet care and services',
    home: 'home and garden',
    entertainment: 'entertainment and gaming',
    creative: 'creative and art',
  }

  const modelContext = {
    saas: 'cloud-based software solutions',
    ecommerce: 'online retail platforms',
    marketplace: 'multi-sided platform businesses',
    coaching: 'professional services and consulting',
    subscription: 'recurring revenue models',
    content: 'digital content and media',
  }

  return `The ${
    nicheNames[niche] || niche
  } market demonstrates robust growth potential with increasing digital adoption and evolving consumer preferences. This sector benefits from technological advancement and changing lifestyle patterns, creating substantial opportunities for innovative ${
    modelContext[businessModel] || businessModel
  } that deliver exceptional value, superior user experience, and address key market gaps with scalable solutions.`
}

const getDefaultRoadmap = () => [
  {
    milestone: 'Market Research & Validation',
    description:
      'Conduct comprehensive market research and validate product-market fit with target customers',
    position: 1,
  },
  {
    milestone: 'MVP Development',
    description:
      'Build minimum viable product with core features and essential functionality',
    position: 2,
  },
  {
    milestone: 'Beta Testing Program',
    description:
      'Launch beta version with select users and gather detailed feedback for improvements',
    position: 3,
  },
  {
    milestone: 'Brand Development',
    description:
      'Create comprehensive brand identity, messaging, and marketing materials',
    position: 4,
  },
  {
    milestone: 'Product Launch',
    description:
      'Official product launch with coordinated marketing campaign and PR outreach',
    position: 5,
  },
  {
    milestone: 'Customer Acquisition',
    description:
      'Focus on acquiring initial customers and optimizing conversion funnels',
    position: 6,
  },
  {
    milestone: 'Feature Enhancement',
    description:
      'Add advanced features and improvements based on user feedback and analytics',
    position: 7,
  },
  {
    milestone: 'Strategic Partnerships',
    description:
      'Establish key partnerships, integrations, and channel relationships',
    position: 8,
  },
  {
    milestone: 'Marketing Scale-up',
    description:
      'Expand marketing efforts across channels and increase advertising spend',
    position: 9,
  },
  {
    milestone: 'Team Expansion',
    description: 'Hire key team members and build operational infrastructure',
    position: 10,
  },
  {
    milestone: 'Growth Funding',
    description:
      'Secure Series A funding for accelerated growth and market expansion',
    position: 11,
  },
  {
    milestone: 'Market Expansion',
    description:
      'Expand to new geographic markets and additional customer segments',
    position: 12,
  },
]

const getDefaultRevenue = (businessModel) => {
  const revenueMap = {
    saas: [
      { period: 'Month 3', revenue: '$3,500', growth: '+180%', position: 1 },
      { period: 'Month 6', revenue: '$18,000', growth: '+414%', position: 2 },
      { period: 'Month 9', revenue: '$45,000', growth: '+150%', position: 3 },
      { period: 'Year 1', revenue: '$85,000', growth: '+89%', position: 4 },
      { period: 'Year 2', revenue: '$320,000', growth: '+276%', position: 5 },
      { period: 'Year 3', revenue: '$780,000', growth: '+144%', position: 6 },
    ],
    ecommerce: [
      { period: 'Month 3', revenue: '$4,200', growth: '+220%', position: 1 },
      { period: 'Month 6', revenue: '$22,000', growth: '+424%', position: 2 },
      { period: 'Month 9', revenue: '$48,000', growth: '+118%', position: 3 },
      { period: 'Year 1', revenue: '$95,000', growth: '+98%', position: 4 },
      { period: 'Year 2', revenue: '$285,000', growth: '+200%', position: 5 },
      { period: 'Year 3', revenue: '$620,000', growth: '+118%', position: 6 },
    ],
    coaching: [
      { period: 'Month 3', revenue: '$2,800', growth: '+133%', position: 1 },
      { period: 'Month 6', revenue: '$12,500', growth: '+346%', position: 2 },
      { period: 'Month 9', revenue: '$28,000', growth: '+124%', position: 3 },
      { period: 'Year 1', revenue: '$65,000', growth: '+132%', position: 4 },
      { period: 'Year 2', revenue: '$195,000', growth: '+200%', position: 5 },
      { period: 'Year 3', revenue: '$425,000', growth: '+118%', position: 6 },
    ],
  }

  return (
    revenueMap[businessModel] || [
      { period: 'Month 3', revenue: '$2,500', growth: '+150%', position: 1 },
      { period: 'Month 6', revenue: '$12,000', growth: '+380%', position: 2 },
      { period: 'Month 9', revenue: '$35,000', growth: '+192%', position: 3 },
      { period: 'Year 1', revenue: '$75,000', growth: '+114%', position: 4 },
      { period: 'Year 2', revenue: '$250,000', growth: '+233%', position: 5 },
      { period: 'Year 3', revenue: '$650,000', growth: '+160%', position: 6 },
    ]
  )
}

const getDefaultProducts = (businessModel) => {
  const productMap = {
    saas: [
      {
        name: 'Starter Plan',
        description:
          'Essential features for individuals and small teams with basic functionality',
        price: '$29/month',
        position: 1,
      },
      {
        name: 'Professional Plan',
        description:
          'Advanced features with priority support and enhanced analytics',
        price: '$79/month',
        position: 2,
      },
      {
        name: 'Enterprise Plan',
        description:
          'Complete solution with custom integrations and dedicated account management',
        price: '$199/month',
        position: 3,
      },
      {
        name: 'Premium Add-ons',
        description:
          'Additional modules and specialized features for power users',
        price: '$39/month',
        position: 4,
      },
    ],
    ecommerce: [
      {
        name: 'Basic Storefront',
        description: 'Essential e-commerce features for small online stores',
        price: '$39/month',
        position: 1,
      },
      {
        name: 'Growth Package',
        description: 'Advanced marketing tools and inventory management',
        price: '$89/month',
        position: 2,
      },
      {
        name: 'Enterprise Commerce',
        description: 'Full-featured platform with multi-channel integration',
        price: '$249/month',
        position: 3,
      },
      {
        name: 'Custom Solutions',
        description: 'Bespoke development and specialized integrations',
        price: '$99/month',
        position: 4,
      },
    ],
    coaching: [
      {
        name: '1-on-1 Coaching',
        description:
          'Personal coaching sessions with dedicated expert guidance',
        price: '$150/month',
        position: 1,
      },
      {
        name: 'Group Program',
        description: 'Small group coaching with peer learning and support',
        price: '$75/month',
        position: 2,
      },
      {
        name: 'Masterclass Access',
        description: 'Complete video course library and resources',
        price: '$49/month',
        position: 3,
      },
      {
        name: 'VIP Mentorship',
        description:
          'Intensive mentorship with unlimited access and priority support',
        price: '$299/month',
        position: 4,
      },
    ],
  }

  return (
    productMap[businessModel] || [
      {
        name: 'Starter Plan',
        description: 'Essential features for individuals and small teams',
        price: '$29/month',
        position: 1,
      },
      {
        name: 'Professional Plan',
        description: 'Advanced features with priority support and analytics',
        price: '$79/month',
        position: 2,
      },
      {
        name: 'Enterprise Plan',
        description:
          'Complete solution with custom integrations and dedicated support',
        price: '$199/month',
        position: 3,
      },
      {
        name: 'Premium Services',
        description: 'Additional consulting and specialized features',
        price: '$49/month',
        position: 4,
      },
    ]
  )
}

// Enhanced fallback plan creation with all chart data
const createFallbackPlan = (niche, businessModel, targetMarket) => {
  const nicheNames = {
    fitness: 'Fitness & Health',
    tech: 'Technology & SaaS',
    finance: 'Finance & Investment',
    education: 'Education & Courses',
    ecommerce: 'E-commerce & Retail',
    food: 'Food & Beverage',
    travel: 'Travel & Hospitality',
    fashion: 'Fashion & Beauty',
    pets: 'Pet Care & Services',
    home: 'Home & Garden',
    entertainment: 'Entertainment & Gaming',
    creative: 'Creative & Art',
  }

  const modelNames = {
    saas: 'SaaS Platform',
    ecommerce: 'E-commerce Store',
    marketplace: 'Marketplace',
    coaching: 'Coaching/Consulting',
    subscription: 'Subscription Service',
    content: 'Content/Media',
  }

  return {
    title: `${nicheNames[niche]} ${modelNames[businessModel]}`,
    marketAnalysis: getDefaultMarketAnalysis(niche, businessModel),
    roadmap: getDefaultRoadmap(),
    revenueProjections: getDefaultRevenue(businessModel),
    productLineup: getDefaultProducts(businessModel),
    marketSegments: getDefaultSegments(niche),
    competitiveAnalysis: getDefaultCompetitive(niche),
  }
}

// Get user's business plan history
export const getBusinessPlanHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const businessPlans = await BusinessPlan.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalPlans = await BusinessPlan.countDocuments({ user: userId })

    res.status(200).json({
      status: 'success',
      results: businessPlans.length,
      totalResults: totalPlans,
      totalPages: Math.ceil(totalPlans / limit),
      currentPage: page,
      data: { businessPlans },
    })
  } catch (error) {
    console.error('Get Business Plan History Error:', error)
    next(createError(500, 'Failed to retrieve business plan history'))
  }
}

// Get specific business plan by ID
export const getBusinessPlan = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const businessPlan = await BusinessPlan.findOne({ _id: id, user: userId })

    if (!businessPlan) {
      return next(createError(404, 'Business plan not found'))
    }

    res.status(200).json({
      status: 'success',
      data: { businessPlan },
    })
  } catch (error) {
    console.error('Get Business Plan Error:', error)
    next(createError(500, 'Failed to retrieve business plan'))
  }
}

// Mark business plan as downloaded
export const markAsDownloaded = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const businessPlan = await BusinessPlan.findOne({ _id: id, user: userId })

    if (!businessPlan) {
      return next(createError(404, 'Business plan not found'))
    }

    await businessPlan.markAsDownloaded()

    res.status(200).json({
      status: 'success',
      message: 'Business plan marked as downloaded',
      data: { businessPlan },
    })
  } catch (error) {
    console.error('Mark Downloaded Error:', error)
    next(createError(500, 'Failed to mark business plan as downloaded'))
  }
}

// Add feedback to a business plan
export const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params
    const { rating, feedback } = req.body
    const userId = req.user.id

    if (!rating || rating < 1 || rating > 5) {
      return next(createError(400, 'Rating must be between 1 and 5'))
    }

    const businessPlan = await BusinessPlan.findOne({ _id: id, user: userId })

    if (!businessPlan) {
      return next(createError(404, 'Business plan not found'))
    }

    await businessPlan.addFeedback(rating, feedback)

    res.status(200).json({
      status: 'success',
      message: 'Feedback added successfully',
      data: { businessPlan },
    })
  } catch (error) {
    console.error('Add Feedback Error:', error)
    next(createError(500, 'Failed to add feedback'))
  }
}

// Get user's business plan statistics
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const stats = await BusinessPlan.getUserStats(userId)
    const recentPlans = await BusinessPlan.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          ...stats,
          recentPlans,
          downloadRate:
            stats.totalGenerations > 0
              ? ((stats.totalDownloads / stats.totalGenerations) * 100).toFixed(
                  1
                )
              : 0,
        },
      },
    })
  } catch (error) {
    console.error('Get User Stats Error:', error)
    next(createError(500, 'Failed to retrieve user statistics'))
  }
}

// Delete a business plan
export const deleteBusinessPlan = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const businessPlan = await BusinessPlan.findOneAndDelete({
      _id: id,
      user: userId,
    })

    if (!businessPlan) {
      return next(createError(404, 'Business plan not found'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Business plan deleted successfully',
    })
  } catch (error) {
    console.error('Delete Business Plan Error:', error)
    next(createError(500, 'Failed to delete business plan'))
  }
}

// Admin: Get niche analytics
export const getNicheAnalytics = async (req, res, next) => {
  try {
    const analytics = await BusinessPlan.getNicheAnalytics()

    res.status(200).json({
      status: 'success',
      data: { analytics },
    })
  } catch (error) {
    console.error('Get Niche Analytics Error:', error)
    next(createError(500, 'Failed to retrieve niche analytics'))
  }
}

// Admin: Get all business plans
export const getAllBusinessPlans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const businessPlans = await BusinessPlan.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalPlans = await BusinessPlan.countDocuments()

    res.status(200).json({
      status: 'success',
      results: businessPlans.length,
      totalResults: totalPlans,
      totalPages: Math.ceil(totalPlans / limit),
      currentPage: page,
      data: { businessPlans },
    })
  } catch (error) {
    console.error('Get All Business Plans Error:', error)
    next(createError(500, 'Failed to retrieve all business plans'))
  }
}
