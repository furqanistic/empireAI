// File: middleware/fileUpload.js
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { createError } from '../error.js'

// Ensure upload directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// Configure storage for digital product files
const productFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(
      process.cwd(),
      'uploads',
      'products',
      req.user._id.toString()
    )
    ensureDirectoryExists(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const fileExtension = path.extname(file.originalname).toLowerCase()
    const baseName = path
      .basename(file.originalname, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50) // Limit base name length

    cb(null, `${baseName}_${uniqueSuffix}${fileExtension}`)
  },
})

// File filter for digital products
const productFileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      '.docx',
    'application/msword': '.doc',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/vnd.rar': '.rar',
    'application/x-rar-compressed': '.rar',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      '.pptx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      '.xlsx',
    'text/plain': '.txt',
    'application/epub+zip': '.epub',
    'video/mp4': '.mp4',
    'video/avi': '.avi',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
  }

  // Check file extension as backup
  const fileExtension = path.extname(file.originalname).toLowerCase()
  const allowedExtensions = Object.values(allowedTypes)

  if (
    allowedTypes[file.mimetype] ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true)
  } else {
    cb(
      new Error(
        `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`
      ),
      false
    )
  }
}

// Create multer upload middleware for product files
const uploadProductFiles = multer({
  storage: productFileStorage,
  fileFilter: productFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
    files: 10, // Maximum 10 files at once
  },
})

// Middleware to handle file upload errors
export const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(createError(400, 'File too large. Maximum size is 100MB'))
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(
        createError(400, 'Too many files. Maximum is 10 files at once')
      )
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(createError(400, 'Unexpected field name for file upload'))
    }
    return next(createError(400, `Upload error: ${error.message}`))
  }

  if (error && error.message.includes('File type not allowed')) {
    return next(createError(400, error.message))
  }

  next(error)
}

// Middleware for single file upload
export const uploadSingleProductFile = (fieldName = 'file') => {
  return [uploadProductFiles.single(fieldName), handleUploadErrors]
}

// Middleware for multiple file upload
export const uploadMultipleProductFiles = (
  fieldName = 'files',
  maxCount = 10
) => {
  return [uploadProductFiles.array(fieldName, maxCount), handleUploadErrors]
}

// Middleware to validate file content (basic security check)
export const validateFileContent = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next()
    }

    const files = req.files || [req.file]

    for (const file of files) {
      // Basic file validation
      if (!file || !file.path) {
        continue
      }

      // Check if file actually exists
      if (!fs.existsSync(file.path)) {
        return next(createError(400, 'Uploaded file not found'))
      }

      // Get file stats
      const stats = fs.statSync(file.path)

      // Verify file size matches what was uploaded
      if (stats.size !== file.size) {
        // Clean up the file
        fs.unlinkSync(file.path)
        return next(createError(400, 'File upload corrupted'))
      }

      // Additional security check for executables
      const dangerousExtensions = [
        '.exe',
        '.bat',
        '.cmd',
        '.scr',
        '.com',
        '.pif',
        '.vbs',
        '.js',
        '.jar',
      ]
      const fileExtension = path.extname(file.originalname).toLowerCase()

      if (dangerousExtensions.includes(fileExtension)) {
        // Clean up the file
        fs.unlinkSync(file.path)
        return next(createError(400, 'Executable files are not allowed'))
      }
    }

    next()
  } catch (error) {
    console.error('Error validating file content:', error)
    next(createError(500, 'Error validating uploaded files'))
  }
}

// Cleanup middleware to remove uploaded files on error
export const cleanupOnError = (req, res, next) => {
  const originalSend = res.send
  const originalJson = res.json

  const cleanup = () => {
    if (res.statusCode >= 400) {
      const files = req.files || (req.file ? [req.file] : [])

      files.forEach((file) => {
        if (file && file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path)
            console.log(`Cleaned up file: ${file.path}`)
          } catch (error) {
            console.error(`Error cleaning up file ${file.path}:`, error)
          }
        }
      })
    }
  }

  res.send = function (data) {
    cleanup()
    return originalSend.call(this, data)
  }

  res.json = function (data) {
    cleanup()
    return originalJson.call(this, data)
  }

  next()
}

// Utility function to get file icon based on extension
export const getFileIcon = (filename) => {
  const extension = path.extname(filename).toLowerCase()

  const iconMap = {
    '.pdf': 'file-text',
    '.doc': 'file-text',
    '.docx': 'file-text',
    '.txt': 'file-text',
    '.zip': 'file-archive',
    '.rar': 'file-archive',
    '.mp4': 'video',
    '.avi': 'video',
    '.mov': 'video',
    '.mp3': 'music',
    '.wav': 'music',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.ppt': 'presentation',
    '.pptx': 'presentation',
    '.xls': 'spreadsheet',
    '.xlsx': 'spreadsheet',
    '.epub': 'book',
  }

  return iconMap[extension] || 'file'
}

// Utility function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Middleware to add file metadata
export const addFileMetadata = (req, res, next) => {
  if (req.files) {
    req.files = req.files.map((file) => ({
      ...file,
      icon: getFileIcon(file.originalname),
      formattedSize: formatFileSize(file.size),
      uploadedAt: new Date().toISOString(),
    }))
  }

  if (req.file) {
    req.file = {
      ...req.file,
      icon: getFileIcon(req.file.originalname),
      formattedSize: formatFileSize(req.file.size),
      uploadedAt: new Date().toISOString(),
    }
  }

  next()
}

export default {
  uploadSingleProductFile,
  uploadMultipleProductFiles,
  handleUploadErrors,
  validateFileContent,
  cleanupOnError,
  addFileMetadata,
  getFileIcon,
  formatFileSize,
}
