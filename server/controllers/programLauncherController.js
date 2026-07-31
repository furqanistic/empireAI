import { createError } from '../error.js'
import User from '../models/User.js'
import {
  extractWebsiteContext,
  generateProgramDraft,
  validateProgramDraft,
} from '../services/programLauncherService.js'

const REGENERATABLE_SECTIONS = new Set([
  'name',
  'commissionRate',
  'cookieDays',
  'programDescription',
  'idealAffiliateProfile',
  'invitationMessage',
  'termsSummary',
  'faq',
  'contentAngles',
])

const serializeDraft = (draft) => {
  if (!draft) return null
  return {
    websiteUrl: draft.websiteUrl,
    productDescription: draft.productDescription || '',
    preferredCommissionModel: draft.preferredCommissionModel || 'percentage',
    averageOrderValue: draft.averageOrderValue ?? null,
    notes: draft.notes || '',
    sourceUrls: draft.sourceUrls || [],
    rawGenerated: draft.rawGenerated,
    editedContent: draft.editedContent,
    generatedAt: draft.generatedAt,
    version: draft.version,
    model: draft.model,
    status: draft.status,
  }
}

const parseLauncherInput = (input) => {
  const websiteUrl =
    typeof input.websiteUrl === 'string' ? input.websiteUrl.trim() : ''
  const productDescription =
    typeof input.productDescription === 'string'
      ? input.productDescription.trim()
      : ''
  const preferredCommissionModel =
    input.preferredCommissionModel || 'percentage'
  const notes = typeof input.notes === 'string' ? input.notes.trim() : ''
  const averageOrderValue =
    input.averageOrderValue === '' ||
    input.averageOrderValue === null ||
    input.averageOrderValue === undefined
      ? null
      : Number(input.averageOrderValue)

  if (!websiteUrl || websiteUrl.length > 500) {
    throw createError(400, 'Enter a website URL of 500 characters or fewer')
  }
  if (productDescription.length > 2000 || notes.length > 2000) {
    throw createError(400, 'Descriptions and notes must be 2,000 characters or fewer')
  }
  if (
    !['percentage', 'flat', 'unsure'].includes(preferredCommissionModel)
  ) {
    throw createError(400, 'Choose a supported commission model')
  }
  if (
    averageOrderValue !== null &&
    (!Number.isFinite(averageOrderValue) ||
      averageOrderValue < 0 ||
      averageOrderValue > 100000000)
  ) {
    throw createError(400, 'Enter a valid average order value')
  }

  return {
    websiteUrl,
    productDescription,
    preferredCommissionModel,
    averageOrderValue,
    notes,
  }
}

const getLauncherContext = async (input) => {
  try {
    return await extractWebsiteContext(input.websiteUrl)
  } catch (extractionError) {
    if (input.productDescription.length < 40) {
      throw extractionError
    }
    return {
      context: `OWNER-PROVIDED PRODUCT DESCRIPTION:\n${input.productDescription}`,
      sourceUrls: [],
    }
  }
}

export const getProgramLauncherDraft = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+programLauncherDraft')
    if (!user) return next(createError(404, 'User not found'))

    res.status(200).json({
      status: 'success',
      data: { draft: serializeDraft(user.programLauncherDraft) },
    })
  } catch (error) {
    next(error)
  }
}

export const generateProgramLauncherDraft = async (req, res, next) => {
  try {
    const input = parseLauncherInput(req.body || {})
    const { context, sourceUrls } = await getLauncherContext(input)
    const generated = await generateProgramDraft({ ...input, context })
    const user = await User.findById(req.user._id).select('+programLauncherDraft')
    if (!user) return next(createError(404, 'User not found'))

    const version = (user.programLauncherDraft?.version || 0) + 1
    user.programLauncherDraft = {
      ...input,
      sourceUrls,
      rawGenerated: generated.draft,
      editedContent: generated.draft,
      generatedAt: new Date(),
      version,
      model: generated.model,
      status: 'draft',
    }
    await user.save()

    res.status(200).json({
      status: 'success',
      data: { draft: serializeDraft(user.programLauncherDraft) },
      message: 'Program draft is ready for review',
    })
  } catch (error) {
    if (error.statusCode) return next(error)
    const isWebsiteError =
      /website|URL|HTML|redirect|public|scan|respond/i.test(error.message)
    next(
      createError(
        isWebsiteError ? 422 : 502,
        error.message || 'Could not create the program draft'
      )
    )
  }
}

