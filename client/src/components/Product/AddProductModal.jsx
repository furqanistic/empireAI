// File: client/src/components/Product/AddProductModal.jsx - WITH FILE UPLOAD
import { Upload, X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import {
  categoryOptions,
  defaultProductFormValues,
} from '../../utils/validationRules'

const AddProductModal = ({
  show,
  onClose,
  onSubmit,
  saving,
  uploading,
  uploadProgress,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    defaultValues: defaultProductFormValues,
    mode: 'onChange',
  })

  // Reset form and files when modal opens/closes
  useEffect(() => {
    if (!show) {
      reset()
      setSelectedFiles([])
    }
  }, [show, reset])

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data, selectedFiles)
      reset()
      setSelectedFiles([])
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFiles([])
    onClose()
  }

  // File upload functionality
  const onDrop = useCallback((acceptedFiles) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/msword': ['.doc'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
      'text/plain': ['.txt'],
      'video/mp4': ['.mp4'],
      'audio/mpeg': ['.mp3'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
  })

  const removeFile = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  if (!show) return null

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-[#EDEDED]'>
            Add New Product
          </h3>
          <button
            onClick={handleClose}
            type='button'
            className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200'
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Product Name *
            </label>
            <input
              type='text'
              {...register('name', {
                required: 'Product name is required',
                minLength: {
                  value: 3,
                  message: 'Product name must be at least 3 characters',
                },
                maxLength: {
                  value: 100,
                  message: 'Product name cannot exceed 100 characters',
                },
              })}
              className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                errors.name
                  ? 'border-red-500'
                  : 'border-[#1E1E21] focus:border-[#D4AF37]/40'
              }`}
              placeholder='Enter product name'
              autoComplete='off'
            />
            {errors.name && (
              <p className='text-red-400 text-xs mt-1'>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Description *
            </label>
            <textarea
              rows={3}
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters',
                },
                maxLength: {
                  value: 500,
                  message: 'Description cannot exceed 500 characters',
                },
              })}
              className={`w-full bg-[#1A1A1C] border rounded-xl px-4 py-3 text-[#EDEDED] placeholder-gray-400 focus:outline-none transition-all duration-300 resize-none ${
                errors.description
                  ? 'border-red-500'
                  : 'border-[#1E1E21] focus:border-[#D4AF37]/40'
              }`}
              placeholder='Describe your product'
              autoComplete='off'
            />
            {errors.description && (
              <p className='text-red-400 text-xs mt-1'>
                {errors.description.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Category *
              </label>
              <select
                {...register('category', {
                  required: 'Category is required',
                })}
                className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 appearance-none pr-8 cursor-pointer ${
                  errors.category ? 'border-red-500' : 'border-[#1E1E21]'
                }`}
              >
                {categoryOptions
                  .filter((opt) => opt.value !== 'all')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              {errors.category && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Price ($) *
              </label>
              <input
                type='number'
                step='0.01'
                min='1'
                max='99999'
                {...register('price', {
                  required: 'Price is required',
                  min: {
                    value: 1,
                    message: 'Price must be at least $1.00',
                  },
                  max: {
                    value: 99999,
                    message: 'Price cannot exceed $99,999',
                  },
                })}
                className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                  errors.price
                    ? 'border-red-500'
                    : 'border-[#1E1E21] focus:border-[#D4AF37]/40'
                }`}
                placeholder='0.00'
                autoComplete='off'
              />
              {errors.price && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Product Files (Optional)
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors duration-300 cursor-pointer ${
                isDragActive
                  ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5'
                  : 'border-[#1E1E21] hover:border-[#D4AF37]/40'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={24} className='mx-auto text-gray-400 mb-2' />
              {isDragActive ? (
                <p className='text-[#D4AF37] text-sm'>Drop the files here...</p>
              ) : (
                <div>
                  <p className='text-gray-400 text-sm mb-1'>
                    Click to upload or drag and drop
                  </p>
                  <p className='text-gray-500 text-xs'>
                    PDF, DOCX, ZIP, MP4, MP3, Images up to 100MB each
                  </p>
                </div>
              )}
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className='mt-3'>
                <h4 className='text-sm font-medium text-gray-300 mb-2'>
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className='space-y-2 max-h-32 overflow-y-auto'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2'
                    >
                      <div className='flex items-center gap-2 min-w-0'>
                        <div className='text-lg'>📎</div>
                        <div className='min-w-0'>
                          <div className='text-sm text-[#EDEDED] truncate'>
                            {file.name}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeFile(index)}
                        className='text-red-400 hover:text-red-300 transition-colors duration-200 flex-shrink-0'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className='mt-3'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-gray-300'>
                    Uploading files...
                  </span>
                  <span className='text-sm text-[#D4AF37]'>
                    {uploadProgress}%
                  </span>
                </div>
                <div className='w-full bg-[#1A1A1C] rounded-full h-2'>
                  <div
                    className='bg-[#D4AF37] h-2 rounded-full transition-all duration-300'
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center gap-3 pt-4'>
            <button
              type='button'
              onClick={handleClose}
              disabled={saving || uploading}
              className='flex-1 bg-[#1A1A1C] border border-[#1E1E21] text-[#EDEDED] h-10 rounded-xl font-medium hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving || uploading || !isValid}
              className='flex-1 bg-[#D4AF37] text-black h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50'
            >
              {saving
                ? 'Creating...'
                : uploading
                ? 'Uploading...'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductModal
