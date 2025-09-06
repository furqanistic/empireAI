// File: client/src/components/Product/FileUploadModal.jsx - UPDATED WITH REACT HOOK FORM
import { Upload, X } from 'lucide-react'
import React, { useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'

const FileUploadModal = ({
  show,
  onClose,
  onUpload,
  uploading,
  uploadProgress,
  productId,
}) => {
  const form = useForm({
    defaultValues: {
      files: [],
    },
    mode: 'onChange',
  })

  const { watch, setValue, formState } = form
  const selectedFiles = watch('files')

  const onDrop = useCallback(
    (acceptedFiles) => {
      setValue('files', [...selectedFiles, ...acceptedFiles], {
        shouldValidate: true,
      })
    },
    [selectedFiles, setValue]
  )

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

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setValue('files', newFiles, { shouldValidate: true })
  }

  const handleSubmit = async (data) => {
    if (data.files.length === 0) return

    try {
      await onUpload(productId, data.files)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const validateFiles = (files) => {
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

    return true
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      form.reset()
    }
  }, [show, form])

  if (!show) return null

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-[#EDEDED]'>Upload Files</h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200 disabled:opacity-50'
          >
            ×
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Dropzone */}
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-300 cursor-pointer ${
                isDragActive
                  ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5'
                  : 'border-[#1E1E21] hover:border-[#D4AF37]/40'
              }`}
            >
              <input
                {...getInputProps()}
                {...form.register('files', {
                  validate: validateFiles,
                })}
              />
              <Upload size={32} className='mx-auto text-gray-400 mb-4' />
              {isDragActive ? (
                <p className='text-[#D4AF37] text-sm'>Drop the files here...</p>
              ) : (
                <div>
                  <p className='text-gray-400 text-sm mb-2'>
                    Click to upload or drag and drop
                  </p>
                  <p className='text-gray-500 text-xs'>
                    PDF, DOCX, ZIP, MP4, MP3, Images up to 100MB each
                  </p>
                </div>
              )}
            </div>

            {formState.errors.files && (
              <p className='text-red-400 text-xs mt-2'>
                {formState.errors.files.message}
              </p>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div>
              <h4 className='text-sm font-medium text-gray-300 mb-3'>
                Selected Files ({selectedFiles.length})
              </h4>
              <div className='space-y-2 max-h-48 overflow-y-auto'>
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
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm text-gray-300'>Uploading...</span>
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

          {/* Actions */}
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={onClose}
              disabled={uploading}
              className='flex-1 bg-[#1A1A1C] border border-[#1E1E21] text-[#EDEDED] h-10 rounded-xl font-medium hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                uploading || selectedFiles.length === 0 || !formState.isValid
              }
              className='flex-1 bg-[#D4AF37] text-black h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50'
            >
              {uploading
                ? 'Uploading...'
                : `Upload ${selectedFiles.length} Files`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FileUploadModal
