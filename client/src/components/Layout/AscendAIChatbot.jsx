// File: client/src/components/Layout/AscendAIChatbot.jsx
import {
  DollarSign,
  History,
  Loader,
  Maximize2,
  MessageCircle,
  Minimize2,
  Plus,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useChat } from '../../hooks/useChat'

const AscendAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'history'
  const [currentChatId, setCurrentChatId] = useState(null)
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
  } = useChat(currentChatId)

  const messages = currentChat?.messages || []

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && currentView === 'chat' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized, currentView])

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
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  const handleLoadChat = (chatId) => {
    setCurrentChatId(chatId)
    setCurrentView('chat')
    loadChat(chatId)
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    try {
      await deleteChat(chatId)
      // If we deleted the current chat, clear it
      if (chatId === currentChatId) {
        setCurrentChatId(null)
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
      } mb-4`}
    >
      <div
        className={`flex ${
          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
        } items-start gap-3 max-w-[85%]`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.role === 'user'
              ? 'bg-[#D4AF37]'
              : 'bg-gradient-to-br from-[#D4AF37] to-[#B8941F]'
          }`}
        >
          {message.role === 'user' ? (
            <User size={16} className='text-black' />
          ) : (
            <DollarSign size={16} className='text-black font-bold' />
          )}
        </div>

        <div
          className={`rounded-xl px-4 py-3 ${
            message.role === 'user'
              ? 'bg-[#D4AF37] text-black'
              : 'bg-[#121214] border border-[#1E1E21] text-[#EDEDED]'
          }`}
        >
          <p className='text-sm leading-relaxed whitespace-pre-wrap'>
            {message.content}
          </p>
          <div className='mt-2'>
            <p
              className={`text-xs ${
                message.role === 'user' ? 'text-black/70' : 'text-gray-400'
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div className='flex flex-col items-center justify-center h-full text-center p-8'>
      <div className='w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center mb-4 shadow-lg'>
        <DollarSign size={24} className='text-black font-bold' />
      </div>
      <h3 className='text-[#EDEDED] font-semibold text-lg mb-2'>
        Ready to Build Your Empire?
      </h3>
      <p className='text-gray-400 text-sm'>
        Start a conversation with your AI business advisor
      </p>
    </div>
  )

  const HistoryView = () => (
    <div className='flex flex-col h-full'>
      <div className='p-4 border-b border-[#1E1E21] bg-[#0B0B0C]'>
        <div className='flex items-center justify-between'>
          <h3 className='text-[#EDEDED] font-semibold text-sm'>Chat History</h3>
          <button
            onClick={() => setCurrentView('chat')}
            className='text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm font-medium'
          >
            Back to Chat
          </button>
        </div>
        <p className='text-xs text-gray-400 mt-1'>
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {/* Only show loading in history when we're loading history AND not in a chat */}
        {isLoading && currentView === 'history' ? (
          <div className='text-center py-12'>
            <Loader
              size={32}
              className='text-[#D4AF37] animate-spin mx-auto mb-4'
            />
            <p className='text-gray-400 text-sm'>Loading conversations...</p>
          </div>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <div key={chat._id} className='group relative'>
              <button
                onClick={() => handleLoadChat(chat._id)}
                className='w-full text-left p-4 rounded-lg bg-[#121214] border border-[#1E1E21] hover:border-[#D4AF37]/40 transition-all duration-200 hover:bg-[#151517]'
              >
                <div className='flex items-start justify-between mb-2'>
                  <h4 className='text-[#EDEDED] font-medium text-sm group-hover:text-[#D4AF37] transition-colors line-clamp-1 pr-8'>
                    {chat.title}
                  </h4>
                  <span className='text-xs text-gray-400'>
                    {formatDate(chat.lastActivity)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-500'>
                    {chat.messages?.length || 0} message
                    {(chat.messages?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className='text-xs text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity'>
                    Continue →
                  </span>
                </div>
              </button>

              <button
                onClick={(e) => handleDeleteChat(chat._id, e)}
                className='opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300'
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        ) : (
          <div className='text-center py-12'>
            <History size={48} className='text-gray-600 mx-auto mb-4' />
            <p className='text-gray-400 text-sm mb-2'>No conversations yet</p>
            <p className='text-gray-500 text-xs mb-4'>
              Start your first conversation to see it here
            </p>
            <button
              onClick={() => setCurrentView('chat')}
              className='text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm font-medium'
            >
              Start New Conversation
            </button>
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
            isMinimized ? 'h-14' : 'h-[600px] max-h-[calc(100vh-8rem)]'
          }`}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-[#1E1E21] bg-gradient-to-r from-[#121214] to-[#1A1A1C] rounded-t-xl'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-lg flex items-center justify-center shadow-lg'>
                <DollarSign size={16} className='text-black font-bold' />
              </div>
              <div>
                <h3 className='text-[#EDEDED] font-semibold text-sm'>
                  Empire AI
                </h3>
                <div className='flex items-center gap-1'>
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSending ? 'bg-orange-400 animate-pulse' : 'bg-[#D4AF37]'
                    }`}
                  ></div>
                  <span
                    className={`text-xs ${
                      isSending ? 'text-orange-400' : 'text-[#D4AF37]'
                    }`}
                  >
                    {isSending ? 'Thinking...' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-1'>
              {!isMinimized && (
                <>
                  <button
                    onClick={handleNewChat}
                    className='p-1.5 rounded-lg hover:bg-[#1E1E21] transition-colors'
                    title='New Chat'
                  >
                    <Plus
                      size={14}
                      className='text-gray-400 hover:text-[#D4AF37]'
                    />
                  </button>

                  <button
                    onClick={() =>
                      setCurrentView(
                        currentView === 'chat' ? 'history' : 'chat'
                      )
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
                </>
              )}

              <button
                onClick={() => setIsMinimized(!isMinimized)}
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
                  {/* Messages Area */}
                  <div
                    className='flex-1 overflow-y-auto p-4 bg-[#0B0B0C] min-h-0'
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#1E1E21 transparent',
                    }}
                  >
                    {error && (
                      <div className='p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3'>
                        <div>
                          <p className='text-red-400 text-sm font-medium mb-1'>
                            Connection Error
                          </p>
                          <p className='text-red-300 text-xs'>{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Only show loading here when loading a specific chat, not when sending */}
                    {isLoading && currentView === 'chat' && !isSending ? (
                      <div className='flex items-center justify-center h-full'>
                        <div className='text-center'>
                          <Loader
                            size={32}
                            className='text-[#D4AF37] animate-spin mx-auto mb-4'
                          />
                          <p className='text-gray-400 text-sm'>
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

                        {/* Enhanced Typing Indicator - Better animation */}
                        {isSending && (
                          <div className='flex justify-start mb-4'>
                            <div className='flex items-start gap-3 max-w-[85%]'>
                              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center'>
                                <DollarSign
                                  size={16}
                                  className='text-black font-bold'
                                />
                              </div>
                              <div className='bg-[#121214] border border-[#1E1E21] rounded-xl px-4 py-3'>
                                <div className='flex items-center gap-1'>
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
                                  <span className='text-gray-400 text-xs ml-2'>
                                    AI is thinking...
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input Section */}
                  <div className='p-4 border-t border-[#1E1E21] bg-[#0B0B0C] rounded-b-xl flex-shrink-0'>
                    <div className='flex items-end gap-3'>
                      <div className='flex-1 relative'>
                        <textarea
                          ref={inputRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder='Ask me about your business empire...'
                          disabled={isSending}
                          className='w-full bg-[#121214] border border-[#1E1E21] rounded-lg px-4 py-3 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 focus:ring-1 focus:ring-[#D4AF37]/20 resize-none min-h-[44px] max-h-20 disabled:opacity-50 disabled:cursor-not-allowed'
                          rows={1}
                        />
                      </div>

                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isSending}
                        className='w-11 h-11 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-black rounded-lg flex items-center justify-center hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105'
                      >
                        {isSending ? (
                          <Loader size={18} className='animate-spin' />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>

                    <p className='text-xs text-gray-500 mt-3'>
                      Press Enter to send • Shift + Enter for new line
                    </p>
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
          onClick={() => setIsOpen(true)}
          className='fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] text-black rounded-full shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group'
        >
          <DollarSign
            size={24}
            className='transition-transform duration-300 group-hover:scale-110 font-bold'
          />
          <div className='absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] animate-ping opacity-20'></div>
        </button>
      )}
    </>
  )
}

export default AscendAIChatbot
