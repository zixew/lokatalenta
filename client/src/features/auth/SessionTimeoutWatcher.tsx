import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isSessionIdleExpired,
  touchLastActivity,
  useAuthStore,
} from './useAuthStore';

const CHECK_INTERVAL_MS = 15 * 1000; // Cek setiap 15 detik
const ACTIVITY_THROTTLE_MS = 15 * 1000; // Perbarui timestamp maksimal tiap 15 detik

export function SessionTimeoutWatcher() {
  const { user, signOut } = useAuthStore();
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
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
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
    const interval = window.setInterval(verifySession, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [user, signOut, navigate]);

  return null;
}
