// File: client/src/pages/Chat/Chat.jsx
import {
  DollarSign,
  History,
  Loader,
  Plus,
  Send,
  Trash2,
  User,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChat } from '../../hooks/useChat'
import Layout from '../Layout/Layout'

const ChatPage = () => {
  const [searchParams] = useSearchParams()
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'history'
  const [currentChatId, setCurrentChatId] = useState(() => {
    // Initialize currentChatId from URL query parameter
    return searchParams.get('chatId') || null
  })
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const {
    chats,
    currentChat,
    isLoading,
    isSending,
    error,
    createNewChat,
    sendMessage,
    loadChat,
    deleteChat,
  } = useChat(currentChatId) // Pass currentChatId here

  console.log('Chat page - useChat initialized with:', currentChatId) // Debug log

  const messages = currentChat?.messages || []

  // Load chat from URL parameter on component mount
  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId')
    if (chatIdFromUrl && chatIdFromUrl !== currentChatId) {
      setCurrentChatId(chatIdFromUrl)
      loadChat(chatIdFromUrl)
    }
  }, [searchParams, loadChat, currentChatId])

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when switching to chat view
  useEffect(() => {
    if (currentView === 'chat' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [currentView])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    const messageContent = inputMessage.trim()
    setInputMessage('')

    try {
      const result = await sendMessage(messageContent)

      // If this was a new chat, update the current chat ID
      if (!currentChatId && result?.chatId) {
        setCurrentChatId(result.chatId)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = async () => {
    try {
      const newChat = await createNewChat()
      setCurrentChatId(newChat._id)
      setCurrentView('chat')
      // Update URL to reflect new chat
      window.history.pushState({}, '', `/chat?chatId=${newChat._id}`)
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  const handleLoadChat = (chatId) => {
    setCurrentChatId(chatId)
    setCurrentView('chat')
    loadChat(chatId)
    // Update URL to reflect loaded chat
    window.history.pushState({}, '', `/chat?chatId=${chatId}`)
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    try {
      await deleteChat(chatId)
      // If we deleted the current chat, clear it
      if (chatId === currentChatId) {
        setCurrentChatId(null)
        // Update URL to remove chatId parameter
        window.history.pushState({}, '', '/chat')
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const MessageBubble = ({ message }) => (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      } mb-6`}
    >
      <div
        className={`flex ${
          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
        } items-start gap-4 max-w-4xl w-full`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.role === 'user'
              ? 'bg-[#D4AF37]'
              : 'bg-gradient-to-br from-[#D4AF37] to-[#B8941F]'
          }`}
        >
          {message.role === 'user' ? (
            <User size={20} className='text-black' />
          ) : (
            <DollarSign size={20} className='text-black font-bold' />
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div
            className={`rounded-2xl px-6 py-4 ${
              message.role === 'user'
                ? 'bg-[#D4AF37] text-black ml-auto max-w-2xl'
                : 'bg-[#121214] border border-[#1E1E21] text-[#EDEDED]'
            }`}
          >
            <p className='text-base leading-relaxed whitespace-pre-wrap'>
              {message.content}
            </p>
          </div>
          <div className='mt-2 px-2'>
            <p
              className={`text-xs ${
                message.role === 'user'
                  ? 'text-right text-gray-400'
                  : 'text-gray-500'
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // Replace the EmptyState component with this enhanced version:
  const EmptyState = () => (
    <div className='flex flex-col items-center justify-center h-full text-center p-8'>
      <div className='w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center mb-4 shadow-lg'>
        <DollarSign size={24} className='text-black font-bold' />
      </div>
      <h3 className='text-[#EDEDED] font-semibold text-lg mb-2'>
        Ready to Make $500 This Week?
      </h3>
      <p className='text-gray-400 text-sm mb-4'>
        Ask me anything about affiliates, products, or growing your empire
      </p>
      <div className='flex flex-wrap gap-2 justify-center'>
        <button
          onClick={() => setInputMessage('How do I make my first $100?')}
          className='px-3 py-1 text-xs bg-[#1E1E21] text-[#D4AF37] rounded-full hover:bg-[#2A2A2D]'
        >
          Make first $100
        </button>
        <button
          onClick={() => setInputMessage('Show me the affiliate math')}
          className='px-3 py-1 text-xs bg-[#1E1E21] text-[#D4AF37] rounded-full hover:bg-[#2A2A2D]'
        >
          Affiliate earnings
        </button>
        <button
          onClick={() => setInputMessage('What product should I create?')}
          className='px-3 py-1 text-xs bg-[#1E1E21] text-[#D4AF37] rounded-full hover:bg-[#2A2A2D]'
        >
          Product ideas
        </button>
      </div>
    </div>
  )

  const HistoryView = () => (
    <div className='h-full flex flex-col'>
      {/* History Header */}
      <div className='bg-[#121214] border-b border-[#1E1E21] px-8 py-6'>
        <div className='flex items-center justify-between max-w-4xl mx-auto'>
          <div>
            <h2 className='text-[#EDEDED] font-bold text-xl mb-1'>
              Chat History
            </h2>
            <p className='text-gray-400'>
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setCurrentView('chat')}
            className='px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-colors'
          >
            Back to Chat
          </button>
        </div>
      </div>

      {/* History Content */}
      <div className='flex-1 overflow-y-auto px-8 py-6'>
        <div className='max-w-4xl mx-auto'>
          {isLoading && currentView === 'history' ? (
            <div className='text-center py-20'>
              <Loader
                size={48}
                className='text-[#D4AF37] animate-spin mx-auto mb-6'
              />
              <p className='text-gray-400 text-lg'>Loading conversations...</p>
            </div>
          ) : chats.length > 0 ? (
            <div className='grid gap-4'>
              {chats.map((chat) => (
                <div key={chat._id} className='group relative'>
                  <button
                    onClick={() => handleLoadChat(chat._id)}
                    className='w-full text-left p-6 rounded-xl bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 hover:bg-[#151517]'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <h3 className='text-[#EDEDED] font-semibold text-lg group-hover:text-[#D4AF37] transition-colors line-clamp-2 pr-8'>
                        {chat.title}
                      </h3>
                      <span className='text-sm text-gray-400 whitespace-nowrap'>
                        {formatDate(chat.lastActivity)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>
                        {chat.messages?.length || 0} message
                        {(chat.messages?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      <span className='text-sm text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity'>
                        Continue conversation →
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    className='opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-20'>
              <History size={64} className='text-gray-600 mx-auto mb-6' />
              <h3 className='text-[#EDEDED] font-semibold text-xl mb-2'>
                No conversations yet
              </h3>
              <p className='text-gray-400 mb-6'>
                Start your first conversation to see it here
              </p>
              <button
                onClick={() => setCurrentView('chat')}
                className='px-6 py-3 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-colors'
              >
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className='h-full flex flex-col bg-[#0B0B0C]'>
        {currentView === 'chat' ? (
          <>
            {/* Chat Header */}
            <div className='bg-[#121214] border-b border-[#1E1E21] px-4 md:px-8 py-4 md:py-6 flex-shrink-0'>
              <div className='flex items-center justify-between max-w-6xl mx-auto'>
                <div className='flex items-center gap-4'>
                  <div>
                    <h1 className='text-[#EDEDED] font-bold text-xl md:text-2xl'>
                      Empire AI Assistant
                    </h1>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSending
                            ? 'bg-orange-400 animate-pulse'
                            : 'bg-[#D4AF37]'
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          isSending ? 'text-orange-400' : 'text-[#D4AF37]'
                        }`}
                      >
                        {isSending ? 'Thinking...' : 'Ready to help'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <button
                    onClick={handleNewChat}
                    className='flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-colors text-sm md:text-base'
                  >
                    <Plus size={16} />
                    <span className='hidden sm:inline'>New Chat</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('history')}
                    className='flex items-center gap-2 px-4 py-2 bg-[#1E1E21] text-[#EDEDED] rounded-lg hover:bg-[#252528] transition-colors text-sm md:text-base'
                  >
                    <History size={16} />
                    <span className='hidden sm:inline'>History</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className='flex-1 overflow-y-auto px-4 md:px-8 py-6 min-h-0'>
              <div className='max-w-6xl mx-auto'>
                {error && (
                  <div className='p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl'>
                    <h3 className='text-red-400 font-semibold mb-2'>
                      Connection Error
                    </h3>
                    <p className='text-red-300 text-sm'>{error}</p>
                  </div>
                )}

                {isLoading && currentView === 'chat' && !isSending ? (
                  <div className='flex items-center justify-center h-full'>
                    <div className='text-center'>
                      <Loader
                        size={48}
                        className='text-[#D4AF37] animate-spin mx-auto mb-6'
                      />
                      <p className='text-gray-400 text-lg'>
                        Loading conversation...
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 && !currentChatId ? (
                  <EmptyState />
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble
                        key={message._id || Math.random()}
                        message={message}
                      />
                    ))}

                    {/* Typing Indicator */}
                    {isSending && (
                      <div className='flex justify-start mb-6'>
                        <div className='flex items-start gap-4 max-w-4xl w-full'>
                          <div className='w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center'>
                            <DollarSign
                              size={20}
                              className='text-black font-bold'
                            />
                          </div>
                          <div className='bg-[#121214] border border-[#1E1E21] rounded-2xl px-6 py-4'>
                            <div className='flex items-center gap-2'>
                              <div className='flex space-x-1'>
                                <div className='w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse'></div>
                                <div
                                  className='w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse'
                                  style={{ animationDelay: '0.2s' }}
                                ></div>
                                <div
                                  className='w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse'
                                  style={{ animationDelay: '0.4s' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input Section */}
            <div className='bg-[#121214] border-t border-[#1E1E21] px-4 md:px-8 py-4 md:py-6 flex-shrink-0'>
              <div className='max-w-6xl mx-auto'>
                <div className='flex items-end gap-4'>
                  <div className='flex-1 relative'>
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder='Ask me anything about building your business empire...'
                      disabled={isSending}
                      className='w-full bg-[#0B0B0C] border border-[#1E1E21] rounded-xl px-6 py-4 text-base text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 focus:ring-2 focus:ring-[#D4AF37]/20 resize-none min-h-[56px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed'
                      rows={1}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending}
                    className='w-14 h-14 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-black rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105'
                  >
                    {isSending ? (
                      <Loader size={20} className='animate-spin' />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>

                <p className='text-xs text-gray-500 mt-3 text-center'>
                  Press Enter to send • Shift + Enter for new line • Be specific
                  for better results
                </p>
              </div>
            </div>
          </>
        ) : (
          <HistoryView />
        )}
      </div>
    </Layout>
  )
}

export default ChatPage
