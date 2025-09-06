// File: src/utils/validationRules.js

// Digital Product Validation Rules
export const digitalProductValidationRules = {
  name: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Product name is required'
      }
      if (value.trim().length < 3) {
        return 'Product name must be at least 3 characters long'
      }
      if (value.trim().length > 100) {
        return 'Product name cannot exceed 100 characters'
      }
      return ''
    },
  ],

  description: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Product description is required'
      }
      if (value.trim().length < 10) {
        return 'Description must be at least 10 characters long'
      }
      if (value.trim().length > 500) {
        return 'Description cannot exceed 500 characters'
      }
      return ''
    },
  ],

  category: [
    (value) => {
      const allowedCategories = [
        'Course',
        'Software',
        'Templates',
        'E-book',
        'Audio',
        'Video',
      ]
      if (!value) {
        return 'Category is required'
      }
      if (!allowedCategories.includes(value)) {
        return 'Please select a valid category'
      }
      return ''
    },
  ],

  price: [
    (value) => {
      if (value === undefined || value === null || value === '') {
        return 'Price is required'
      }
      const numValue = parseFloat(value)
      if (isNaN(numValue)) {
        return 'Price must be a valid number'
      }
      if (numValue < 0) {
        return 'Price cannot be negative'
      }
      if (numValue > 99999) {
        return 'Price cannot exceed $99,999'
      }
      if (numValue > 0 && numValue < 1) {
        return 'Price must be at least $1.00'
      }
      return ''
    },
  ],

  type: [
    (value) => {
      const allowedTypes = ['digital', 'saas', 'service']
      if (!value) {
        return 'Product type is required'
      }
      if (!allowedTypes.includes(value)) {
        return 'Please select a valid product type'
      }
      return ''
    },
  ],
}

// Checkout Form Validation Rules
export const checkoutValidationRules = {
  email: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Email is required'
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address'
      }
      return ''
    },
  ],

  firstName: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'First name is required'
      }
      if (value.trim().length < 2) {
        return 'First name must be at least 2 characters long'
      }
      if (value.trim().length > 50) {
        return 'First name cannot exceed 50 characters'
      }
      return ''
    },
  ],

  lastName: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Last name is required'
      }
      if (value.trim().length < 2) {
        return 'Last name must be at least 2 characters long'
      }
      if (value.trim().length > 50) {
        return 'Last name cannot exceed 50 characters'
      }
      return ''
    },
  ],

  cardNumber: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Card number is required'
      }
      const cleanValue = value.replace(/\s/g, '')
      if (cleanValue.length < 13 || cleanValue.length > 19) {
        return 'Please enter a valid card number'
      }
      // Basic Luhn algorithm check
      if (!isValidCardNumber(cleanValue)) {
        return 'Please enter a valid card number'
      }
      return ''
    },
  ],

  expiryDate: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Expiry date is required'
      }
      const regex = /^(0[1-9]|1[0-2])\/\d{2}$/
      if (!regex.test(value)) {
        return 'Please enter date in MM/YY format'
      }

      // Check if date is in the future
      const [month, year] = value.split('/')
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear() % 100
      const currentMonth = currentDate.getMonth() + 1

      const expiryYear = parseInt(year)
      const expiryMonth = parseInt(month)

      if (
        expiryYear < currentYear ||
        (expiryYear === currentYear && expiryMonth < currentMonth)
      ) {
        return 'Card has expired'
      }

      return ''
    },
  ],

  cvv: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'CVV is required'
      }
      if (!/^\d{3,4}$/.test(value)) {
        return 'CVV must be 3 or 4 digits'
      }
      return ''
    },
  ],

  nameOnCard: [
    (value) => {
      if (!value || value.trim().length === 0) {
        return 'Name on card is required'
      }
      if (value.trim().length < 2) {
        return 'Name must be at least 2 characters long'
      }
      if (value.trim().length > 100) {
        return 'Name cannot exceed 100 characters'
      }
      return ''
    },
  ],

  agreeTerms: [
    (value) => {
      if (!value) {
        return 'You must agree to the terms and conditions'
      }
      return ''
    },
  ],
}

// File Upload Validation Rules
export const fileUploadValidationRules = {
  files: [
    (files) => {
      if (!files || files.length === 0) {
        return 'Please select at least one file'
      }

      const maxFiles = 10
      if (files.length > maxFiles) {
        return `Maximum ${maxFiles} files allowed`
      }

      const maxSize = 100 * 1024 * 1024 // 100MB
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/zip',
        'application/x-zip-compressed',
        'application/vnd.rar',
        'application/x-rar-compressed',
        'text/plain',
        'video/mp4',
        'audio/mpeg',
        'image/jpeg',
        'image/png',
      ]

      for (const file of files) {
        if (file.size > maxSize) {
          return `File "${file.name}" is too large. Maximum size is 100MB`
        }

        if (!allowedTypes.includes(file.type)) {
          return `File type "${file.type}" is not allowed`
        }
      }

      return ''
    },
  ],
}

// Helper Functions
function isValidCardNumber(cardNumber) {
  // Basic Luhn algorithm implementation
  let sum = 0
  let alternate = false

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i))

    if (alternate) {
      digit *= 2
      if (digit > 9) {
        digit = (digit % 10) + 1
      }
    }

    sum += digit
    alternate = !alternate
  }

  return sum % 10 === 0
}

// Utility function to format card number
export const formatCardNumber = (value) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  const matches = v.match(/\d{4,16}/g)
  const match = (matches && matches[0]) || ''
  const parts = []

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4))
  }

  return parts.length ? parts.join(' ') : v
}

// Utility function to format expiry date
export const formatExpiryDate = (value) => {
  const v = value.replace(/\D/g, '')
  if (v.length >= 2) {
    return v.substring(0, 2) + '/' + v.substring(2, 4)
  }
  return v
}

// Utility function to format CVV
export const formatCVV = (value) => {
  return value.replace(/\D/g, '').substring(0, 4)
}

// Category options for dropdowns
export const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'Course', label: 'Course' },
  { value: 'Software', label: 'Software' },
  { value: 'Templates', label: 'Templates' },
  { value: 'E-book', label: 'E-book' },
  { value: 'Audio', label: 'Audio' },
  { value: 'Video', label: 'Video' },
]

// Product type options
export const productTypeOptions = [
  { value: 'digital', label: 'Digital Product' },
  { value: 'saas', label: 'Software as a Service' },
  { value: 'service', label: 'Service' },
]

// File type icons mapping
export const fileTypeIcons = {
  'application/pdf': 'FileText',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'FileText',
  'application/msword': 'FileText',
  'text/plain': 'FileText',
  'application/zip': 'Package',
  'application/x-zip-compressed': 'Package',
  'application/vnd.rar': 'Package',
  'application/x-rar-compressed': 'Package',
  'video/mp4': 'Video',
  'audio/mpeg': 'Music',
  'image/jpeg': 'Image',
  'image/png': 'Image',
  'image/gif': 'Image',
}

// Default form values
export const defaultProductFormValues = {
  name: '',
  description: '',
  category: 'Course',
  price: '',
  type: 'digital',
  features: [],
  tags: [],
}

export const defaultCheckoutFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  nameOnCard: '',
  agreeTerms: false,
}