export const regenerateProgramLauncherSection = async (req, res, next) => {
  try {
    const section = req.body?.section
    if (!REGENERATABLE_SECTIONS.has(section)) {
      return next(createError(400, 'Choose a valid section to regenerate'))
    }

    const user = await User.findById(req.user._id).select('+programLauncherDraft')
    const savedDraft = user?.programLauncherDraft
    if (!user) return next(createError(404, 'User not found'))
    if (!savedDraft?.editedContent) {
      return next(createError(404, 'Create a program draft first'))
    }

    const input = parseLauncherInput(savedDraft)
    const { context, sourceUrls } = await getLauncherContext(input)
    const currentDraft = savedDraft.editedContent.toObject()
    const generated = await generateProgramDraft({
      ...input,
      context,
      section,
      currentDraft,
    })

    const pairedReason =
      section === 'commissionRate'
        ? 'commissionReason'
        : section === 'cookieDays'
          ? 'cookieReason'
          : null
    const rawGenerated = savedDraft.rawGenerated.toObject()
    rawGenerated[section] = generated.draft[section]
    currentDraft[section] = generated.draft[section]
    if (pairedReason) {
      rawGenerated[pairedReason] = generated.draft[pairedReason]
      currentDraft[pairedReason] = generated.draft[pairedReason]
    }

    savedDraft.rawGenerated = rawGenerated
    savedDraft.editedContent = currentDraft
    savedDraft.sourceUrls = sourceUrls
    savedDraft.generatedAt = new Date()
    savedDraft.version += 1
    savedDraft.model = generated.model
    savedDraft.status = 'draft'
    await user.save()

    res.status(200).json({
      status: 'success',
      data: { draft: serializeDraft(savedDraft) },
      message: 'Section regenerated',
    })
  } catch (error) {
    if (error.statusCode) return next(error)
    next(createError(502, error.message || 'Could not regenerate this section'))
  }
}

export const saveProgramLauncherDraft = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+programLauncherDraft')
    if (!user) return next(createError(404, 'User not found'))
    if (!user.programLauncherDraft) {
      return next(createError(404, 'Create a program draft first'))
    }

    user.programLauncherDraft.editedContent = validateProgramDraft(
      req.body?.content
    )
    user.programLauncherDraft.status = 'draft'
    await user.save()

    res.status(200).json({
      status: 'success',
      data: { draft: serializeDraft(user.programLauncherDraft) },
      message: 'Draft saved without publishing',
    })
  } catch (error) {
    if (error.statusCode) return next(error)
    next(createError(400, error.message || 'Could not save this draft'))
  }
}

export const publishProgramLauncherDraft = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+programLauncherDraft')
    if (!user) return next(createError(404, 'User not found'))
    if (!user.programLauncherDraft) {
      return next(createError(404, 'Create a program draft first'))
    }

    const approved = validateProgramDraft(req.body?.content)
    const createdAt = user.affiliateProgram?.createdAt || new Date()
    user.programLauncherDraft.editedContent = approved
    user.programLauncherDraft.status = 'published'
    user.affiliateProgram = {
      name: approved.name,
      commissionRate: approved.commissionRate,
      cookieDays: approved.cookieDays,
      status: 'active',
      createdAt,
      programDescription: approved.programDescription,
      idealAffiliateProfile: approved.idealAffiliateProfile,
      invitationMessage: approved.invitationMessage,
      termsSummary: approved.termsSummary,
      faq: approved.faq,
      contentAngles: approved.contentAngles,
    }
    await user.save()

    res.status(200).json({
      status: 'success',
      data: {
        affiliateProgram: user.affiliateProgram,
        draft: serializeDraft(user.programLauncherDraft),
      },
      message: 'Affiliate program published',
    })
  } catch (error) {
    if (error.statusCode) return next(error)
    next(createError(400, error.message || 'Could not publish this program'))
  }
}
