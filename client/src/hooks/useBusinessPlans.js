// File: client/src/hooks/useBusinessPlans.js - ENHANCED DOWNLOAD FUNCTIONALITY

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { businessPlanService } from '../services/businessPlanServices.js'

// All existing hooks remain the same...
export const useGenerateBusinessPlan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: businessPlanService.generateBusinessPlan,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'stats'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate business plan'
      console.error('Business plan generation error:', error)
    },
  })
}

// Enhanced download hook with PDF generation
export const useDownloadBusinessPlan = () => {
  const markAsDownloaded = useMarkAsDownloaded()

  const downloadBusinessPlan = async (businessPlan, format = 'pdf') => {
    try {
      let blob, filename

      switch (format) {
        case 'pdf':
          blob = await generatePDF(businessPlan)
          filename = `${businessPlan.title.replace(
            /\s+/g,
            '_'
          )}_Business_Plan.pdf`
          break

        case 'html':
          blob = generateHTML(businessPlan)
          filename = `${businessPlan.title.replace(
            /\s+/g,
            '_'
          )}_Business_Plan.html`
          break

        case 'json':
          blob = generateJSON(businessPlan)
          filename = `${businessPlan.title.replace(
            /\s+/g,
            '_'
          )}_Business_Plan.json`
          break

        case 'markdown':
          blob = generateMarkdown(businessPlan)
          filename = `${businessPlan.title.replace(
            /\s+/g,
            '_'
          )}_Business_Plan.md`
          break

        default:
          blob = generateHTML(businessPlan) // Default to HTML
          filename = `${businessPlan.title.replace(
            /\s+/g,
            '_'
          )}_Business_Plan.html`
      }

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Track the download
      markAsDownloaded.mutate({ id: businessPlan._id || businessPlan.id })

      return { success: true, format, filename }
    } catch (error) {
      console.error('Failed to download business plan:', error)
      return { success: false, error: 'Failed to download business plan' }
    }
  }

  return {
    downloadPlan: downloadBusinessPlan,
    isLoading: markAsDownloaded.isPending,
  }
}

// Generate PDF using jsPDF (you'll need to install: npm install jspdf html2canvas)
const generatePDF = async (businessPlan) => {
  // Import jsPDF dynamically to avoid SSR issues
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add text with word wrap
  const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(...color)

    const lines = doc.splitTextToSize(text, contentWidth)

    // Check if we need a new page
    if (yPosition + lines.length * fontSize * 0.35 > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }

    doc.text(lines, margin, yPosition)
    yPosition += lines.length * fontSize * 0.35 + 5
  }

  // Helper function to add section separator
  const addSeparator = () => {
    yPosition += 5
    doc.setDrawColor(212, 175, 55) // Gold color
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
  }

  // Title Page
  addText(businessPlan.title, 24, true, [212, 175, 55])

  addSeparator()

  // Executive Summary / Market Analysis
  addText('MARKET ANALYSIS', 16, true, [212, 175, 55])
  addText(businessPlan.marketAnalysis, 12)
  addSeparator()

  // Revenue Projections
  addText('REVENUE PROJECTIONS', 16, true, [212, 175, 55])
  businessPlan.revenueProjections.forEach((projection) => {
    addText(
      `${projection.period}: ${projection.revenue} (${projection.growth})`,
      12,
      true
    )
  })
  addSeparator()

  // Product Lineup
  addText('PRODUCT LINEUP', 16, true, [212, 175, 55])
  businessPlan.productLineup.forEach((product, index) => {
    addText(`${index + 1}. ${product.name} - ${product.price}`, 12, true)
    addText(product.description, 11)
    yPosition += 3
  })
  addSeparator()

  // Market Segments (if available)
  if (businessPlan.marketSegments && businessPlan.marketSegments.length > 0) {
    addText('MARKET SEGMENTS', 16, true, [212, 175, 55])
    businessPlan.marketSegments.forEach((segment) => {
      addText(`${segment.name} (${segment.percentage}%)`, 12, true)
      addText(segment.description, 11)
      yPosition += 3
    })
    addSeparator()
  }

  // Competitive Analysis (if available)
  if (
    businessPlan.competitiveAnalysis &&
    businessPlan.competitiveAnalysis.length > 0
  ) {
    addText('COMPETITIVE LANDSCAPE', 16, true, [212, 175, 55])
    businessPlan.competitiveAnalysis.forEach((competitor) => {
      addText(
        `${competitor.company}: ${competitor.marketShare}% market share, ${competitor.satisfaction}% satisfaction, ${competitor.innovation}% innovation`,
        11
      )
    })
    addSeparator()
  }

  // Roadmap
  addText('12-MONTH ROADMAP', 16, true, [212, 175, 55])
  businessPlan.roadmap.forEach((milestone, index) => {
    addText(`Month ${index + 1}: ${milestone.milestone}`, 12, true)
    addText(milestone.description, 11)
    yPosition += 3
  })

  // Footer
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)

  return new Blob([doc.output('blob')], { type: 'application/pdf' })
}

