import Send from './Send'
import React from 'react';
import {QueryClient, QueryClientProvider} from 'react-query'
import {BrowserRouter} from 'react-router-dom'
import ThemeProvider from '@/bridge/theme/ThemeProvider'
import Web3Provider from '@/bridge/contexts/Web3Context'
import AppProvider from '@/bridge/contexts/AppContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20000,
      cacheTime: 1000 * 60 * 60,
      // By default, retries in React Query do not happen immediately after a request fails.
      // As is standard, a back-off delay is gradually applied to each retry attempt.
      // The default retryDelay is set to double (starting at 1000ms) with each attempt, but not exceed 30 seconds:
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: err => {
        console.log(`react-query error:`, err)
      },
    },
  },
})

function SendFc() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Web3Provider>
            <AppProvider>
              <Send/>
            </AppProvider>
          </Web3Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default SendFc
