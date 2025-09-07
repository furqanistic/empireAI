// File: client/src/main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { injectStore } from './config/config.js'
import './index.css'
import { persistor, store } from './redux/store.js'

// Inject store into axios config
injectStore(store)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster
            position='top-right'
            richColors
            closeButton
            theme='dark' // Match your dark theme
            toastOptions={{
              style: {
                background: '#121214',
                border: '1px solid #1E1E21',
                color: '#EDEDED',
              },
              className: 'bg-[#121214] border-[#1E1E21] text-[#EDEDED]',
            }}
          />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
)