// Generate styled HTML
const generateHTML = (businessPlan) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessPlan.title} - Business Plan</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        h1 {
            color: #D4AF37;
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 10px;
            border-bottom: 3px solid #D4AF37;
            padding-bottom: 10px;
        }
        h2 {
            color: #D4AF37;
            border-left: 4px solid #D4AF37;
            padding-left: 15px;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 20px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
        .revenue-item, .product-item, .segment-item, .milestone-item {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #D4AF37;
            border-radius: 4px;
        }
        .revenue-item strong {
            color: #27ae60;
            font-size: 1.1em;
        }
        .competitive-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .competitive-table th, .competitive-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .competitive-table th {
            background: #D4AF37;
            color: white;
        }
        .competitive-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
        .chart-placeholder {
            background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
            padding: 30px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${businessPlan.title}</h1>
        <div class="subtitle">AI-Generated Business Plan • ${new Date().toLocaleDateString()}</div>
        
        <h2>Market Analysis</h2>
        <p>${businessPlan.marketAnalysis}</p>
        
        <h2>Revenue Projections</h2>
        ${businessPlan.revenueProjections
          .map(
            (item) => `
            <div class="revenue-item">
                <strong>${item.period}:</strong> ${item.revenue} <span style="color: #27ae60;">(${item.growth})</span>
            </div>
        `
          )
          .join('')}
        
        <h2>Product Lineup</h2>
        ${businessPlan.productLineup
          .map(
            (product, index) => `
            <div class="product-item">
                <h3>${product.name} - ${product.price}</h3>
                <p>${product.description}</p>
            </div>
        `
          )
          .join('')}
        
        ${
          businessPlan.marketSegments && businessPlan.marketSegments.length > 0
            ? `
        <h2>Market Segments</h2>
        ${businessPlan.marketSegments
          .map(
            (segment) => `
            <div class="segment-item">
                <h3>${segment.name} (${segment.percentage}%)</h3>
                <p>${segment.description}</p>
            </div>
        `
          )
          .join('')}
        `
            : ''
        }
        
        ${
          businessPlan.competitiveAnalysis &&
          businessPlan.competitiveAnalysis.length > 0
            ? `
        <h2>Competitive Landscape</h2>
        <table class="competitive-table">
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Market Share</th>
                    <th>Satisfaction</th>
                    <th>Innovation</th>
                </tr>
            </thead>
            <tbody>
                ${businessPlan.competitiveAnalysis
                  .map(
                    (comp) => `
                    <tr>
                        <td>${comp.company}</td>
                        <td>${comp.marketShare}%</td>
                        <td>${comp.satisfaction}%</td>
                        <td>${comp.innovation}%</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
        `
            : ''
        }
        
        <h2>12-Month Roadmap</h2>
        ${businessPlan.roadmap
          .map(
            (milestone, index) => `
            <div class="milestone-item">
                <h3>Month ${index + 1}: ${milestone.milestone}</h3>
                <p>${milestone.description}</p>
            </div>
        `
          )
          .join('')}
        
        <div class="footer">
            Generated by Ascend AI Business Plan Builder<br>
            This document contains AI-generated content and strategic insights.
        </div>
    </div>
</body>
</html>`

  return new Blob([html], { type: 'text/html' })
}

// Generate structured JSON
const generateJSON = (businessPlan) => {
  const jsonData = {
    meta: {
      title: businessPlan.title,
      generatedAt: new Date().toISOString(),
      generator: 'Ascend AI Business Plan Builder',
    },
    plan: businessPlan,
  }

  return new Blob([JSON.stringify(jsonData, null, 2)], {
    type: 'application/json',
  })
}

// Generate Markdown
const generateMarkdown = (businessPlan) => {
  const markdown = `# ${businessPlan.title}

*AI-Generated Business Plan • ${new Date().toLocaleDateString()}*

## Market Analysis

${businessPlan.marketAnalysis}

## Revenue Projections

${businessPlan.revenueProjections
  .map((item) => `- **${item.period}**: ${item.revenue} *(${item.growth})*`)
  .join('\n')}

## Product Lineup

${businessPlan.productLineup
  .map(
    (product, index) =>
      `### ${product.name} - ${product.price}
${product.description}`
  )
  .join('\n\n')}

${
  businessPlan.marketSegments && businessPlan.marketSegments.length > 0
    ? `
## Market Segments

${businessPlan.marketSegments
  .map(
    (segment) =>
      `### ${segment.name} (${segment.percentage}%)
${segment.description}`
  )
  .join('\n\n')}
`
    : ''
}

${
  businessPlan.competitiveAnalysis &&
  businessPlan.competitiveAnalysis.length > 0
    ? `
## Competitive Landscape

| Company | Market Share | Satisfaction | Innovation |
|---------|--------------|--------------|------------|
${businessPlan.competitiveAnalysis
  .map(
    (comp) =>
      `| ${comp.company} | ${comp.marketShare}% | ${comp.satisfaction}% | ${comp.innovation}% |`
  )
  .join('\n')}
`
    : ''
}

## 12-Month Roadmap

${businessPlan.roadmap
  .map(
    (milestone, index) =>
      `### Month ${index + 1}: ${milestone.milestone}
${milestone.description}`
  )
  .join('\n\n')}

---
*Generated by Ascend AI Business Plan Builder*`

  return new Blob([markdown], { type: 'text/markdown' })
}

// Keep all other existing hooks unchanged...
export const useBusinessPlanHistory = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'history', params],
    queryFn: () => businessPlanService.getBusinessPlanHistory(params),
    enabled,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

export const useBusinessPlanStats = (enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'stats'],
    queryFn: businessPlanService.getUserStats,
    enabled,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  })
}

