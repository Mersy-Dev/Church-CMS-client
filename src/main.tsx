import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { router } from './routes';

// ── 1. Theme CSS vars (must come BEFORE globals so vars are defined first) ───
import './styles/theme.css';
import './styles/globals.css';

// ── 2. Theme context ──────────────────────────────────────────────────────────
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Theme-aware Toaster: reads data-theme set by ThemeProvider ────────────────
function getToastStyle() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return isDark
    ? {
        background: '#1a1a2e',
        color: '#f0f0f8',
        border: '1px solid #2a2a42',
        borderRadius: '12px',
        fontSize: '13px',
      }
    : {
        background: '#ffffff',
        color: '#0d1117',
        border: '1px solid rgba(26,86,160,0.18)',
        borderRadius: '12px',
        fontSize: '13px',
        boxShadow: '0 4px 24px rgba(26,86,160,0.12)',
      };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* ThemeProvider sets data-theme on <html> and exposes useTheme() hook */}
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              style: getToastStyle(),
              success: {
                iconTheme: {
                  primary: '#1A56A0',  // navy (was gold)
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#C41E3A',  // crimson
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);