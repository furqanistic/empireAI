// File: client/src/components/Product/EditProductModal.jsx - COMPLETELY FIXED
import { Trash2, Upload, X } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import {
  categoryOptions,
  defaultProductFormValues,
  productTypeOptions,
} from '../../utils/validationRules'

const EditProductModal = ({
  show,
  onClose,
  onSave,
  saving,
  product,
  onFileUpload,
  onFileDelete,
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

  // Update form values when product changes
  useEffect(() => {
    if (product && show) {
      reset({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'Course',
        price: product.price ? product.price.toString() : '',
        type: product.type || 'digital',
        features: product.features || [],
        tags: product.tags || [],
      })
    }
  }, [product, show, reset])

  // Reset selected files when modal opens/closes
  useEffect(() => {
    if (!show) {
      setSelectedFiles([])
    }
  }, [show])

  const onFormSubmit = async (data) => {
    try {
      await onSave(data)
      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        await onFileUpload(product._id, selectedFiles)
        setSelectedFiles([])
      }
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

  const FileIcon = ({ type }) => {
    switch (type) {
      case 'pdf':
        return '📄'
      case 'docx':
      case 'doc':
        return '📝'
      case 'zip':
      case 'rar':
        return '📦'
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥'
      case 'mp3':
      case 'wav':
        return '🎵'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      default:
        return '📎'
    }
  }

  if (!show || !product) return null

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-[#EDEDED]'>Edit Product</h3>
          <button
            onClick={handleClose}
            type='button'
            className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200'
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-4'>
          {/* Basic Product Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                <p className='text-red-400 text-xs mt-1'>
                  {errors.name.message}
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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                Product Type *
              </label>
              <select
                {...register('type', {
                  required: 'Product type is required',
                })}
                className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 appearance-none pr-8 cursor-pointer ${
                  errors.type ? 'border-red-500' : 'border-[#1E1E21]'
                }`}
              >
                {productTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className='text-red-400 text-xs mt-1'>
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          {/* Current Files Section */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Current Files
            </label>
            {product.files && product.files.length > 0 ? (
              <div className='space-y-2 mb-3'>
                {product.files.map((file, index) => (
                  <div
                    key={`${file._id || index}`}
                    className='flex items-center justify-between bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>
                        {FileIcon({ type: file.type })}
                      </span>
                      <div>
                        <span className='text-sm text-[#EDEDED]'>
                          {file.name || file.originalName}
                        </span>
                        <span className='text-xs text-gray-400 ml-2'>
                          ({file.size})
                        </span>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        onFileDelete && onFileDelete(product._id, file._id)
                      }
                      className='text-red-400 hover:text-red-300 transition-colors duration-200'
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-400 text-sm mb-3'>No files uploaded</p>
            )}
          </div>

          {/* File Upload Section */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Add New Files
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

            {/* Selected New Files */}
            {selectedFiles.length > 0 && (
              <div className='mt-3'>
                <h4 className='text-sm font-medium text-gray-300 mb-2'>
                  New Files to Upload ({selectedFiles.length})
                </h4>
                <div className='space-y-2 max-h-32 overflow-y-auto'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`new-${index}`}
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
                        disabled={uploading}
                        className='text-red-400 hover:text-red-300 transition-colors duration-200 flex-shrink-0 disabled:opacity-50'
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

          {/* Form Actions */}
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
                ? 'Saving...'
                : uploading
                ? 'Uploading...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal
