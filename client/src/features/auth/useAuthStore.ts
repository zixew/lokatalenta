import { create } from 'zustand';
import { DEMO_PROFILES } from '../../shared/data/demoProfiles';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import type { Profile } from '../../shared/types/lms';

export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 jam

const SESSION_USER_ID_KEY = 'ruanglatih_session_user_id_v1';
const LAST_ACTIVITY_KEY = 'ruanglatih_last_activity_v1';
const ACTIVE_SESSION_TOKEN_KEY = 'lokatalenta_active_session_token_v1';
const DEMO_ACTIVE_SESSION_PREFIX = 'lokatalenta_demo_active_session_';
const PROFILES_STORAGE_KEY = 'ruanglatih_demo_profiles_v13';
const PASSWORDS_STORAGE_KEY = 'ruanglatih_demo_passwords_v1';

function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_PASSWORDS: Record<string, string> = {
  'nadia@pelajar.id': 'pelajar123',
  'rizco@pengajar.id': 'pengajar123',
  'admin@ruanglatih.id': 'admin123',
};

function getStoredProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile[]) : DEMO_PROFILES;
  } catch {
    return DEMO_PROFILES;
  }
}

function getStoredPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    return raw ? { ...DEFAULT_PASSWORDS, ...(JSON.parse(raw) as Record<string, string>) } : DEFAULT_PASSWORDS;
  } catch {
    return DEFAULT_PASSWORDS;
  }
}

export function getLastActivity(): number {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function touchLastActivity(): void {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function isSessionIdleExpired(): boolean {
  const last = getLastActivity();
  if (!last) return false;
  return Date.now() - last >= SESSION_IDLE_TIMEOUT_MS;
}

interface AuthState {
  user: Profile | null;
  loading: boolean;
  initialized: boolean;
  sessionExpired: boolean;
  sessionDisplaced: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: (expired?: boolean) => Promise<void>;
  checkActiveSession: () => Promise<boolean>;
  setProfile: (profile: Profile) => void;
  clearSessionExpired: () => void;
  clearSessionDisplaced: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  sessionExpired: false,
  sessionDisplaced: false,

  init: async () => {
    const expired = isSessionIdleExpired();

    if (isSupabaseConfigured && supabase) {
      set({ loading: true });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && expired) {
        await supabase.auth.signOut();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        set({ user: null, loading: false, initialized: true, sessionExpired: true });
        return;
      }

      if (session?.user) {
        touchLastActivity();
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile?.is_active === false) {
          await supabase.auth.signOut({ scope: 'local' });
          localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
          set({ user: null, loading: false, initialized: true });
          return;
        }
        const localToken = localStorage.getItem(ACTIVE_SESSION_TOKEN_KEY);
        const remoteToken = (profile as (Profile & { active_session_id?: string | null }) | null)
          ?.active_session_id;
        if (localToken && remoteToken && remoteToken !== localToken) {
          await supabase.auth.signOut({ scope: 'local' });
          localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          set({ user: null, loading: false, initialized: true, sessionDisplaced: true });
          return;
        }
        if (!localToken && remoteToken) {
          localStorage.setItem(ACTIVE_SESSION_TOKEN_KEY, remoteToken);
        }
        set({ user: profile ?? null, loading: false, initialized: true });
      } else {
        set({ user: null, loading: false, initialized: true });
      }

      supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (nextSession?.user) {
          touchLastActivity();
          const { data: profile } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', nextSession.user.id)
            .single();
          set({ user: profile ?? null, sessionExpired: false });
        } else {
          set({ user: null });
        }
      });
      return;
    }

    // Local session restoration
    const activeUserId = localStorage.getItem(SESSION_USER_ID_KEY);
    if (!activeUserId || expired) {
      localStorage.removeItem(SESSION_USER_ID_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      set({
        user: null,
        loading: false,
        initialized: true,
        sessionExpired: Boolean(activeUserId && expired),
      });
      return;
    }

    const profiles = getStoredProfiles();
    const found = profiles.find((p) => p.id === activeUserId);
    const localToken = localStorage.getItem(ACTIVE_SESSION_TOKEN_KEY);
    const remoteDemoToken = localStorage.getItem(`${DEMO_ACTIVE_SESSION_PREFIX}${activeUserId}`);
    if (localToken && remoteDemoToken && remoteDemoToken !== localToken) {
      localStorage.removeItem(SESSION_USER_ID_KEY);
      localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      set({ user: null, loading: false, initialized: true, sessionDisplaced: true });
      return;
    }
    if (!found || found.is_active === false) {
      localStorage.removeItem(SESSION_USER_ID_KEY);
      localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      set({ user: null, loading: false, initialized: true });
      return;
    }

    touchLastActivity();
    set({ user: found, loading: false, initialized: true });
  },

  signIn: async (email, password) => {
    const nextSessionToken = generateSessionToken();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profile?.is_active === false) {
          await supabase.auth.signOut({ scope: 'local' });
          throw new Error('Akun Anda sedang dinonaktifkan oleh Admin.');
        }
        localStorage.setItem(ACTIVE_SESSION_TOKEN_KEY, nextSessionToken);
        await supabase
          .from('profiles')
          .update({ active_session_id: nextSessionToken })
          .eq('id', data.user.id);
        await supabase.auth.signOut({ scope: 'others' }).catch(() => {});
      }
      touchLastActivity();
      set({ sessionExpired: false, sessionDisplaced: false });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const profiles = getStoredProfiles();
    const passwords = getStoredPasswords();
    const found = profiles.find((p) => p.email.toLowerCase() === normalizedEmail);

    if (!found || passwords[normalizedEmail] !== password) {
      throw new Error('Email atau password salah.');
    }
    if (found.is_active === false) {
      throw new Error('Akun Anda sedang dinonaktifkan oleh Admin.');
    }

    localStorage.setItem(SESSION_USER_ID_KEY, found.id);
    localStorage.setItem(ACTIVE_SESSION_TOKEN_KEY, nextSessionToken);
    localStorage.setItem(`${DEMO_ACTIVE_SESSION_PREFIX}${found.id}`, nextSessionToken);
    touchLastActivity();
    set({ user: found, sessionExpired: false, sessionDisplaced: false });
  },

  signUp: async (fullName, email, password) => {
    const cleanName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!cleanName) {
      throw new Error('Nama lengkap wajib diisi.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Format email tidak valid.');
    }
    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter.');
    }

    const nextSessionToken = generateSessionToken();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { full_name: cleanName } },
      });
      if (error) {
        if (/already\s*registered|already\s*exists/i.test(error.message)) {
          throw new Error('Email sudah terdaftar. Silakan masuk.');
        }
        throw error;
      }
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('Email sudah terdaftar. Silakan masuk.');
      }

      localStorage.setItem(ACTIVE_SESSION_TOKEN_KEY, nextSessionToken);
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: cleanName,
            active_session_id: nextSessionToken,
          })
          .eq('id', data.user.id);
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (freshProfile) {
          set({ user: freshProfile });
        }
      }
      touchLastActivity();
      set({ sessionExpired: false, sessionDisplaced: false });
      return;
    }

    const profiles = getStoredProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }

    const newUser: Profile = {
      id: `user-${Date.now()}`,
      full_name: cleanName,
      email: normalizedEmail,
      role: 'student',
      bio: '',
      is_active: true,
    };

    const passwords = getStoredPasswords();
    passwords[normalizedEmail] = password;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify([...profiles, newUser]));
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
    localStorage.setItem(SESSION_USER_ID_KEY, newUser.id);
    localStorage.setItem(ACTIVE_SESSION_TOKEN_KEY, nextSessionToken);
    localStorage.setItem(`${DEMO_ACTIVE_SESSION_PREFIX}${newUser.id}`, nextSessionToken);
    touchLastActivity();
    set({ user: newUser, sessionExpired: false, sessionDisplaced: false });
  },

  signOut: async (expired = false) => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_USER_ID_KEY);
    localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    set({ user: null, sessionExpired: expired });
  },

  checkActiveSession: async () => {
    const currentUser = get().user;
    if (!currentUser) return false;
    const localToken = localStorage.getItem(ACTIVE_SESSION_TOKEN_KEY);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('active_session_id, is_active')
        .eq('id', currentUser.id)
        .single();
      if (error) return false;

      const remoteToken = (data as { active_session_id?: string | null; is_active?: boolean } | null)
        ?.active_session_id;
      const isDeactivated = data?.is_active === false;
      const isDisplaced = Boolean(localToken && remoteToken && remoteToken !== localToken);

      if (isDeactivated || isDisplaced) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
        await supabase.auth.signOut({ scope: 'local' });
        set({ user: null, sessionDisplaced: isDisplaced });
        return true;
      }
      return false;
    }

    const remoteDemoToken = localStorage.getItem(`${DEMO_ACTIVE_SESSION_PREFIX}${currentUser.id}`);
    if (localToken && remoteDemoToken && remoteDemoToken !== localToken) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_USER_ID_KEY);
      localStorage.removeItem(ACTIVE_SESSION_TOKEN_KEY);
      set({ user: null, sessionDisplaced: true });
      return true;
    }
    return false;
  },

  setProfile: (profile) => {
    set({ user: profile });
  },

  clearSessionExpired: () => {
    set({ sessionExpired: false });
  },

  clearSessionDisplaced: () => {
    set({ sessionDisplaced: false });
  },

  requestPasswordReset: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Format email tidak valid.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) {
        throw new Error(error.message || 'Gagal mengirim tautan reset password.');
      }
      return;
    }

    // Demo mode simulation: succeed cleanly without leaking account existence
    return;
  },

  updatePassword: async (newPassword) => {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('Password baru minimal 6 karakter.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message || 'Gagal memperbarui password.');
      }
      return;
    }

    const currentUser = get().user;
    if (currentUser?.email) {
      const passwords = getStoredPasswords();
      passwords[currentUser.email.toLowerCase()] = newPassword;
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
    }
  },
}));
