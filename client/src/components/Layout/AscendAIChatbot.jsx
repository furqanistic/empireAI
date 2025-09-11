// File: client/src/components/Layout/AscendAIChatbot.jsx
import {
  Bot,
  ChevronDown,
  Crown,
  DollarSign,
  History,
  Loader,
  Maximize2,
  MessageCircle,
  Minimize2,
  RotateCcw,
  Send,
  Star,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

const AscendAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'history'

  // Sample conversation history
  const [conversationHistory] = useState([
    {
      id: 1,
      title: 'Product Creation Strategy',
      lastMessage: "Great! I'll help you create a digital course about...",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      messageCount: 15,
    },
    {
      id: 2,
      title: 'Affiliate Marketing Setup',
      lastMessage: 'Your affiliate program structure looks solid...',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      messageCount: 8,
    },
    {
      id: 3,
      title: 'Viral Content Ideas',
      lastMessage: 'Here are 10 viral hook templates for your niche...',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      messageCount: 12,
    },
  ])

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content:
        "Welcome back to Ascend AI! I'm your Empire AI Assistant. I can help you build products, create content, develop strategies, and grow your digital empire. What would you like to work on today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)

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
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response (replace with actual Groq Cloud API call)
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)

      // Add unread count if chat is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1)
      }
    }, 1500)
  }

  // Simulate AI responses (replace with actual Groq Cloud integration)
  const generateAIResponse = (userInput) => {
    const responses = [
      'I can help you create a digital product. What type of product are you thinking about? A course, ebook, software tool, or something else?',
      "Let's build your empire! I can assist with product creation, content writing, marketing strategies, or business planning. What's your priority right now?",
      'Based on your Empire plan, I have access to advanced AI tools. Would you like me to help you with the AI Product Generator, Viral Hook Factory, or strategy development?',
      'Perfect! I can help you optimize that. Let me break down the best approach for your specific situation and provide actionable steps...',
      'For your empire-building goals, I recommend focusing on these key areas. Let me create a custom strategy tailored to your current level...',
      "I'll analyze your current setup and provide actionable recommendations. What specific challenge are you facing right now?",
      "That's a strategic question! Here's how I'd approach this based on successful empire builders I've worked with. First, let's identify your strengths...",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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
      setCurrentView('chat') // Always open to chat view
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatHistoryDate = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return timestamp.toLocaleDateString()
  }

  const clearCurrentChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content:
          "Chat cleared! I'm ready to help you with your next empire-building task. What would you like to work on?",
        timestamp: new Date(),
      },
    ])
  }

  const loadHistoryConversation = (historyItem) => {
    // Simulate loading a conversation from history
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `Continuing our conversation about "${historyItem.title}". What would you like to explore further?`,
        timestamp: new Date(),
      },
    ])
    setCurrentView('chat')
  }

  const QuickActions = () => (
    <div className='p-4 border-t border-[#1E1E21] bg-[#0B0B0C]'>
      <div className='text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3'>
        Quick Actions
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <button
          onClick={() => setInputMessage('Help me create a digital product')}
          className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group'
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
          onClick={() => setInputMessage('Show me my earnings strategy')}
          className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group'
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
          onClick={() => setInputMessage('Help me with affiliate marketing')}
          className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group'
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
          onClick={() => setInputMessage('Create viral content hooks')}
          className='text-left p-3 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group'
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
          }`}
        >
          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
            {message.content}
          </p>
          <p
            className={`text-xs mt-2 ${
              message.type === 'user' ? 'text-black/70' : 'text-gray-400'
            }`}
          >
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
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
        {conversationHistory.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => loadHistoryConversation(conversation)}
            className='w-full text-left p-4 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 group'
          >
            <div className='flex items-start justify-between mb-2'>
              <h4 className='text-[#EDEDED] font-medium text-sm group-hover:text-[#D4AF37] transition-colors'>
                {conversation.title}
              </h4>
              <span className='text-xs text-gray-400 flex-shrink-0 ml-2'>
                {formatHistoryDate(conversation.timestamp)}
              </span>
            </div>
            <p className='text-gray-400 text-xs leading-relaxed mb-2 line-clamp-2'>
              {conversation.lastMessage}
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
        ))}

        {conversationHistory.length === 0 && (
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
            isMinimized ? 'h-14' : 'h-[520px] max-h-[calc(100vh-8rem)]'
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
              {!isMinimized && currentView === 'chat' && (
                <button
                  onClick={clearCurrentChat}
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
                <>
                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    className='flex-1 overflow-y-auto p-4 h-48 bg-[#0B0B0C]'
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#1E1E21 transparent',
                    }}
                  >
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
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
                  </div>

                  {/* Quick Actions */}
                  <QuickActions />

                  {/* Input */}
                  <div className='p-4 border-t border-[#1E1E21] bg-[#0B0B0C] rounded-b-xl'>
                    <div className='flex items-end gap-3'>
                      <div className='flex-1 relative'>
                        <textarea
                          ref={inputRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder='Ask Empire AI anything...'
                          className='w-full bg-[#121214] border border-[#1E1E21] rounded-lg px-4 py-3 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 resize-none min-h-[44px] max-h-20'
                          rows={1}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className='w-11 h-11 bg-[#D4AF37] text-black rounded-lg flex items-center justify-center hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0'
                      >
                        {isTyping ? (
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
                    </div>
                  </div>
                </>
              ) : (
                <HistoryView />
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Action Button - Hidden when chat is open to prevent bleeding */}
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
