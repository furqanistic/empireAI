import {
  Bot,
  ChevronDown,
  ChevronUp,
  Crown,
  DollarSign,
  History,
  Loader,
  Maximize2,
  MessageCircle,
  Minimize2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

const AscendAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(true) // Set to true for demo
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'history'
  const [inputMessage, setInputMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [activeChatId, setActiveChatId] = useState('demo-chat')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Demo data
  const [messages, setMessages] = useState([
    {
      _id: '1',
      type: 'assistant',
      content:
        "Hello! I'm ready to help you build your digital empire. What would you like to work on today?",
      timestamp: new Date().getTime() - 60000,
    },
    {
      _id: '2',
      type: 'user',
      content:
        'I want to create a new digital product. Can you help me brainstorm some ideas?',
      timestamp: new Date().getTime() - 30000,
    },
    {
      _id: '3',
      type: 'assistant',
      content:
        "Absolutely! Let's explore some profitable digital product ideas. I can help you with online courses, software tools, digital templates, or coaching programs. What industry or niche interests you most?",
      timestamp: new Date().getTime() - 15000,
    },
  ])

  const [sendingMessage, setSendingMessage] = useState(false)
  const [historyLoading] = useState(false)

  const conversationHistory = [
    {
      _id: '1',
      title: 'Product Launch Strategy',
      lastMessage: {
        content:
          'Great! Let me create a comprehensive launch plan for your course.',
      },
      lastActivity: new Date().getTime() - 86400000,
      messageCount: 15,
    },
    {
      _id: '2',
      title: 'Affiliate Marketing Setup',
      lastMessage: {
        content: 'Here are the top affiliate networks for your niche.',
      },
      lastActivity: new Date().getTime() - 172800000,
      messageCount: 8,
    },
  ]

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && currentView === 'chat' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized, currentView])

  // Handle unread count
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage) return

    const messageContent = inputMessage.trim()
    const newMessage = {
      _id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date().getTime(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputMessage('')
    setSendingMessage(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        _id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          "That's a great question! Let me help you with that. I'll analyze your request and provide you with actionable insights to grow your digital empire.",
        timestamp: new Date().getTime(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setSendingMessage(false)
    }, 1500)
  }

  const handleQuickAction = async (actionType) => {
    if (sendingMessage) return

    const quickActionMessages = {
      product_creation:
        'I want to create a new digital product. Can you guide me through the process?',
      growth_strategy:
        'Help me develop a growth strategy to scale my business and increase revenue.',
      affiliate_marketing:
        'I want to build an affiliate marketing program. Where should I start?',
      viral_content:
        'Create viral content hooks that will engage my audience and drive conversions.',
    }

    const message = quickActionMessages[actionType]
    if (message) {
      setInputMessage(message)
      setShowQuickActions(false)
      // Focus input after setting message
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setUnreadCount(0)
    if (!isOpen) {
      setCurrentView('chat')
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatHistoryDate = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const handleClearChat = async () => {
    setMessages([
      {
        _id: 'welcome',
        type: 'assistant',
        content:
          "Hello! I'm ready to help you build your digital empire. What would you like to work on today?",
        timestamp: new Date().getTime(),
      },
    ])
  }

  const loadHistoryConversation = (historyItem) => {
    setCurrentView('chat')
    // Simulate loading a conversation
    setMessages([
      {
        _id: 'loaded-1',
        type: 'user',
        content: 'I need help with my product launch strategy.',
        timestamp: new Date().getTime() - 120000,
      },
      {
        _id: 'loaded-2',
        type: 'assistant',
        content:
          "Great! Let me create a comprehensive launch plan for your course. We'll cover pre-launch, launch day, and post-launch strategies.",
        timestamp: new Date().getTime() - 60000,
      },
    ])
  }

  const handleDeleteChat = async (chatId) => {
    console.log('Deleting chat:', chatId)
  }

  // Improved Quick Actions Component
  const QuickActions = () => (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        showQuickActions ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className='p-4 border-t border-[#1E1E21] bg-[#0B0B0C]'>
        <div className='text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3 flex items-center gap-2'>
          <Sparkles size={12} className='text-[#D4AF37]' />
          Quick Actions
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <button
            onClick={() => handleQuickAction('product_creation')}
            disabled={sendingMessage}
            className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <div className='flex items-center gap-2 mb-2'>
              <Bot size={14} className='text-[#D4AF37]' />
              <span className='text-[#EDEDED] text-xs font-medium'>
                Product Builder
              </span>
            </div>
            <p className='text-gray-400 text-[10px] leading-tight'>
              Create digital products with AI
            </p>
          </button>

          <button
            onClick={() => handleQuickAction('growth_strategy')}
            disabled={sendingMessage}
            className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <div className='flex items-center gap-2 mb-2'>
              <DollarSign size={14} className='text-emerald-400' />
              <span className='text-[#EDEDED] text-xs font-medium'>
                Growth Strategy
              </span>
            </div>
            <p className='text-gray-400 text-[10px] leading-tight'>
              Optimize revenue streams
            </p>
          </button>

          <button
            onClick={() => handleQuickAction('affiliate_marketing')}
            disabled={sendingMessage}
            className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <div className='flex items-center gap-2 mb-2'>
              <Star size={14} className='text-blue-400' />
              <span className='text-[#EDEDED] text-xs font-medium'>
                Affiliate Army
              </span>
            </div>
            <p className='text-gray-400 text-[10px] leading-tight'>
              Scale with affiliates
            </p>
          </button>

          <button
            onClick={() => handleQuickAction('viral_content')}
            disabled={sendingMessage}
            className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <div className='flex items-center gap-2 mb-2'>
              <Zap size={14} className='text-purple-400' />
              <span className='text-[#EDEDED] text-xs font-medium'>
                Viral Hooks
              </span>
            </div>
            <p className='text-gray-400 text-[10px] leading-tight'>
              Generate engaging content
            </p>
          </button>
        </div>
      </div>
    </div>
  )

  const MessageBubble = ({ message }) => (
    <div
      className={`flex ${
        message.type === 'user' ? 'justify-end' : 'justify-start'
      } mb-4`}
    >
      <div
        className={`flex ${
          message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
        } items-start gap-3 max-w-[85%]`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.type === 'user'
              ? 'bg-[#D4AF37]'
              : 'bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80'
          }`}
        >
          {message.type === 'user' ? (
            <User size={16} className='text-black' />
          ) : (
            <Crown size={16} className='text-black' />
          )}
        </div>

        {/* Message Content */}
        <div
          className={`rounded-xl px-4 py-3 ${
            message.type === 'user'
              ? 'bg-[#D4AF37] text-black'
              : 'bg-[#121214] border border-[#1E1E21] text-[#EDEDED]'
          } ${message.status === 'sending' ? 'opacity-70' : ''}`}
        >
          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
            {message.content}
          </p>
          <div className='flex items-center justify-between mt-2'>
            <p
              className={`text-xs ${
                message.type === 'user' ? 'text-black/70' : 'text-gray-400'
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
            {message.status === 'sending' && (
              <Loader size={12} className='animate-spin text-gray-400' />
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Empty State Component
  const EmptyState = () => (
    <div className='flex flex-col items-center justify-center h-full text-center p-8'>
      <div className='w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80 rounded-full flex items-center justify-center mb-4'>
        <Crown size={24} className='text-black' />
      </div>
      <h3 className='text-[#EDEDED] font-semibold text-lg mb-2'>
        Welcome to Empire AI
      </h3>
      <p className='text-gray-400 text-sm mb-6 max-w-64'>
        Ready to build your digital empire? Ask me anything or try a quick
        action below.
      </p>
      <button
        onClick={() => setShowQuickActions(true)}
        className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#D4AF37]/90 transition-colors flex items-center gap-2'
      >
        <Sparkles size={16} />
        Show Quick Actions
      </button>
    </div>
  )

  const HistoryView = () => (
    <div className='flex flex-col h-full'>
      {/* History Header */}
      <div className='p-4 border-b border-[#1E1E21] bg-[#0B0B0C]'>
        <div className='flex items-center justify-between'>
          <h3 className='text-[#EDEDED] font-semibold text-sm'>
            Conversation History
          </h3>
          <button
            onClick={() => setCurrentView('chat')}
            className='text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm font-medium'
          >
            Back to Chat
          </button>
        </div>
      </div>

      {/* History List */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {historyLoading ? (
          <div className='text-center py-8'>
            <Loader
              size={24}
              className='text-[#D4AF37] animate-spin mx-auto mb-2'
            />
            <p className='text-gray-400 text-sm'>Loading conversations...</p>
          </div>
        ) : conversationHistory.length > 0 ? (
          conversationHistory.map((conversation) => (
            <div key={conversation._id} className='group relative'>
              <button
                onClick={() => loadHistoryConversation(conversation)}
                className='w-full text-left p-4 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200'
              >
                <div className='flex items-start justify-between mb-2'>
                  <h4 className='text-[#EDEDED] font-medium text-sm group-hover:text-[#D4AF37] transition-colors line-clamp-1 pr-8'>
                    {conversation.title}
                  </h4>
                  <span className='text-xs text-gray-400 flex-shrink-0'>
                    {formatHistoryDate(conversation.lastActivity)}
                  </span>
                </div>
                <p className='text-gray-400 text-xs leading-relaxed mb-2 line-clamp-2'>
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-500'>
                    {conversation.messageCount} messages
                  </span>
                  <span className='text-xs text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity'>
                    Load →
                  </span>
                </div>
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteChat(conversation._id)
                }}
                className='opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300'
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        ) : (
          <div className='text-center py-8'>
            <History size={48} className='text-gray-600 mx-auto mb-3' />
            <p className='text-gray-400 text-sm mb-2'>
              No conversation history yet
            </p>
            <p className='text-gray-500 text-xs'>
              Start chatting to build your history!
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 w-96 max-w-[calc(100vw-2rem)] bg-[#0B0B0C] border border-[#1E1E21] rounded-xl shadow-2xl z-50 transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[calc(100vh-8rem)]'
          }`}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-[#1E1E21] bg-gradient-to-r from-[#121214] to-[#1A1A1C] rounded-t-xl'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80 rounded-lg flex items-center justify-center'>
                <Crown size={16} className='text-black' />
              </div>
              <div>
                <h3 className='text-[#EDEDED] font-semibold text-sm'>
                  Empire AI
                </h3>
                <div className='flex items-center gap-1'>
                  <div className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></div>
                  <span className='text-emerald-400 text-xs'>Online</span>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-1'>
              {/* New Chat Button */}
              {!isMinimized && currentView === 'chat' && (
                <button
                  onClick={() =>
                    setMessages([
                      {
                        _id: 'new-welcome',
                        type: 'assistant',
                        content:
                          "Hello! I'm ready to help you build your digital empire. What would you like to work on today?",
                        timestamp: new Date().getTime(),
                      },
                    ])
                  }
                  className='p-1.5 rounded-lg hover:bg-[#1E1E21] transition-colors'
                  title='New Chat'
                >
                  <Plus
                    size={14}
                    className='text-gray-400 hover:text-[#D4AF37]'
                  />
                </button>
              )}

              {/* Quick Actions Toggle */}
              {!isMinimized &&
                currentView === 'chat' &&
                messages.length > 0 && (
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className='p-1.5 rounded-lg hover:bg-[#1E1E21] transition-colors'
                    title='Quick Actions'
                  >
                    <Sparkles
                      size={14}
                      className={`transition-colors ${
                        showQuickActions
                          ? 'text-[#D4AF37]'
                          : 'text-gray-400 hover:text-[#D4AF37]'
                      }`}
                    />
                  </button>
                )}

              {/* View Toggle */}
              {!isMinimized && (
                <button
                  onClick={() =>
                    setCurrentView(currentView === 'chat' ? 'history' : 'chat')
                  }
                  className='p-1.5 rounded-lg hover:bg-[#1E1E21] transition-colors'
                  title={
                    currentView === 'chat' ? 'View History' : 'Back to Chat'
                  }
                >
                  <History
                    size={14}
                    className='text-gray-400 hover:text-[#D4AF37]'
                  />
                </button>
              )}

              {/* Clear Chat */}
              {!isMinimized && currentView === 'chat' && activeChatId && (
                <button
                  onClick={handleClearChat}
                  className='p-1.5 rounded-lg hover:bg-[#1E1E21] transition-colors'
                  title='Clear Chat'
                >
                  <RotateCcw
                    size={14}
                    className='text-gray-400 hover:text-yellow-400'
                  />
                </button>
              )}

              <button
                onClick={toggleMinimize}
                className='p-1.5 rounded-lg hover:bg-[#1E1E21] transition-colors'
              >
                {isMinimized ? (
                  <Maximize2 size={14} className='text-gray-400' />
                ) : (
                  <Minimize2 size={14} className='text-gray-400' />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className='p-1.5 rounded-lg hover:bg-red-500/20 transition-colors'
              >
                <X size={14} className='text-gray-400 hover:text-red-400' />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {currentView === 'chat' ? (
                <div className='flex flex-col h-full'>
                  {/* Messages Area - Now takes full available space */}
                  <div
                    ref={chatContainerRef}
                    className='flex-1 overflow-y-auto p-4 bg-[#0B0B0C] min-h-0'
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#1E1E21 transparent',
                    }}
                  >
                    {messages.length === 0 ? (
                      <EmptyState />
                    ) : (
                      <>
                        {messages.map((message) => (
                          <MessageBubble key={message._id} message={message} />
                        ))}

                        {/* Typing Indicator */}
                        {sendingMessage && (
                          <div className='flex justify-start mb-4'>
                            <div className='flex items-start gap-3 max-w-[85%]'>
                              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80 flex items-center justify-center'>
                                <Crown size={16} className='text-black' />
                              </div>
                              <div className='bg-[#121214] border border-[#1E1E21] rounded-xl px-4 py-3'>
                                <div className='flex items-center gap-1'>
                                  <div className='w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce'></div>
                                  <div
                                    className='w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce'
                                    style={{ animationDelay: '0.1s' }}
                                  ></div>
                                  <div
                                    className='w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce'
                                    style={{ animationDelay: '0.2s' }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Collapsible Quick Actions */}
                  <QuickActions />

                  {/* Input Section - Always at bottom */}
                  <div className='p-4 border-t border-[#1E1E21] bg-[#0B0B0C] rounded-b-xl flex-shrink-0'>
                    <div className='flex items-end gap-3'>
                      <div className='flex-1 relative'>
                        <textarea
                          ref={inputRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder='Ask Empire AI anything...'
                          disabled={sendingMessage}
                          className='w-full bg-[#121214] border border-[#1E1E21] rounded-lg px-4 py-3 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 resize-none min-h-[44px] max-h-20 disabled:opacity-50 disabled:cursor-not-allowed'
                          rows={1}
                        />
                      </div>

                      {/* Quick Actions Toggle Button in Input */}
                      {!showQuickActions && messages.length > 0 && (
                        <button
                          onClick={() => setShowQuickActions(true)}
                          className='w-11 h-11 bg-[#121214] border border-[#1E1E21] text-gray-400 rounded-lg flex items-center justify-center hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors flex-shrink-0'
                          title='Quick Actions'
                        >
                          <Sparkles size={18} />
                        </button>
                      )}

                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || sendingMessage}
                        className='w-11 h-11 bg-[#D4AF37] text-black rounded-lg flex items-center justify-center hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0'
                      >
                        {sendingMessage ? (
                          <Loader size={18} className='animate-spin' />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>

                    <div className='flex items-center justify-between mt-3'>
                      <p className='text-xs text-gray-500'>
                        Press Enter to send, Shift + Enter for new line
                      </p>
                      {showQuickActions && (
                        <button
                          onClick={() => setShowQuickActions(false)}
                          className='text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors flex items-center gap-1'
                        >
                          <ChevronUp size={12} />
                          Hide Actions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <HistoryView />
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className='fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/90 text-black rounded-full shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group'
        >
          <MessageCircle
            size={24}
            className='transition-transform duration-300 group-hover:scale-110'
          />
          {unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Pulse animation for attention */}
          <div className='absolute inset-0 rounded-full bg-[#D4AF37] animate-ping opacity-20'></div>
        </button>
      )}
    </>
  )
}

export default AscendAIChatbot
