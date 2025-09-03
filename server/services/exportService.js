// File: server/services/exportService.js - FIXED PDF generation for continuous flow
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import { createError } from '../error.js'

class ExportService {
  constructor() {
    this.brandColor = '#D4AF37'
    this.darkColor = '#1E1E21'
    this.textColor = '#EDEDED'
  }

  // Main export function
  async exportProduct(productData, generationId, format, userEmail) {
    try {
      console.log(`📤 Starting export: ${format} for user: ${userEmail}`)

      switch (format) {
        case 'pdf':
          return await this.generatePDF(productData, generationId, userEmail)
        case 'xlsx':
          return await this.generateExcel(productData, generationId, userEmail)
        case 'docx':
          return await this.generateWordAsRichText(
            productData,
            generationId,
            userEmail
          )
        case 'pptx':
          return await this.generatePresentationAsRichText(
            productData,
            generationId,
            userEmail
          )
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error(`Export failed for format ${format}:`, error)
      throw error
    }
  }

  // FIXED PDF Generation - Continuous flow without unnecessary page breaks
  async generatePDF(productData, generationId, userEmail) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Creating PDF document...')

        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          info: {
            Title: `Product Blueprint - ${productData.title}`,
            Author: 'AI Product Generator',
            Subject: 'Digital Product Business Plan',
            Keywords: 'business plan, digital product, blueprint',
            Creator: 'AI Product Generator',
            Producer: 'AI Product Generator',
          },
        })

        const chunks = []

        doc.on('data', (chunk) => {
          chunks.push(chunk)
        })

        doc.on('end', () => {
          const buffer = Buffer.concat(chunks)
          console.log(`✅ PDF generated successfully - ${buffer.length} bytes`)
          resolve({
            buffer,
            filename: `${this.sanitizeFilename(
              productData.title
            )}-blueprint-${generationId}.pdf`,
            contentType: 'application/pdf',
          })
        })

        doc.on('error', (error) => {
          console.error('PDF generation error:', error)
          reject(error)
        })

        // Generate PDF content with continuous flow
        this.addContinuousPDFContent(doc, productData, generationId, userEmail)

        // IMPORTANT: End the document
        doc.end()
      } catch (error) {
        console.error('PDF creation error:', error)
        reject(error)
      }
    })
  }

  // FIXED: Continuous PDF content without forced page breaks

  addContinuousPDFContent(doc, productData, generationId, userEmail) {
    try {
      const pageWidth = doc.page.width
      const margin = doc.page.margins.left
      const pageHeight = doc.page.height
      const bottomMargin = doc.page.margins.bottom

      console.log('🔄 Adding optimized PDF content...')

      let currentY = 60

      // Helper function to check if we need a new page
      const checkPageSpace = (neededSpace = 60) => {
        if (currentY + neededSpace > pageHeight - bottomMargin) {
          doc.addPage()
          currentY = 50
        }
      }

      // Helper function to add section header
      const addSectionHeader = (title, spacing = 20) => {
        checkPageSpace(50)
        currentY += spacing

        doc
          .fontSize(16)
          .fillColor('#D4AF37')
          .font('Helvetica-Bold')
          .text(title.toUpperCase(), margin, currentY)

        currentY += 25
      }

      // Helper function to add normal text with minimal spacing
      const addText = (
        text,
        fontSize = 10,
        color = '#000000',
        options = {}
      ) => {
        if (!text) return

        const textHeight = doc.heightOfString(text, {
          width: pageWidth - 2 * margin,
          ...options,
        })

        checkPageSpace(textHeight + 10)

        doc
          .fontSize(fontSize)
          .fillColor(color)
          .font('Helvetica')
          .text(text, margin, currentY, {
            width: pageWidth - 2 * margin,
            align: 'left',
            ...options,
          })

        currentY += textHeight + 10
      }

      // Clean Cover Section - No metadata
      doc
        .fontSize(24)
        .fillColor('#D4AF37')
        .font('Helvetica-Bold')
        .text('DIGITAL PRODUCT BLUEPRINT', margin, currentY, {
          align: 'center',
        })

      currentY += 30

      doc
        .fontSize(18)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(productData.title || 'Untitled Product', margin, currentY, {
          align: 'center',
          width: pageWidth - 2 * margin,
        })

      currentY += 40

      // Overview Section
      if (productData.overview) {
        addSectionHeader('Executive Summary')
        addText(productData.overview, 10, '#000000', { align: 'justify' })
      }

      // Product Structure Section - Compact format
      if (productData.outline?.modules?.length > 0) {
        addSectionHeader('Product Structure')

        productData.outline.modules.forEach((module, index) => {
          checkPageSpace(60)

          doc
            .fontSize(12)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text(`Module ${index + 1}: ${module.title}`, margin, currentY)

          currentY += 18

          // Module description - tighter spacing
          if (module.description) {
            doc
              .fontSize(9)
              .fillColor('#666666')
              .font('Helvetica')
              .text(module.description, margin + 15, currentY, {
                width: pageWidth - 2 * margin - 15,
              })
            currentY +=
              doc.heightOfString(module.description, {
                width: pageWidth - 2 * margin - 15,
              }) + 8
          }

          // Module lessons - very compact
          if (module.lessons?.length > 0) {
            module.lessons.forEach((lesson) => {
              checkPageSpace(15)

              doc
                .fontSize(8)
                .fillColor('#000000')
                .font('Helvetica')
                .text(`• ${lesson}`, margin + 25, currentY)

              currentY += 12
            })
          }

          currentY += 8 // Minimal spacing between modules
        })
      }

      // Pricing Section - Compact
      if (productData.pricing) {
        addSectionHeader('Pricing Strategy')

        if (productData.pricing.mainPrice) {
          checkPageSpace(40)

          doc
            .fontSize(18)
            .fillColor('#D4AF37')
            .font('Helvetica-Bold')
            .text(productData.pricing.mainPrice, margin, currentY)

          currentY += 25
        }

        if (productData.pricing.strategy) {
          addText(productData.pricing.strategy, 10, '#000000', {
            align: 'justify',
          })
        }

        if (productData.pricing.paymentPlans?.length > 0) {
          checkPageSpace(40)

          doc
            .fontSize(11)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text('Payment Options:', margin, currentY)

          currentY += 15

          productData.pricing.paymentPlans.forEach((plan) => {
            checkPageSpace(12)

            doc
              .fontSize(9)
              .fillColor('#000000')
              .font('Helvetica')
              .text(`• ${plan}`, margin + 15, currentY)

            currentY += 12
          })

          currentY += 10
        }
      }

      // Marketing Section - Streamlined
      if (productData.marketing?.angles?.length > 0) {
        addSectionHeader('Marketing Strategy')

        productData.marketing.angles.forEach((angle, index) => {
          checkPageSpace(40)

          doc
            .fontSize(10)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text(`${index + 1}. `, margin, currentY)

          doc
            .fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text(angle, margin + 20, currentY, {
              width: pageWidth - 2 * margin - 20,
            })

          currentY +=
            doc.heightOfString(angle, { width: pageWidth - 2 * margin - 20 }) +
            8
        })
      }

      // Bonuses Section - Compact
      if (productData.bonuses?.length > 0) {
        addSectionHeader('Bonus Offerings')

        productData.bonuses.forEach((bonus, index) => {
          checkPageSpace(35)

          doc
            .fontSize(11)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${bonus.title}`, margin, currentY)

          currentY += 15

          if (bonus.description) {
            doc
              .fontSize(9)
              .fillColor('#000000')
              .font('Helvetica')
              .text(bonus.description, margin + 15, currentY, {
                width: pageWidth - 2 * margin - 15,
              })
            currentY +=
              doc.heightOfString(bonus.description, {
                width: pageWidth - 2 * margin - 15,
              }) + 8
          }
        })
      }

      // Launch Sequence Section - Streamlined
      if (productData.launch?.sequence?.length > 0) {
        addSectionHeader('Launch Timeline')

        productData.launch.sequence.forEach((step) => {
          checkPageSpace(30)

          doc
            .fontSize(10)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text(`Day ${step.day}: ${step.title}`, margin, currentY)

          currentY += 12

          if (step.description) {
            doc
              .fontSize(9)
              .fillColor('#000000')
              .font('Helvetica')
              .text(step.description, margin + 15, currentY, {
                width: pageWidth - 2 * margin - 15,
              })
            currentY +=
              doc.heightOfString(step.description, {
                width: pageWidth - 2 * margin - 15,
              }) + 6
          }
        })
      }

      // Sales Copy Section - Compact
      if (productData.sales) {
        addSectionHeader('Sales Copy')

        if (productData.sales.headline) {
          checkPageSpace(30)

          doc
            .fontSize(12)
            .fillColor('#D4AF37')
            .font('Helvetica-Bold')
            .text(productData.sales.headline, margin, currentY, {
              width: pageWidth - 2 * margin,
            })

          currentY +=
            doc.heightOfString(productData.sales.headline, {
              width: pageWidth - 2 * margin,
            }) + 12
        }

        if (productData.sales.subheadline) {
          addText(productData.sales.subheadline, 10, '#333333')
        }

        if (productData.sales.bulletPoints?.length > 0) {
          checkPageSpace(30)

          doc
            .fontSize(10)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text('Key Benefits:', margin, currentY)

          currentY += 15

          productData.sales.bulletPoints.forEach((point) => {
            checkPageSpace(12)

            doc
              .fontSize(9)
              .fillColor('#000000')
              .font('Helvetica')
              .text(`• ${point}`, margin + 15, currentY)

            currentY += 12
          })

          currentY += 8
        }
      }

      // Technical Requirements - Compact
      if (productData.technical?.requirements?.length > 0) {
        addSectionHeader('Technical Requirements')

        productData.technical.requirements.forEach((requirement) => {
          checkPageSpace(12)

          doc
            .fontSize(9)
            .fillColor('#000000')
            .font('Helvetica')
            .text(`• ${requirement}`, margin + 15, currentY)

          currentY += 12
        })

        currentY += 8
      }

      // Revenue Projections Section - Compact table format
      if (productData.revenue) {
        addSectionHeader('Revenue Projections')

        Object.entries(productData.revenue).forEach(([key, value]) => {
          checkPageSpace(20)

          doc
            .fontSize(10)
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .text(`${key}:`, margin, currentY)

          doc
            .fontSize(11)
            .fillColor('#D4AF37')
            .font('Helvetica-Bold')
            .text(value, margin + 180, currentY)

          currentY += 18
        })
      }

      console.log('✅ Optimized PDF content added successfully')
    } catch (error) {
      console.error('Error adding PDF content:', error)
      throw error
    }
  }

  // Keep all other methods the same (generateExcel, generateWordAsRichText, etc.)
  async generateExcel(productData, generationId, userEmail) {
    try {
      console.log('🔄 Creating Excel workbook...')

      const workbook = new ExcelJS.Workbook()

      workbook.creator = 'AI Product Generator'
      workbook.lastModifiedBy = userEmail
      workbook.created = new Date()
      workbook.modified = new Date()

      // Overview Sheet
      const overviewSheet = workbook.addWorksheet('Product Overview')
      this.addExcelOverview(overviewSheet, productData, generationId)

      // Financial Sheet
      if (productData.pricing || productData.revenue) {
        const financialSheet = workbook.addWorksheet('Financial Model')
        this.addExcelFinancials(financialSheet, productData)
      }

      // Marketing Sheet
      if (productData.marketing?.angles?.length > 0) {
        const marketingSheet = workbook.addWorksheet('Marketing Strategy')
        this.addExcelMarketing(marketingSheet, productData)
      }

      // Product Structure Sheet
      if (productData.outline?.modules?.length > 0) {
        const structureSheet = workbook.addWorksheet('Product Structure')
        this.addExcelStructure(structureSheet, productData)
      }

      const buffer = await workbook.xlsx.writeBuffer()

      console.log(`✅ Excel generated successfully - ${buffer.length} bytes`)

      return {
        buffer,
        filename: `${this.sanitizeFilename(
          productData.title
        )}-blueprint-${generationId}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    } catch (error) {
      console.error('Excel generation error:', error)
      throw error
    }
  }

  addExcelOverview(worksheet, productData, generationId) {
    // Header styling
    worksheet.getCell('A1').value = 'DIGITAL PRODUCT BLUEPRINT'
    worksheet.getCell('A1').font = {
      size: 16,
      bold: true,
      color: { argb: 'FFD4AF37' },
    }
    worksheet.getCell('A1').alignment = { horizontal: 'center' }
    worksheet.mergeCells('A1:D1')

    worksheet.getCell('A3').value = 'Product Title:'
    worksheet.getCell('A3').font = { bold: true }
    worksheet.getCell('B3').value = productData.title || 'Untitled'

    worksheet.getCell('A4').value = 'Generation ID:'
    worksheet.getCell('A4').font = { bold: true }
    worksheet.getCell('B4').value = generationId

    worksheet.getCell('A5').value = 'Created:'
    worksheet.getCell('A5').font = { bold: true }
    worksheet.getCell('B5').value = new Date().toLocaleDateString()

    worksheet.getCell('A7').value = 'Overview:'
    worksheet.getCell('A7').font = { bold: true }
    worksheet.getCell('A8').value =
      productData.overview || 'No overview available'
    worksheet.mergeCells('A8:D15')
    worksheet.getCell('A8').alignment = { wrapText: true, vertical: 'top' }

    // Style the worksheet
    worksheet.columns = [
      { width: 20 },
      { width: 30 },
      { width: 20 },
      { width: 30 },
    ]
  }

  addExcelFinancials(worksheet, productData) {
    worksheet.getCell('A1').value = 'FINANCIAL PROJECTIONS'
    worksheet.getCell('A1').font = { size: 14, bold: true }

    let row = 3

    if (productData.pricing) {
      worksheet.getCell(`A${row}`).value = 'PRICING STRATEGY'
      worksheet.getCell(`A${row}`).font = {
        bold: true,
        color: { argb: 'FFD4AF37' },
      }
      row += 2

      worksheet.getCell(`A${row}`).value = 'Main Price:'
      worksheet.getCell(`A${row}`).font = { bold: true }
      worksheet.getCell(`B${row}`).value =
        productData.pricing.mainPrice || 'N/A'
      row += 1

      worksheet.getCell(`A${row}`).value = 'Strategy:'
      worksheet.getCell(`A${row}`).font = { bold: true }
      worksheet.getCell(`B${row}`).value = productData.pricing.strategy || 'N/A'
      worksheet.mergeCells(`B${row}:D${row}`)
      worksheet.getCell(`B${row}`).alignment = { wrapText: true }
      row += 3
    }

    if (productData.revenue) {
      worksheet.getCell(`A${row}`).value = 'REVENUE PROJECTIONS'
      worksheet.getCell(`A${row}`).font = {
        bold: true,
        color: { argb: 'FFD4AF37' },
      }
      row += 2

      Object.entries(productData.revenue).forEach(([key, value]) => {
        worksheet.getCell(`A${row}`).value = key
        worksheet.getCell(`A${row}`).font = { bold: true }
        worksheet.getCell(`B${row}`).value = value
        row++
      })
    }
  }

  addExcelMarketing(worksheet, productData) {
    worksheet.getCell('A1').value = 'MARKETING STRATEGY'
    worksheet.getCell('A1').font = { size: 14, bold: true }

    let row = 3
    worksheet.getCell(`A${row}`).value = 'Marketing Angles:'
    worksheet.getCell(`A${row}`).font = { bold: true }
    row += 2

    productData.marketing.angles.forEach((angle, index) => {
      worksheet.getCell(`A${row}`).value = `Angle ${index + 1}:`
      worksheet.getCell(`A${row}`).font = { bold: true }
      worksheet.getCell(`B${row}`).value = angle
      worksheet.mergeCells(`B${row}:E${row}`)
      worksheet.getCell(`B${row}`).alignment = { wrapText: true }
      row++
    })
  }

  addExcelStructure(worksheet, productData) {
    worksheet.getCell('A1').value = 'PRODUCT STRUCTURE'
    worksheet.getCell('A1').font = { size: 14, bold: true }

    let row = 3

    productData.outline.modules.forEach((module, moduleIndex) => {
      worksheet.getCell(`A${row}`).value = `MODULE ${moduleIndex + 1}`
      worksheet.getCell(`A${row}`).font = {
        bold: true,
        color: { argb: 'FFD4AF37' },
      }
      row++

      worksheet.getCell(`A${row}`).value = 'Title:'
      worksheet.getCell(`A${row}`).font = { bold: true }
      worksheet.getCell(`B${row}`).value = module.title
      row++

      worksheet.getCell(`A${row}`).value = 'Description:'
      worksheet.getCell(`A${row}`).font = { bold: true }
      worksheet.getCell(`B${row}`).value = module.description
      worksheet.mergeCells(`B${row}:E${row}`)
      worksheet.getCell(`B${row}`).alignment = { wrapText: true }
      row++

      worksheet.getCell(`A${row}`).value = 'Lessons:'
      worksheet.getCell(`A${row}`).font = { bold: true }
      row++

      module.lessons?.forEach((lesson, lessonIndex) => {
        worksheet.getCell(`B${row}`).value = `${lessonIndex + 1}. ${lesson}`
        row++
      })

      row += 2
    })
  }

  // Word Document Generation - Rich Text Format (RTF)
  async generateWordAsRichText(productData, generationId, userEmail) {
    const rtfContent = this.generateRTFContent(
      productData,
      generationId,
      userEmail
    )

    return {
      buffer: Buffer.from(rtfContent, 'utf-8'),
      filename: `${this.sanitizeFilename(
        productData.title
      )}-blueprint-${generationId}.rtf`,
      contentType: 'application/rtf',
    }
  }

  generateRTFContent(productData, generationId, userEmail) {
    let rtf = '{\\rtf1\\ansi\\deff0'
    rtf += '{\\fonttbl{\\f0 Times New Roman;}{\\f1 Arial;}}'
    rtf += '{\\colortbl;\\red212\\green175\\blue55;\\red0\\green0\\blue0;}'
    rtf += '\\f1\\fs24'

    // Title
    rtf += '\\par\\qc\\cf1\\b\\fs32 DIGITAL PRODUCT BLUEPRINT\\par'
    rtf += `\\qc\\cf2\\b\\fs24 ${
      productData.title || 'Untitled Product'
    }\\par\\par`

    // Metadata
    rtf += `\\qc\\cf2\\fs16 Generated by AI Product Generator\\par`
    rtf += `Generation ID: ${generationId}\\par`
    rtf += `Created: ${new Date().toLocaleDateString()}\\par`
    rtf += `User: ${userEmail}\\par\\par`

    // Overview
    if (productData.overview) {
      rtf += '\\ql\\cf1\\b\\fs20 OVERVIEW\\par\\par'
      rtf += `\\cf2\\b0\\fs16 ${this.escapeRTF(productData.overview)}\\par\\par`
    }

    // Product Structure
    if (productData.outline?.modules?.length > 0) {
      rtf += '\\cf1\\b\\fs20 PRODUCT STRUCTURE\\par\\par'

      productData.outline.modules.forEach((module, index) => {
        rtf += `\\cf2\\b\\fs18 Module ${index + 1}: ${this.escapeRTF(
          module.title
        )}\\par`
        if (module.description) {
          rtf += `\\b0\\fs14 ${this.escapeRTF(module.description)}\\par`
        }

        if (module.lessons?.length > 0) {
          rtf += '\\fs14 Lessons:\\par'
          module.lessons.forEach((lesson, lessonIndex) => {
            rtf += `\\tab ${lessonIndex + 1}. ${this.escapeRTF(lesson)}\\par`
          })
        }
        rtf += '\\par'
      })
    }

    // Pricing
    if (productData.pricing) {
      rtf += '\\cf1\\b\\fs20 PRICING STRATEGY\\par\\par'
      if (productData.pricing.mainPrice) {
        rtf += `\\cf1\\b\\fs24 ${this.escapeRTF(
          productData.pricing.mainPrice
        )}\\par\\par`
      }
      if (productData.pricing.strategy) {
        rtf += `\\cf2\\b0\\fs16 ${this.escapeRTF(
          productData.pricing.strategy
        )}\\par\\par`
      }
    }

    rtf += '}'

    return rtf
  }

  // Presentation Generation - Rich Text Format
  async generatePresentationAsRichText(productData, generationId, userEmail) {
    const content = this.generatePresentationContent(
      productData,
      generationId,
      userEmail
    )

    return {
      buffer: Buffer.from(content, 'utf-8'),
      filename: `${this.sanitizeFilename(
        productData.title
      )}-presentation-${generationId}.txt`,
      contentType: 'text/plain',
    }
  }

  generatePresentationContent(productData, generationId, userEmail) {
    let content = `PRODUCT PRESENTATION: ${productData.title || 'Untitled'}\n`
    content += `${'='.repeat(60)}\n\n`

    content += `SLIDE 1: TITLE SLIDE\n${'-'.repeat(25)}\n`
    content += `${productData.title || 'Digital Product Blueprint'}\n`
    content += `Generated by AI Product Generator\n`
    content += `${new Date().toLocaleDateString()}\n\n`

    content += `SLIDE 2: OVERVIEW\n${'-'.repeat(25)}\n`
    content += `${productData.overview || 'Product overview not available'}\n\n`

    if (productData.pricing) {
      content += `SLIDE 3: PRICING\n${'-'.repeat(25)}\n`
      content += `Main Offer: ${productData.pricing.mainPrice || 'N/A'}\n`
      content += `${productData.pricing.strategy || ''}\n\n`
    }

    if (productData.marketing?.angles?.length > 0) {
      content += `SLIDE 4: MARKETING ANGLES\n${'-'.repeat(25)}\n`
      productData.marketing.angles.slice(0, 3).forEach((angle, index) => {
        content += `${index + 1}. ${angle}\n`
      })
      content += `\n`
    }

    if (productData.revenue) {
      content += `SLIDE 5: REVENUE PROJECTIONS\n${'-'.repeat(25)}\n`
      Object.entries(productData.revenue).forEach(([key, value]) => {
        content += `${key}: ${value}\n`
      })
    }

    return content
  }

  // Utility functions
  escapeRTF(text) {
    if (!text) return ''
    return text.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}')
  }

  sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'product-blueprint'
    }

    return filename
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .substring(0, 50)
  }
}

// Create and export singleton instance
const exportService = new ExportService()
export default exportService
