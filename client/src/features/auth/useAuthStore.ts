import { create } from 'zustand';
import { DEMO_PROFILES } from '../../shared/data/demoProfiles';
import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';
import type { Profile } from '../../shared/types/lms';

export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 jam

const SESSION_USER_ID_KEY = 'ruanglatih_session_user_id_v1';
const LAST_ACTIVITY_KEY = 'ruanglatih_last_activity_v1';
const PROFILES_STORAGE_KEY = 'ruanglatih_demo_profiles_v13';
const PASSWORDS_STORAGE_KEY = 'ruanglatih_demo_passwords_v1';
const OTP_STORAGE_KEY = 'lokatalenta_signup_otp_v1';

interface PendingOtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
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
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  requestSignUpOtp: (email: string) => Promise<{ devOtpPreview?: string }>;
  verifyAndSignUp: (
    fullName: string,
    email: string,
    password: string,
    otpCode: string
  ) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: (expired?: boolean) => Promise<void>;
  setProfile: (profile: Profile) => void;
  clearSessionExpired: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  sessionExpired: false,

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
          await supabase.auth.signOut();
          set({ user: null, loading: false, initialized: true });
          return;
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
    if (!found || found.is_active === false) {
      localStorage.removeItem(SESSION_USER_ID_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      set({ user: null, loading: false, initialized: true });
      return;
    }

    touchLastActivity();
    set({ user: found, loading: false, initialized: true });
  },

  signIn: async (email, password) => {
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
          await supabase.auth.signOut();
          throw new Error('Akun Anda sedang dinonaktifkan oleh Admin.');
        }
      }
      touchLastActivity();
      set({ sessionExpired: false });
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
    touchLastActivity();
    set({ user: found, sessionExpired: false });
  },

  requestSignUpOtp: async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new Error('Format email tidak valid.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return {};
    }

    const profiles = getStoredProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    let otpMap: Record<string, PendingOtpRecord> = {};
    try {
      const raw = localStorage.getItem(OTP_STORAGE_KEY);
      if (raw) otpMap = JSON.parse(raw) as Record<string, PendingOtpRecord>;
    } catch {
      otpMap = {};
    }
    otpMap[normalizedEmail] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    };
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpMap));
    return { devOtpPreview: code };
  },

  verifyAndSignUp: async (fullName, email, password, otpCode) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      throw new Error('Kode OTP harus berupa 6 digit angka.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanOtp,
        type: 'email',
      });
      if (vErr) throw vErr;
      const { error: uErr } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName.trim() },
      });
      if (uErr) throw uErr;
      touchLastActivity();
      set({ sessionExpired: false });
      return;
    }

    let otpMap: Record<string, PendingOtpRecord> = {};
    try {
      const raw = localStorage.getItem(OTP_STORAGE_KEY);
      if (raw) otpMap = JSON.parse(raw) as Record<string, PendingOtpRecord>;
    } catch {
      otpMap = {};
    }

    const rec = otpMap[normalizedEmail];
    if (!rec) {
      throw new Error('Silakan kirim kode OTP ke email terlebih dahulu.');
    }
    if (Date.now() > rec.expiresAt) {
      delete otpMap[normalizedEmail];
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpMap));
      throw new Error('Kode OTP telah kedaluwarsa. Silakan kirim ulang.');
    }
    if (rec.code !== cleanOtp) {
      rec.attempts += 1;
      if (rec.attempts >= 5) {
        delete otpMap[normalizedEmail];
        localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpMap));
        throw new Error('Terlalu banyak percobaan OTP salah. Silakan kirim ulang kode baru.');
      }
      otpMap[normalizedEmail] = rec;
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpMap));
      throw new Error('Kode OTP tidak valid.');
    }

    delete otpMap[normalizedEmail];
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpMap));
    await useAuthStore.getState().signUp(fullName, normalizedEmail, password);
  },

  signUp: async (fullName, email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      touchLastActivity();
      set({ sessionExpired: false });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const profiles = getStoredProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }

    const newUser: Profile = {
      id: `user-${Date.now()}`,
      full_name: fullName.trim(),
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
    touchLastActivity();
    set({ user: newUser, sessionExpired: false });
  },

  signOut: async (expired = false) => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_USER_ID_KEY);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, sessionExpired: expired });
  },

  setProfile: (profile) => {
    set({ user: profile });
  },

  clearSessionExpired: () => {
    set({ sessionExpired: false });
  },
}));
