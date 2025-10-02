// File: client/src/components/Admin/EditUserModal.jsx - COMPLETE WITH GIFTED FEATURES
import { Gift, Loader2, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const EditUserModal = ({
  show,
  user,
  onClose,
  updateUserMutation,
  updateUserSubscriptionMutation,
  cancelUserSubscriptionMutation,
  reactivateUserSubscriptionMutation,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isActive: true,
  })

  const [subscriptionData, setSubscriptionData] = useState({
    planName: 'free',
    billingCycle: 'monthly',
    trialDays: 30,
    skipTrial: false,
  })

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        isActive: user.isActive ?? true,
      })
      setSubscriptionData({
        planName: user.subscription?.plan || 'free',
        billingCycle: user.subscription?.billingCycle || 'monthly',
        trialDays: 30,
        skipTrial: false,
      })
      setUpdateMessage('')
    }
  }, [user])

  const subscriptionPlans = [
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'empire', label: 'Empire' },
  ]

  const billingCycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateMessage('Updating user information...')

    try {
      await updateUserMutation.mutateAsync({
        userId: user._id,
        userData: formData,
      })
      setTimeout(() => onClose(), 500)
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setIsUpdating(false)
      setUpdateMessage('')
    }
  }

  const handleSubscriptionUpdate = async () => {
    setIsUpdating(true)

    if (subscriptionData.planName === 'free') {
      setUpdateMessage('Canceling subscription...')
      try {
        await cancelUserSubscriptionMutation.mutateAsync({
          userId: user._id,
          immediate: true,
        })
        setUpdateMessage('Subscription cancelled successfully!')
        setTimeout(() => onClose(), 1000)
      } catch (error) {
        console.error('Cancel failed:', error)
        setUpdateMessage('Failed to cancel subscription')
      }
    } else {
      setUpdateMessage(`Gifting ${subscriptionData.planName} plan...`)
      try {
        await updateUserSubscriptionMutation.mutateAsync({
          userId: user._id,
          subscriptionData: {
            planName: subscriptionData.planName,
            billingCycle: subscriptionData.billingCycle,
            trialDays: subscriptionData.trialDays,
            skipTrial: subscriptionData.skipTrial,
            isGifted: true, // ← ADD THIS LINE - all admin-assigned subscriptions are gifted
          },
        })
        setUpdateMessage('Subscription gifted successfully!')
        setTimeout(() => onClose(), 1000)
      } catch (error) {
        console.error('Update failed:', error)
        setUpdateMessage('Failed to gift subscription')
      }
    }

    setIsUpdating(false)
  }

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this user's subscription?"
      )
    ) {
      return
    }

    setIsUpdating(true)
    setUpdateMessage('Canceling subscription...')

    try {
      await cancelUserSubscriptionMutation.mutateAsync({
        userId: user._id,
        immediate: false,
      })
      setUpdateMessage('Subscription will cancel at period end')
      setTimeout(() => onClose(), 1000)
    } catch (error) {
      console.error('Cancel failed:', error)
      setUpdateMessage('Failed to cancel subscription')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setIsUpdating(true)
    setUpdateMessage('Reactivating subscription...')

    try {
      await reactivateUserSubscriptionMutation.mutateAsync(user._id)
      setUpdateMessage('Subscription reactivated!')
      setTimeout(() => onClose(), 1000)
    } catch (error) {
      console.error('Reactivation failed:', error)
      setUpdateMessage('Failed to reactivate')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!show || !user) return null

  const currentSubscription = user.subscription
  const hasActiveSubscription = currentSubscription?.isActive
  const daysRemaining = currentSubscription?.daysRemaining || 0
  const isGifted = currentSubscription?.isGifted || false

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-[#0f0f10] border border-black rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto scroll-thin'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>Edit User</h3>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className='text-gray-400 hover:text-white disabled:opacity-50'
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading/Status Message */}
        {updateMessage && (
          <div className='mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2'>
            <Loader2 className='animate-spin text-blue-400' size={16} />
            <span className='text-sm text-blue-400'>{updateMessage}</span>
          </div>
        )}

        {/* User Information Section */}
        <div className='space-y-4 mb-6'>
          <div>
            <label className='block text-sm font-medium text-gray-400 mb-1'>
              Name
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isUpdating}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-50'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-400 mb-1'>
              Email
            </label>
            <input
              type='email'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isUpdating}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-50'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-400 mb-1'>
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              disabled={isUpdating}
              className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-50'
            >
              <option value='user'>User</option>
              <option value='admin'>Admin</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='isActive'
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              disabled={isUpdating}
              className='w-4 h-4'
            />
            <label htmlFor='isActive' className='text-sm text-gray-400'>
              Active Account
            </label>
          </div>

          <div className='flex gap-3 pt-4'>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className='h-8 flex-1 flex items-center justify-center px-4 py-2 border text-sm border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className='h-8 flex-1 px-4 py-2 bg-[#d4af37] text-black rounded-lg font-medium text-sm hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {isUpdating && <Loader2 className='animate-spin' size={16} />}
              {isUpdating ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </div>

        {/* Subscription Management Section */}
        <div className='border-t border-gray-700 pt-6'>
          <h4 className='text-sm font-medium text-yellow-500 mb-4'>
            Subscription Management
          </h4>

          <div className='space-y-4'>
            {/* Current Subscription Info with Gifted Status */}
            <div className='bg-gray-800 rounded-lg p-3 border border-gray-700'>
              <div className='text-xs text-gray-400 mb-1'>Current Status</div>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm items-center'>
                  <span className='text-gray-400'>Plan:</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-white capitalize'>
                      {currentSubscription?.plan || 'Free'}
                    </span>
                    {isGifted && (
                      <span className='px-2 py-0.5 rounded text-xs font-medium bg-pink-500/20 text-pink-400 flex items-center gap-1'>
                        <Gift size={10} />
                        Gifted
                      </span>
                    )}
                  </div>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Status:</span>
                  <span
                    className={
                      hasActiveSubscription ? 'text-green-400' : 'text-gray-400'
                    }
                  >
                    {currentSubscription?.status || 'No subscription'}
                  </span>
                </div>
                {hasActiveSubscription && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Days Remaining:</span>
                    <span className='text-white'>{daysRemaining}</span>
                  </div>
                )}
                {currentSubscription?.endDate && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Expires:</span>
                    <span className='text-white text-xs'>
                      {formatDate(currentSubscription.endDate)}
                    </span>
                  </div>
                )}
                {isGifted && currentSubscription?.giftedAt && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-400'>Gifted On:</span>
                    <span className='text-pink-400 text-xs'>
                      {formatDate(currentSubscription.giftedAt)}
                    </span>
                  </div>
                )}

                {/* Gifted Subscription Info Box */}
                {isGifted && (
                  <div className='mt-2 p-2 bg-pink-500/10 border border-pink-500/30 rounded'>
                    <div className='text-xs text-pink-400'>
                      This is an admin-gifted subscription (not counted in
                      revenue)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Change Controls */}
            <div>
              <label className='block text-sm font-medium text-gray-400 mb-1'>
                Change Plan To
              </label>
              <select
                value={subscriptionData.planName}
                onChange={(e) =>
                  setSubscriptionData({
                    ...subscriptionData,
                    planName: e.target.value,
                  })
                }
                disabled={isUpdating}
                className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-50'
              >
                {subscriptionPlans.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                    {plan.value === 'free' &&
                    currentSubscription?.plan !== 'free'
                      ? ' (Cancel subscription)'
                      : plan.value !== 'free' &&
                        (!currentSubscription ||
                          currentSubscription.plan === 'free')
                      ? ' (Gift with trial)'
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {subscriptionData.planName !== 'free' && (
              <>
                <div>
                  <label className='block text-sm font-medium text-gray-400 mb-1'>
                    Billing Cycle
                  </label>
                  <select
                    value={subscriptionData.billingCycle}
                    onChange={(e) =>
                      setSubscriptionData({
                        ...subscriptionData,
                        billingCycle: e.target.value,
                      })
                    }
                    disabled={isUpdating}
                    className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-50'
                  >
                    {billingCycles.map((cycle) => (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-400 mb-1'>
                    Trial Days
                  </label>
                  <input
                    type='number'
                    min='0'
                    max='90'
                    value={subscriptionData.trialDays}
                    onChange={(e) =>
                      setSubscriptionData({
                        ...subscriptionData,
                        trialDays: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={isUpdating}
                    className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white disabled:opacity-50'
                  />
                </div>

                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id='skipTrial'
                    checked={subscriptionData.skipTrial}
                    onChange={(e) =>
                      setSubscriptionData({
                        ...subscriptionData,
                        skipTrial: e.target.checked,
                      })
                    }
                    disabled={isUpdating}
                    className='w-4 h-4'
                  />
                  <label htmlFor='skipTrial' className='text-sm text-gray-400'>
                    Skip trial period (start immediately)
                  </label>
                </div>

                {/* Admin Gift Warning */}
                <div className='bg-pink-500/10 border border-pink-500/30 rounded-lg p-3'>
                  <div className='flex items-start gap-2'>
                    <Gift
                      size={16}
                      className='text-pink-400 flex-shrink-0 mt-0.5'
                    />
                    <div className='space-y-1'>
                      <div className='text-xs font-medium text-pink-400'>
                        Admin-Gifted Subscription
                      </div>
                      <div className='text-xs text-pink-300'>
                        This subscription will be marked as "admin-gifted" and
                        will NOT:
                      </div>
                      <ul className='text-xs text-pink-300 space-y-0.5 ml-3 list-disc'>
                        <li>Create earnings/commissions for referrers</li>
                        <li>Count towards revenue statistics</li>
                        <li>Appear in financial reports</li>
                      </ul>
                      <div className='text-xs text-pink-300 mt-1'>
                        The user will receive full access to plan features.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className='flex gap-2 pt-4'>
              <button
                onClick={handleSubscriptionUpdate}
                disabled={isUpdating}
                className='h-8 flex-1 px-3 py-2 bg-[#d4af37] text-black text-sm rounded-lg font-medium hover:bg-[#b89522] disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {isUpdating && <Loader2 className='animate-spin' size={14} />}
                Update Plan
              </button>

              {hasActiveSubscription &&
                currentSubscription?.plan !== 'free' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isUpdating}
                    className='flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50'
                  >
                    Cancel
                  </button>
                )}

              {currentSubscription?.cancelAtPeriodEnd && (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={isUpdating}
                  className='flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50'
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUserModal
