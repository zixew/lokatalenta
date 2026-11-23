import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/AppRouter';
import { SessionTimeoutWatcher } from './features/auth/SessionTimeoutWatcher';
import { useAuthStore } from './features/auth/useAuthStore';
import { useThemeStore } from './shared/stores/useThemeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export default function App() {
  const init = useAuthStore((s) => s.init);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    init();
  }, [init, initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionTimeoutWatcher />
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
