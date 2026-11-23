import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import {
  isSessionIdleExpired,
  touchLastActivity,
  useAuthStore,
} from './useAuthStore';

const CHECK_INTERVAL_MS = 10 * 1000; // Cek setiap 10 detik
const ACTIVITY_THROTTLE_MS = 15 * 1000; // Perbarui timestamp maksimal tiap 15 detik

export function SessionTimeoutWatcher() {
  const { user, signOut, checkActiveSession } = useAuthStore();
  const navigate = useNavigate();
  const lastTouchRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastTouchRef.current >= ACTIVITY_THROTTLE_MS) {
        lastTouchRef.current = now;
        touchLastActivity();
      }
    };

    const verifySession = async () => {
      if (isSessionIdleExpired()) {
        await signOut(true);
        navigate('/auth', { replace: true });
        return;
      }
      const displaced = await checkActiveSession();
      if (displaced) {
        navigate('/auth', { replace: true });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifySession();
      }
    };

    const handleFocus = () => {
      void verifySession();
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'lokatalenta_active_session_token_v1' ||
        e.key === `lokatalenta_demo_active_session_${user.id}`
      ) {
        void verifySession();
      }
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    const interval = window.setInterval(() => void verifySession(), CHECK_INTERVAL_MS);

    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`active-session-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          () => {
            void verifySession();
          }
        )
        .subscribe();
    }

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
      if (channel && supabase) {
        void supabase.removeChannel(channel);
      }
    };
  }, [user, signOut, checkActiveSession, navigate]);

  return null;
}
