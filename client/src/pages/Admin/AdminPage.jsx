// File: client/src/pages/Admin/AdminPage.jsx - COMPLETE WITH GIFTED SUBSCRIPTIONS
import EditUserModal from '@/components/Admin/EditUserModal'
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  Crown,
  DollarSign,
  Edit,
  Eye,
  Gift,
  Info,
  Mail,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import React, { useCallback, useState } from 'react'
import {
  useApprovePayout,
  useCancelUserSubscription,
  useCompletePayout,
  useCreateUser,
  useDeleteUser,
  useGetAdminStats,
  useGetAllUsers,
  useGetPayouts,
  useReactivateUserSubscription,
  useRejectPayout,
  useUpdateUser,
  useUpdateUserSubscription,
} from '../../hooks/useAdmin'
import Layout from '../Layout/Layout'

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [showUserModal, setShowUserModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  const [filters, setFilters] = useState({
    users: { search: '', role: 'all', status: 'all', page: 1, limit: 10 },
    payouts: { search: '', status: 'all', page: 1, limit: 10 },
  })

  // API Hooks
  const { data: statsData, isLoading: statsLoading } = useGetAdminStats()
  const { data: usersData, isLoading: usersLoading } = useGetAllUsers(
    filters.users
  )
  const { data: payoutsData, isLoading: payoutsLoading } = useGetPayouts(
    filters.payouts
  )

  // Mutations
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()
  const createUserMutation = useCreateUser()
  const approvePayoutMutation = useApprovePayout()
  const rejectPayoutMutation = useRejectPayout()
  const completePayoutMutation = useCompletePayout()
  const updateUserSubscriptionMutation = useUpdateUserSubscription()
  const cancelUserSubscriptionMutation = useCancelUserSubscription()
  const reactivateUserSubscriptionMutation = useReactivateUserSubscription()

  // Extract data with fallbacks
  const stats = statsData?.data || {
    totalUsers: 0,
    activeUsers: 0,
    totalCommissions: 0,
    pendingPayouts: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    giftedSubscriptions: 0,
  }

  const users = usersData?.data?.users || []
  const usersPagination = {
    currentPage: usersData?.currentPage || 1,
    totalPages: usersData?.totalPages || 1,
    totalResults: usersData?.totalResults || 0,
    results: usersData?.results || 0,
  }

  const payouts = payoutsData?.data?.payouts || []
  const payoutsPagination = {
    currentPage: payoutsData?.currentPage || 1,
    totalPages: payoutsData?.totalPages || 1,
    totalResults: payoutsData?.totalResults || 0,
    results: payoutsData?.results || 0,
  }

  // Add User Modal Component
  const AddUserModal = ({ show, onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: 'user',
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      createUserMutation.mutate(formData, {
        onSuccess: () => {
          onClose()
          setFormData({ name: '', email: '', password: '', role: 'user' })
        },
      })
    }

    if (!show) return null

    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-[#EDEDED]'>
              Add New User
            </h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-[#EDEDED]'
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
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
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2 text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40'
                required
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
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2 text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-400 mb-1'>
                Password
              </label>
              <input
                type='password'
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2 text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40'
                required
                minLength={8}
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
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2 text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40'
              >
                <option value='user'>User</option>
                <option value='admin'>Admin</option>
              </select>
            </div>

            <div className='flex gap-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={createUserMutation.isPending}
                className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50'
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // User Detail Modal Component - UPDATED WITH GIFTED INFO
  const UserDetailModal = ({ show, user, onClose }) => {
    if (!show || !user) return null

    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-semibold text-[#EDEDED]'>
              User Details
            </h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-[#EDEDED]'
            >
              <X size={20} />
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* User Info */}
            <div className='space-y-4'>
              <div>
                <h4 className='text-sm font-medium text-[#D4AF37] mb-3'>
                  Basic Information
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Name:</span>
                    <span className='text-[#EDEDED]'>{user.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Email:</span>
                    <span className='text-[#EDEDED]'>{user.email}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Role:</span>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Status:</span>
                    <StatusBadge
                      status={user.isActive ? 'active' : 'inactive'}
                      type='user'
                    />
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Joined:</span>
                    <span className='text-[#EDEDED]'>
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Last Login:</span>
                    <span className='text-[#EDEDED]'>
                      {formatDate(user.lastLogin)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Subscription Info with Gifted Status */}
              <div>
                <h4 className='text-sm font-medium text-[#D4AF37] mb-3'>
                  Subscription
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-400'>Plan:</span>
                    <div className='flex items-center gap-2'>
                      <span className='text-[#EDEDED] capitalize'>
                        {user.subscription?.plan || 'Free'}
                      </span>
                      {user.subscription?.isGifted && (
                        <span className='px-2 py-1 rounded-lg text-xs font-medium bg-pink-500/10 text-pink-400 flex items-center gap-1'>
                          <Gift size={10} />
                          Gifted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Status:</span>
                    <span
                      className={`${
                        user.subscription?.isActive
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {user.subscription?.status || 'No subscription'}
                    </span>
                  </div>

                  {user.subscription?.isGifted && (
                    <>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Gifted By:</span>
                        <span className='text-pink-400'>Admin</span>
                      </div>
                      {user.subscription?.giftedAt && (
                        <div className='flex justify-between'>
                          <span className='text-gray-400'>Gifted On:</span>
                          <span className='text-[#EDEDED]'>
                            {formatDate(user.subscription.giftedAt)}
                          </span>
                        </div>
                      )}
                      <div className='bg-pink-500/10 border border-pink-500/30 rounded-lg p-2 mt-2'>
                        <div className='text-xs text-pink-400'>
                          This subscription was gifted by admin and does not
                          count towards revenue or earnings.
                        </div>
                      </div>
                    </>
                  )}

                  {user.subscription?.isActive && (
                    <>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>Days Remaining:</span>
                        <span className='text-[#EDEDED]'>
                          {user.subscription?.daysRemaining || 0}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400'>End Date:</span>
                        <span className='text-[#EDEDED]'>
                          {formatDate(user.subscription?.endDate)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Total Spent:</span>
                    <span className='text-[#EDEDED]'>
                      ${user.totalSpent || 0}
                      {user.subscription?.isGifted && (
                        <span className='text-xs text-pink-400 ml-1'>
                          (Gifted)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial & Referral Info */}
            <div className='space-y-4'>
              <div>
                <h4 className='text-sm font-medium text-[#D4AF37] mb-3'>
                  Referral System
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Referral Code:</span>
                    <span className='text-[#EDEDED] font-mono'>
                      {user.referralCode || 'None'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Total Referrals:</span>
                    <span className='text-[#EDEDED]'>
                      {user.referralStats?.totalReferrals || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Active Referrals:</span>
                    <span className='text-[#EDEDED]'>
                      {user.referralStats?.activeReferrals || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Referral Rewards:</span>
                    <span className='text-[#EDEDED]'>
                      ${user.referralStats?.referralRewards || 0}
                    </span>
                  </div>
                  {user.referredBy && (
                    <div className='flex justify-between'>
                      <span className='text-gray-400'>Referred By:</span>
                      <span className='text-[#EDEDED]'>
                        {user.referredBy.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className='text-sm font-medium text-[#D4AF37] mb-3'>
                  Commissions
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Total Earned:</span>
                    <span className='text-[#EDEDED]'>
                      ${user.totalCommissions || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Pending:</span>
                    <span className='text-[#EDEDED]'>
                      ${user.pendingCommissions || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Paid Out:</span>
                    <span className='text-[#EDEDED]'>
                      ${user.paidCommissions || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-[#1E1E21]'>
            <button
              onClick={() => {
                setEditingUser(user)
                onClose()
              }}
              className='px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
            >
              Edit User
            </button>
            <button
              onClick={onClose}
              className='px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Payout Detail Modal Component
  const PayoutDetailModal = ({ show, payout, onClose }) => {
    if (!show || !payout) return null

    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-[#EDEDED]'>
              Payout Details
            </h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-[#EDEDED]'
            >
              <X size={20} />
            </button>
          </div>

          <div className='space-y-4'>
            <div className='flex justify-between'>
              <span className='text-gray-400'>User:</span>
              <span className='text-[#EDEDED]'>
                {payout.user?.name || 'Unknown'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Email:</span>
              <span className='text-[#EDEDED]'>
                {payout.user?.email || 'Unknown'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Amount:</span>
              <span className='text-[#EDEDED] font-semibold'>
                ${payout.amount}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Commission:</span>
              <span className='text-[#EDEDED]'>${payout.commission}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Method:</span>
              <span className='text-[#EDEDED]'>{payout.method}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Account:</span>
              <span className='text-[#EDEDED]'>{payout.accountInfo}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Status:</span>
              <StatusBadge status={payout.status} type='payout' />
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Requested:</span>
              <span className='text-[#EDEDED]'>
                {formatDate(payout.requestedAt)}
              </span>
            </div>
            {payout.processedAt && (
              <div className='flex justify-between'>
                <span className='text-gray-400'>Processed:</span>
                <span className='text-[#EDEDED]'>
                  {formatDate(payout.processedAt)}
                </span>
              </div>
            )}
          </div>

          <div className='flex gap-3 pt-4 mt-4 border-t border-[#1E1E21]'>
            {payout.status === 'pending' && (
              <>
                <button
                  onClick={() => {
                    handlePayoutAction('approve', payout._id)
                    onClose()
                  }}
                  className='flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-300'
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handlePayoutAction('reject', payout._id)
                    onClose()
                  }}
                  className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-300'
                >
                  Reject
                </button>
              </>
            )}
            {payout.status === 'approved' && (
              <button
                onClick={() => {
                  handlePayoutAction('complete', payout._id)
                  onClose()
                }}
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300'
              >
                Mark Complete
              </button>
            )}
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon, color }) => (
    <div className='relative bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-3 sm:p-5 hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-all duration-300 group overflow-hidden'>
      <div
        className={`absolute top-0 right-0 w-12 h-12 sm:w-20 sm:h-20 ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300`}
      ></div>
      <div className='relative'>
        <div className='flex items-start justify-between mb-2 sm:mb-3'>
          <div className='space-y-1 flex-1 min-w-0'>
            <h3 className='text-gray-400 text-xs sm:text-sm font-medium leading-tight truncate'>
              {title}
            </h3>
          </div>
          <div
            className={`${color} p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-black shadow-lg flex-shrink-0 ml-2`}
          >
            <div className='block sm:hidden'>
              {React.cloneElement(icon, { size: 14 })}
            </div>
            <div className='hidden sm:block'>{icon}</div>
          </div>
        </div>
        <div className='text-lg sm:text-2xl font-bold text-[#EDEDED] leading-none'>
          {value}
        </div>
      </div>
    </div>
  )

  const StatusBadge = ({ status, type = 'user' }) => {
    const getStatusConfig = () => {
      if (type === 'user') {
        return {
          active: { color: 'bg-green-500/10 text-green-400', label: 'Active' },
          inactive: { color: 'bg-red-500/10 text-red-400', label: 'Inactive' },
          suspended: {
            color: 'bg-yellow-500/10 text-yellow-400',
            label: 'Suspended',
          },
        }
      } else if (type === 'payout') {
        return {
          pending: {
            color: 'bg-yellow-500/10 text-yellow-400',
            label: 'Pending',
          },
          approved: {
            color: 'bg-blue-500/10 text-blue-400',
            label: 'Approved',
          },
          completed: {
            color: 'bg-green-500/10 text-green-400',
            label: 'Completed',
          },
          rejected: { color: 'bg-red-500/10 text-red-400', label: 'Rejected' },
        }
      }
    }

    const config = getStatusConfig()[status] || getStatusConfig().active
    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  const RoleBadge = ({ role }) => {
    const roleConfig = {
      admin: { color: 'bg-purple-500/10 text-purple-400', label: 'Admin' },
      user: { color: 'bg-blue-500/10 text-blue-400', label: 'User' },
    }

    const config = roleConfig[role] || roleConfig.user
    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  // UPDATED: Subscription Badge with Gifted Status
  const SubscriptionBadge = ({ plan, isActive, isGifted }) => {
    const planConfig = {
      free: {
        color: 'bg-gray-500/10 text-gray-400',
        label: 'Free',
        icon: User,
      },
      starter: {
        color: 'bg-blue-500/10 text-blue-400',
        label: 'Starter',
        icon: User,
      },
      pro: {
        color: 'bg-purple-500/10 text-purple-400',
        label: 'Pro',
        icon: Shield,
      },
      empire: {
        color: 'bg-yellow-500/10 text-yellow-400',
        label: 'Empire',
        icon: Crown,
      },
    }

    const config = planConfig[plan] || planConfig.free
    const IconComponent = config.icon

    return (
      <div className='flex items-center gap-2'>
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
            config.color
          } ${!isActive ? 'opacity-50' : ''}`}
        >
          <IconComponent size={12} />
          {config.label}
        </span>

        {isGifted && (
          <span className='px-2 py-1 rounded-lg text-xs font-medium bg-pink-500/10 text-pink-400 flex items-center gap-1'>
            <Gift size={12} />
            Gifted
          </span>
        )}
      </div>
    )
  }

  const DropdownButton = ({ value, options, onChange }) => (
    <div className='relative'>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='bg-[#121214] border border-[#1E1E21] rounded-xl px-4 h-8 text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 appearance-none pr-8 cursor-pointer w-full sm:min-w-[120px] sm:w-auto'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none'
      />
    </div>
  )

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const handleUserAction = useCallback(
    (action, userId) => {
      const user = users.find((u) => u._id === userId)
      switch (action) {
        case 'edit':
          setEditingUser(user)
          break
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUserMutation.mutate(userId)
          }
          break
        case 'view':
          setSelectedUser(user)
          setShowUserModal(true)
          break
        default:
          console.log(`${action} user:`, userId)
      }
    },
    [users, deleteUserMutation]
  )

  const handlePayoutAction = useCallback(
    (action, payoutId) => {
      switch (action) {
        case 'approve':
          if (window.confirm('Are you sure you want to approve this payout?')) {
            approvePayoutMutation.mutate(payoutId)
          }
          break
        case 'reject':
          const reason = prompt('Enter rejection reason:')
          if (reason) {
            rejectPayoutMutation.mutate({ payoutId, reason })
          }
          break
        case 'complete':
          if (window.confirm('Mark this payout as completed?')) {
            completePayoutMutation.mutate(payoutId)
          }
          break
        case 'view':
          const payout = payouts.find((p) => p._id === payoutId)
          setSelectedPayout(payout)
          setShowPayoutModal(true)
          break
        default:
          console.log(`${action} payout:`, payoutId)
      }
    },
    [
      payouts,
      approvePayoutMutation,
      rejectPayoutMutation,
      completePayoutMutation,
    ]
  )

  const updateFilters = useCallback((tab, newFilters) => {
    setFilters((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], ...newFilters },
    }))
  }, [])

  const changePage = useCallback(
    (tab, newPage) => {
      updateFilters(tab, { page: newPage })
    },
    [updateFilters]
  )

  const tabs = [
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'payouts', label: 'Commissions & Payouts', icon: DollarSign },
  ]

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const payoutStatusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const isLoading = statsLoading || usersLoading || payoutsLoading

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
              Admin Dashboard
            </h1>
            <p className='text-gray-400'>
              Manage users, roles, subscriptions, and payouts
            </p>
          </div>

          <button
            onClick={() => setShowAddUserModal(true)}
            className='bg-[#D4AF37] text-black px-6 h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap'
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>

        {/* Stats Grid - UPDATED WITH GIFTED SUBSCRIPTIONS */}
        <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4'>
          <StatCard
            title='Total Users'
            value={stats.totalUsers.toLocaleString()}
            icon={<Users size={18} />}
            color='bg-blue-500'
          />
          <StatCard
            title='Active Users'
            value={stats.activeUsers.toLocaleString()}
            icon={<User size={18} />}
            color='bg-green-500'
          />
          <StatCard
            title='New Today'
            value={stats.newUsersToday.toString()}
            icon={<UserPlus size={18} />}
            color='bg-purple-500'
          />
          <StatCard
            title='Total Revenue'
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<DollarSign size={18} />}
            color='bg-emerald-500'
          />
          <StatCard
            title='Commissions'
            value={`$${stats.totalCommissions.toLocaleString()}`}
            icon={<BarChart3 size={18} />}
            color='bg-[#D4AF37]'
          />
          <StatCard
            title='Pending Payouts'
            value={stats.pendingPayouts.toString()}
            icon={<DollarSign size={18} />}
            color='bg-orange-500'
          />

          {/* NEW: Show gifted subscriptions if any exist */}
          {stats.giftedSubscriptions > 0 && (
            <StatCard
              title='Gifted Plans'
              value={stats.giftedSubscriptions.toString()}
              icon={<Gift size={18} />}
              color='bg-pink-500'
            />
          )}
        </div>

        {/* NEW: Revenue Note if gifted subscriptions exist */}
        {stats.giftedSubscriptions > 0 && (
          <div className='bg-blue-500/10 border border-blue-500/30 rounded-xl p-4'>
            <div className='flex items-center gap-2 text-blue-400 text-sm'>
              <Info size={16} />
              <span className='font-medium'>
                Revenue excludes {stats.giftedSubscriptions} admin-gifted
                subscription{stats.giftedSubscriptions !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-8 text-center'>
            <div className='text-gray-400'>Loading...</div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
            {/* Tabs */}
            <div className='border-b border-[#1E1E21]'>
              <nav className='flex overflow-x-auto'>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-[#D4AF37] text-[#D4AF37]'
                        : 'border-transparent text-gray-400 hover:text-[#EDEDED]'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                {/* Filters */}
                <div className='p-4 sm:p-6 border-b border-[#1E1E21]'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <h2 className='text-xl font-semibold text-[#EDEDED]'>
                      Users ({usersPagination.totalResults})
                    </h2>

                    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                      <div className='relative'>
                        <Search
                          size={14}
                          className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                        />
                        <input
                          type='text'
                          placeholder='Search users...'
                          value={filters.users.search}
                          onChange={(e) =>
                            updateFilters('users', {
                              search: e.target.value,
                              page: 1,
                            })
                          }
                          className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl pl-9 pr-4 h-8 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 w-full sm:w-48'
                        />
                      </div>

                      <DropdownButton
                        value={filters.users.role}
                        options={roleOptions}
                        onChange={(value) =>
                          updateFilters('users', { role: value, page: 1 })
                        }
                      />

                      <DropdownButton
                        value={filters.users.status}
                        options={statusOptions}
                        onChange={(value) =>
                          updateFilters('users', { status: value, page: 1 })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Users Table - UPDATED WITH GIFTED STATUS */}
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-[#1E1E21]'>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          User
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Role
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Status
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Subscription
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Referrals
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Commissions
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Joined
                        </th>
                        <th className='text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-[#1E1E21]'>
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className='hover:bg-[#1A1A1C]/50 transition-all duration-200'
                        >
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-3'>
                              <div className='w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-semibold text-sm'>
                                {user.name?.charAt(0) || 'U'}
                              </div>
                              <div className='min-w-0'>
                                <div className='text-[#EDEDED] font-medium text-sm'>
                                  {user.name}
                                </div>
                                <div className='text-gray-400 text-xs truncate'>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <RoleBadge role={user.role} />
                          </td>
                          <td className='px-6 py-4'>
                            <StatusBadge
                              status={user.isActive ? 'active' : 'inactive'}
                              type='user'
                            />
                          </td>
                          <td className='px-6 py-4'>
                            <SubscriptionBadge
                              plan={user.subscription?.plan || 'free'}
                              isActive={user.subscription?.isActive}
                              isGifted={user.subscription?.isGifted || false}
                            />
                            {user.subscription?.isActive && (
                              <div className='text-xs text-gray-400 mt-1'>
                                {user.subscription?.daysRemaining || 0} days
                                left
                                {user.subscription?.isGifted && (
                                  <span className='text-pink-400 ml-1'>
                                    (Admin Gift)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className='px-6 py-4 text-[#EDEDED]'>
                            {user.referralStats?.totalReferrals || 0}
                          </td>
                          <td className='px-6 py-4'>
                            <div className='text-[#EDEDED] font-medium'>
                              ${user.totalCommissions || 0}
                            </div>
                            <div className='text-gray-400 text-xs'>
                              Pending: ${user.pendingCommissions || 0}
                            </div>
                          </td>
                          <td className='px-6 py-4 text-gray-400 text-sm'>
                            {formatDate(user.createdAt)}
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center justify-end gap-2'>
                              <button
                                onClick={() =>
                                  handleUserAction('edit', user._id)
                                }
                                className='text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1'
                                title='Edit user & subscription'
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleUserAction('view', user._id)
                                }
                                className='text-gray-400 hover:text-green-400 transition-colors duration-200 p-1'
                                title='View details'
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleUserAction('delete', user._id)
                                }
                                className='text-gray-400 hover:text-red-400 transition-colors duration-200 p-1'
                                title='Delete user'
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Users Pagination */}
                {usersPagination.totalPages > 1 && (
                  <div className='px-4 sm:px-6 py-4 border-t border-[#1E1E21] flex items-center justify-between'>
                    <div className='text-gray-400 text-sm'>
                      Showing {usersPagination.results} of{' '}
                      {usersPagination.totalResults} users
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() =>
                          changePage('users', usersPagination.currentPage - 1)
                        }
                        disabled={usersPagination.currentPage <= 1}
                        className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Previous
                      </button>
                      <span className='px-3 h-8 bg-[#D4AF37] text-black rounded-lg text-sm font-medium flex items-center'>
                        {usersPagination.currentPage}
                      </span>
                      <button
                        onClick={() =>
                          changePage('users', usersPagination.currentPage + 1)
                        }
                        disabled={
                          usersPagination.currentPage >=
                          usersPagination.totalPages
                        }
                        className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <div>
                <div className='p-4 sm:p-6 border-b border-[#1E1E21]'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <h2 className='text-xl font-semibold text-[#EDEDED]'>
                      Payouts ({payoutsPagination.totalResults})
                    </h2>

                    <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                      <div className='relative'>
                        <Search
                          size={14}
                          className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                        />
                        <input
                          type='text'
                          placeholder='Search payouts...'
                          value={filters.payouts.search}
                          onChange={(e) =>
                            updateFilters('payouts', {
                              search: e.target.value,
                              page: 1,
                            })
                          }
                          className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl pl-9 pr-4 h-8 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 w-full sm:w-48'
                        />
                      </div>

                      <DropdownButton
                        value={filters.payouts.status}
                        options={payoutStatusOptions}
                        onChange={(value) =>
                          updateFilters('payouts', { status: value, page: 1 })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-[#1E1E21]'>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          User
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Amount
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Method
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Status
                        </th>
                        <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Requested
                        </th>
                        <th className='text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-[#1E1E21]'>
                      {payouts.map((payout) => (
                        <tr
                          key={payout._id}
                          className='hover:bg-[#1A1A1C]/50 transition-all duration-200'
                        >
                          <td className='px-6 py-4'>
                            <div className='min-w-0'>
                              <div className='text-[#EDEDED] font-medium text-sm'>
                                {payout.user?.name || 'Unknown User'}
                              </div>
                              <div className='text-gray-400 text-xs truncate'>
                                {payout.user?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-[#EDEDED] font-medium'>
                            ${payout.amount}
                          </td>
                          <td className='px-6 py-4'>
                            <div className='text-[#EDEDED] text-sm'>
                              {payout.method}
                            </div>
                            <div className='text-gray-400 text-xs'>
                              {payout.accountInfo}
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <StatusBadge status={payout.status} type='payout' />
                          </td>
                          <td className='px-6 py-4 text-gray-400 text-sm'>
                            {formatDate(payout.requestedAt)}
                          </td>
                          <td className='px-6 py-4'>
                            <div className='flex items-center justify-end gap-2'>
                              {payout.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() =>
                                      handlePayoutAction('approve', payout._id)
                                    }
                                    className='text-gray-400 hover:text-green-400 transition-colors duration-200 p-1'
                                    title='Approve payout'
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handlePayoutAction('reject', payout._id)
                                    }
                                    className='text-gray-400 hover:text-red-400 transition-colors duration-200 p-1'
                                    title='Reject payout'
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              {payout.status === 'approved' && (
                                <button
                                  onClick={() =>
                                    handlePayoutAction('complete', payout._id)
                                  }
                                  className='text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1'
                                  title='Mark as completed'
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handlePayoutAction('view', payout._id)
                                }
                                className='text-gray-400 hover:text-purple-400 transition-colors duration-200 p-1'
                                title='View details'
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {payoutsPagination.totalPages > 1 && (
                  <div className='px-4 sm:px-6 py-4 border-t border-[#1E1E21] flex items-center justify-between'>
                    <div className='text-gray-400 text-sm'>
                      Showing {payoutsPagination.results} of{' '}
                      {payoutsPagination.totalResults} payouts
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() =>
                          changePage(
                            'payouts',
                            payoutsPagination.currentPage - 1
                          )
                        }
                        disabled={payoutsPagination.currentPage <= 1}
                        className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Previous
                      </button>
                      <span className='px-3 h-8 bg-[#D4AF37] text-black rounded-lg text-sm font-medium flex items-center'>
                        {payoutsPagination.currentPage}
                      </span>
                      <button
                        onClick={() =>
                          changePage(
                            'payouts',
                            payoutsPagination.currentPage + 1
                          )
                        }
                        disabled={
                          payoutsPagination.currentPage >=
                          payoutsPagination.totalPages
                        }
                        className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <AddUserModal
          show={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
        />

        <EditUserModal
          show={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          updateUserMutation={updateUserMutation}
          updateUserSubscriptionMutation={updateUserSubscriptionMutation}
          cancelUserSubscriptionMutation={cancelUserSubscriptionMutation}
          reactivateUserSubscriptionMutation={
            reactivateUserSubscriptionMutation
          }
        />

        <UserDetailModal
          show={showUserModal}
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false)
            setSelectedUser(null)
          }}
        />

        <PayoutDetailModal
          show={showPayoutModal}
          payout={selectedPayout}
          onClose={() => {
            setShowPayoutModal(false)
            setSelectedPayout(null)
          }}
        />
      </div>
    </Layout>
  )
}

export default AdminPage