export const useBusinessPlan = (id, enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'plan', id],
    queryFn: () => businessPlanService.getBusinessPlan(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

export const useMarkAsDownloaded = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => businessPlanService.markAsDownloaded(id),
    onSuccess: (data, variables) => {
      console.log('Business plan marked as downloaded')
      queryClient.invalidateQueries({
        queryKey: ['businessPlans', 'plan', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to mark business plan as downloaded:', error)
    },
  })
}

export const useAddBusinessPlanFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rating, feedback }) =>
      businessPlanService.addFeedback(id, { rating, feedback }),
    onSuccess: (data, variables) => {
      console.log('Feedback added successfully')
      queryClient.invalidateQueries({
        queryKey: ['businessPlans', 'plan', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'history'] })
    },
    onError: (error) => {
      console.error('Failed to add feedback:', error)
    },
  })
}

export const useDeleteBusinessPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: businessPlanService.deleteBusinessPlan,
    onSuccess: (data, deletedId) => {
      console.log('Business plan deleted')
      queryClient.removeQueries({
        queryKey: ['businessPlans', 'plan', deletedId],
      })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to delete business plan:', error)
    },
  })
}

export const useNicheAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'admin', 'analytics'],
    queryFn: businessPlanService.getNicheAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  })
}

export const useAllBusinessPlans = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'admin', 'all', params],
    queryFn: () => businessPlanService.getAllBusinessPlans(params),
    enabled,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

export const useBusinessPlanHealthCheck = () => {
  return useQuery({
    queryKey: ['businessPlans', 'health'],
    queryFn: businessPlanService.healthCheck,
    staleTime: 30 * 1000,
    cacheTime: 60 * 1000,
    retry: 1,
  })
}
