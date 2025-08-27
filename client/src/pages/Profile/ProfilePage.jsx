// File: client/src/pages/Profile/ProfilePage.jsx
import {
  ChevronDown,
  CreditCard,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import React, { useState } from 'react'

import Layout from '../Layout/Layout'

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    company: 'Ascend Ventures',
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const InputField = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
  }) => (
    <div className='space-y-3'>
      <label className='text-gray-300 text-sm font-semibold tracking-wide'>
        {label} {required && <span className='text-[#D4AF37]'>*</span>}
      </label>
      <div className='relative group'>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className='w-full bg-gradient-to-r from-[#0A0A0C] to-[#0D0D0F] border border-[#1E1E21] rounded-2xl px-6 h-9 text-[#EDEDED] placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-all duration-500'
        />
      </div>
    </div>
  )

  return (
    <Layout>
      <div className='min-h-screen bg-[#0B0B0C]'>
        <div className='max-w-6xl mx-auto p-2 sm:p-6 space-y-4 sm:space-y-8'>
          {/* Header */}
          <div className='text-left px-2 sm:px-0'>
            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
              Profile Settings
            </h1>
            <p className='text-gray-400'>
              Manage your account preferences, security settings, and billing
              information
            </p>
          </div>

          {/* Main Content Grid */}
          <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8'>
            {/* Left Column */}
            <div className='space-y-4 sm:space-y-8'>
              {/* Personal Information */}
              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1A1E]/80 via-[#141418]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-[#2A2A2E] rounded-3xl p-4 sm:p-8 transition-all duration-700'>
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

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
                    <InputField
                      label='First Name'
                      value={formData.firstName}
                      onChange={(value) =>
                        handleInputChange('firstName', value)
                      }
                      required
                    />
                    <InputField
                      label='Last Name'
                      value={formData.lastName}
                      onChange={(value) => handleInputChange('lastName', value)}
                      required
                    />
                    <InputField
                      label='Email Address'
                      type='email'
                      value={formData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      required
                    />
                    <InputField
                      label='Phone Number'
                      type='tel'
                      value={formData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                    />
                    <div className='md:col-span-2'>
                      <InputField
                        label='Company'
                        value={formData.company}
                        onChange={(value) =>
                          handleInputChange('company', value)
                        }
                      />
                    </div>
                  </div>

                  <div className='flex justify-end mt-6 sm:mt-8'>
                    <button className='bg-gradient-to-r from-[#D4AF37] to-[#E6C547] text-black px-10 h-9 rounded-2xl font-bold text-sm hover:from-[#E6C547] hover:to-[#D4AF37] transition-all duration-300 flex items-center gap-3 transform hover:scale-105'>
                      <Save size={18} />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1A1E]/80 via-[#141418]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-[#2A2A2E] rounded-3xl p-4 sm:p-8 transition-all duration-700'>
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

                  <div className='space-y-4 sm:space-y-6 max-w-md'>
                    <InputField
                      label='Current Password'
                      type='password'
                      placeholder='Enter current password'
                    />
                    <InputField
                      label='New Password'
                      type='password'
                      placeholder='Enter new password'
                    />
                    <InputField
                      label='Confirm Password'
                      type='password'
                      placeholder='Confirm new password'
                    />
                    <div className='pt-3 sm:pt-4 flex justify-end md:-mr-4'>
                      <button className='bg-gradient-to-r from-[#D4AF37] to-[#E6C547] text-black px-8 h-9 rounded-2xl font-bold text-sm hover:from-[#E6C547] hover:to-[#D4AF37] transition-all duration-300 transform hover:scale-105'>
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className='space-y-4 sm:space-y-8'>
              {/* Billing */}
              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1A1E]/80 via-[#141418]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-[#2A2A2E] rounded-3xl p-4 sm:p-8 transition-all duration-700'>
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
                          className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-[#0A0A0C]/80 to-[#0D0D0F]/60 border border-[#1E1E21] rounded-2xl transition-all duration-300 group/invoice'
                        >
                          <div className='flex-1'>
                            <div className='text-[#EDEDED] font-semibold text-base transition-colors duration-300'>
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

              {/* Danger Zone */}
              <div className='relative overflow-hidden bg-gradient-to-br from-[#1A1214]/80 via-[#141114]/60 to-[#0A0A0C]/90 backdrop-blur-sm border border-red-500/30 rounded-3xl p-4 sm:p-8 transition-all duration-700'>
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
                    <button className='bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 px-6 h-9 rounded-2xl font-bold text-sm hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 transform hover:scale-105'>
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
