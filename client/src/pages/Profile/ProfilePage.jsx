import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Loader2,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  useChangePassword,
  useCurrentUser,
  useLogout,
  useUpdateProfile,
  useUserProfile,
} from '../../hooks/useAuth'
import { authService } from '../../services/authServices'
import Layout from '../Layout/Layout'

const ProfilePage = () => {
  const currentUser = useCurrentUser()
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(
    currentUser?.id
  )
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()
  const logoutMutation = useLogout()

  const [showSuccessMessage, setShowSuccessMessage] = useState('')
  const [showErrorMessage, setShowErrorMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const profileForm = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const deleteForm = useForm({
    defaultValues: {
      confirmText: '',
    },
  })

  useEffect(() => {
    if (userProfile?.data?.user) {
      const user = userProfile.data.user
      const nameParts = user.name ? user.name.split(' ') : ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      profileForm.reset({
        firstName,
        lastName,
        email: user.email || '',
      })
    }
  }, [userProfile, profileForm])

  const showMessage = (message, isError = false) => {
    if (isError) {
      setShowErrorMessage(message)
      setTimeout(() => setShowErrorMessage(''), 5000)
    } else {
      setShowSuccessMessage(message)
      setTimeout(() => setShowSuccessMessage(''), 3000)
    }
  }

  const handleProfileSubmit = async (data) => {
    try {
      const name = `${data.firstName} ${data.lastName}`.trim()

      await updateProfileMutation.mutateAsync({
        name,
        email: data.email,
      })

      showMessage('Profile updated successfully!')
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to update profile'
      showMessage(errorMessage, true)
    }
  }

  const handlePasswordSubmit = async (data) => {
    try {
      await changePasswordMutation.mutateAsync(data)

      passwordForm.reset()
      showMessage('Password updated successfully!')
    } catch (error) {
      let errorMessage = 'Failed to update password'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (
        error.response?.data &&
        typeof error.response.data === 'string'
      ) {
        const htmlError = error.response.data
        const match = htmlError.match(/Error: ([^<]+)/)
        if (match) {
          errorMessage = match[1]
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      showMessage(errorMessage, true)
    }
  }

  const handleDeleteAccount = async (data) => {
    setIsDeleting(true)

    try {
      await authService.deleteUser(currentUser.id)

      showMessage('Account deleted successfully. Redirecting...', false)

      setTimeout(async () => {
        await logoutMutation.mutateAsync()
      }, 2000)
    } catch (error) {
      let errorMessage = 'Failed to delete account'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      showMessage(errorMessage, true)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      deleteForm.reset()
    }
  }

  const FormInput = ({
    register,
    error,
    label,
    type = 'text',
    required = false,
    disabled = false,
    placeholder = '',
  }) => (
    <div className='space-y-3'>
      <label className='text-gray-300 text-sm font-semibold tracking-wide'>
        {label} {required && <span className='text-[#D4AF37]'>*</span>}
      </label>
      <div className='relative group'>
        <input
          {...register}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          className='w-full bg-gradient-to-r from-[#0A0A0C] to-[#0D0D0F] border border-[#1E1E21] rounded-2xl px-6 h-9 text-[#EDEDED] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-all duration-500 disabled:opacity-50'
        />
      </div>
      {error && <p className='text-red-400 text-sm mt-1'>{error.message}</p>}
    </div>
  )

  const MessageDisplay = () => {
    if (!showSuccessMessage && !showErrorMessage) return null

    return (
      <div
        className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border ${
          showSuccessMessage
            ? 'bg-green-900/80 border-green-500/50 text-green-200'
            : 'bg-red-900/80 border-red-500/50 text-red-200'
        } backdrop-blur-sm flex items-center gap-3`}
      >
        {showSuccessMessage ? (
          <CheckCircle size={20} className='text-green-400' />
        ) : (
          <AlertCircle size={20} className='text-red-400' />
        )}
        <span className='font-medium'>
          {showSuccessMessage || showErrorMessage}
        </span>
      </div>
    )
  }

  const DeleteModal = () => {
    if (!showDeleteModal) return null

    return (
      <div className='fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
        <div className='bg-gradient-to-br from-[#1A1214]/95 via-[#141114]/95 to-[#0A0A0C]/95 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4'>
          <div className='flex items-center gap-4 mb-6'>
            <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center'>
              <Trash2 size={20} className='text-white' />
            </div>
            <div>
              <h3 className='text-red-400 font-bold text-xl'>Delete Account</h3>
              <p className='text-gray-400 text-sm'>
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className='mb-6'>
            <p className='text-gray-300 mb-4 leading-relaxed'>
              Are you absolutely sure you want to delete your account? This will
              permanently delete all your data, settings, and cannot be undone.
            </p>
            <p className='text-gray-400 text-sm mb-4'>
              Type <span className='font-bold text-red-400'>DELETE</span> to
              confirm:
            </p>

            <form onSubmit={deleteForm.handleSubmit(handleDeleteAccount)}>
              <div className='space-y-4'>
                <FormInput
                  register={deleteForm.register('confirmText', {
                    required: 'Please type DELETE to confirm',
                    validate: (value) =>
                      value === 'DELETE' ||
                      'You must type DELETE exactly to confirm',
                  })}
                  error={deleteForm.formState.errors.confirmText}
                  label=''
                  placeholder='Type DELETE here'
                  disabled={isDeleting}
                />

                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowDeleteModal(false)
                      deleteForm.reset()
                    }}
                    disabled={isDeleting}
                    className='flex-1 bg-[#0A0A0C]/80 border border-[#2A2A2E] px-6 h-9 rounded-2xl text-sm text-[#EDEDED] hover:border-gray-500 transition-all duration-300 disabled:opacity-50'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={isDeleting}
                    className='flex-1 bg-gradient-to-r from-red-500/80 to-red-600/80 text-white px-6 h-9 rounded-2xl font-bold text-sm hover:from-red-500 hover:to-red-600 border border-red-500/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className='animate-spin' />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (profileLoading) {
    return (
      <Layout>
        <div className='min-h-screen bg-[#0B0B0C] flex items-center justify-center'>
          <div className='flex items-center gap-3 text-[#EDEDED]'>
            <Loader2 className='animate-spin' size={24} />
            <span>Loading profile...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <MessageDisplay />
      <DeleteModal />
      <div className='min-h-screen bg-[#0B0B0C]'>
        <div className='max-w-6xl mx-auto p-2 sm:p-6 space-y-4 sm:space-y-8'>
          <div className='text-left px-2 sm:px-0'>
            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
              Profile Settings
            </h1>
            <p className='text-gray-400'>
              Manage your account preferences, security settings, and billing
              information
            </p>
          </div>

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8'>
            <div className='space-y-4 sm:space-y-8'>
              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1A1E]/80 via-[#141418]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-[#2A2A2E] rounded-3xl p-4 sm:p-8'>
                <div className='relative z-10'>
                  <div className='flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8'>
                    <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center shadow-lg'>
                      <User size={24} className='text-black' />
                    </div>
                    <div>
                      <h2 className='text-[#EDEDED] font-bold text-2xl'>
                        Personal Information
                      </h2>
                      <p className='text-gray-400 text-sm'>
                        Update your personal details
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  >
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
                      <FormInput
                        register={profileForm.register('firstName', {
                          required: 'First name is required',
                          minLength: {
                            value: 2,
                            message: 'First name must be at least 2 characters',
                          },
                        })}
                        error={profileForm.formState.errors.firstName}
                        label='First Name'
                        required
                        disabled={updateProfileMutation.isLoading}
                      />

                      <FormInput
                        register={profileForm.register('lastName', {
                          required: 'Last name is required',
                          minLength: {
                            value: 2,
                            message: 'Last name must be at least 2 characters',
                          },
                        })}
                        error={profileForm.formState.errors.lastName}
                        label='Last Name'
                        required
                        disabled={updateProfileMutation.isLoading}
                      />

                      <div className='md:col-span-2'>
                        <FormInput
                          register={profileForm.register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Please enter a valid email address',
                            },
                          })}
                          error={profileForm.formState.errors.email}
                          label='Email Address'
                          type='email'
                          required
                          disabled={updateProfileMutation.isLoading}
                        />
                      </div>
                    </div>

                    <div className='flex justify-end mt-6 sm:mt-8'>
                      <button
                        type='submit'
                        disabled={updateProfileMutation.isLoading}
                        className='bg-gradient-to-r from-[#D4AF37] to-[#E6C547] text-black px-10 h-9 rounded-2xl font-bold text-sm hover:from-[#E6C547] hover:to-[#D4AF37] transition-all duration-300 flex items-center gap-3 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center'
                      >
                        {updateProfileMutation.isLoading ? (
                          <>
                            <Loader2 size={18} className='animate-spin' />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1A1E]/80 via-[#141418]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-[#2A2A2E] rounded-3xl p-4 sm:p-8'>
                <div className='relative z-10'>
                  <div className='flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8'>
                    <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center shadow-lg'>
                      <Shield size={24} className='text-black' />
                    </div>
                    <div>
                      <h2 className='text-[#EDEDED] font-bold text-2xl'>
                        Change Password
                      </h2>
                      <p className='text-gray-400 text-sm'>
                        Keep your account secure
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                  >
                    <div className='space-y-4 sm:space-y-6 max-w-md'>
                      <FormInput
                        register={passwordForm.register('currentPassword', {
                          required: 'Current password is required',
                        })}
                        error={passwordForm.formState.errors.currentPassword}
                        label='Current Password'
                        type='password'
                        disabled={changePasswordMutation.isLoading}
                      />

                      <FormInput
                        register={passwordForm.register('newPassword', {
                          required: 'New password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                          validate: (value) => {
                            const currentPassword =
                              passwordForm.watch('currentPassword')
                            return (
                              value !== currentPassword ||
                              'New password must be different from current password'
                            )
                          },
                        })}
                        error={passwordForm.formState.errors.newPassword}
                        label='New Password'
                        type='password'
                        disabled={changePasswordMutation.isLoading}
                      />

                      <FormInput
                        register={passwordForm.register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value) => {
                            const newPassword =
                              passwordForm.watch('newPassword')
                            return (
                              value === newPassword || 'Passwords do not match'
                            )
                          },
                        })}
                        error={passwordForm.formState.errors.confirmPassword}
                        label='Confirm Password'
                        type='password'
                        disabled={changePasswordMutation.isLoading}
                      />

                      <div className='pt-3 sm:pt-4 flex justify-end'>
                        <button
                          type='submit'
                          disabled={changePasswordMutation.isLoading}
                          className='bg-gradient-to-r from-[#D4AF37] to-[#E6C547] text-black px-10 h-9 rounded-2xl font-bold text-sm hover:from-[#E6C547] hover:to-[#D4AF37] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center'
                        >
                          {changePasswordMutation.isLoading ? (
                            <>
                              <Loader2 size={16} className='animate-spin' />
                              Updating...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className='space-y-4 sm:space-y-8'>
              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1A1E]/80 via-[#141418]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-[#2A2A2E] rounded-3xl p-4 sm:p-8'>
                <div className='relative z-10'>
                  <div className='flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8'>
                    <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center shadow-lg'>
                      <CreditCard size={24} className='text-black' />
                    </div>
                    <div>
                      <h2 className='text-[#EDEDED] font-bold text-2xl'>
                        Current Plan
                      </h2>
                      <p className='text-gray-400 text-sm'>
                        Manage your subscription
                      </p>
                    </div>
                  </div>

                  <div className='p-4 sm:p-6 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/10 to-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-3xl mb-6 sm:mb-8 relative overflow-hidden'>
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent'></div>
                    <div className='relative'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                          <h4 className='text-[#D4AF37] font-bold text-2xl tracking-wide'>
                            Empire Plan
                          </h4>
                          <p className='text-gray-300 text-base'>
                            $89.70/month • Next billing: Sep 1, 2025
                          </p>
                        </div>
                        <button className='bg-[#0A0A0C]/80 backdrop-blur border border-[#2A2A2E] px-6 h-9 rounded-2xl text-sm text-[#EDEDED] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-300 flex-shrink-0 transform hover:scale-105'>
                          Change Plan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='mb-4 sm:mb-6'>
                    <h3 className='text-[#EDEDED] font-bold text-xl mb-4 sm:mb-6 flex items-center gap-3'>
                      <div className='w-2 h-6 bg-gradient-to-b from-[#D4AF37] to-[#B8941F] rounded-full'></div>
                      Billing History
                    </h3>
                    <div className='space-y-3 sm:space-y-4'>
                      {[
                        {
                          date: 'Aug 1, 2025',
                          amount: '$89.70',
                          status: 'Paid',
                        },
                        {
                          date: 'Jul 1, 2025',
                          amount: '$89.70',
                          status: 'Paid',
                        },
                        {
                          date: 'Jun 1, 2025',
                          amount: '$89.70',
                          status: 'Paid',
                        },
                      ].map((invoice, index) => (
                        <div
                          key={index}
                          className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-[#0A0A0C]/80 to-[#0D0D0F]/60 border border-[#1E1E21] rounded-2xl'
                        >
                          <div className='flex-1'>
                            <div className='text-[#EDEDED] font-semibold text-base'>
                              {invoice.date}
                            </div>
                            <div className='text-gray-400 text-sm'>
                              Empire Plan subscription
                            </div>
                          </div>
                          <div className='flex items-center gap-4'>
                            <span className='text-[#EDEDED] font-bold text-lg'>
                              {invoice.amount}
                            </span>
                            <span className='bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/20'>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1214]/80 via-[#141114]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-red-500/30 rounded-3xl p-4 sm:p-8'>
                <div className='relative z-10'>
                  <div className='flex items-center gap-4 mb-8'>
                    <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg'>
                      <Trash2 size={24} className='text-white' />
                    </div>
                    <div>
                      <h2 className='text-red-400 font-bold text-2xl'>
                        Danger Zone
                      </h2>
                      <p className='text-gray-400 text-sm'>
                        Irreversible actions
                      </p>
                    </div>
                  </div>

                  <div className='p-4 sm:p-6 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/30 rounded-3xl'>
                    <h4 className='text-red-400 font-semibold text-lg mb-3'>
                      Delete Account
                    </h4>
                    <p className='text-gray-400 mb-4 sm:mb-6 leading-relaxed'>
                      This will permanently delete your account and all data.
                      This action cannot be undone.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className='bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 px-6 h-9 rounded-2xl font-bold text-sm hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 transform hover:scale-105'
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ProfilePage
