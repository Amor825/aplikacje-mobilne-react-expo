import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

type SupabaseStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStorage = (): SupabaseStorage => {
  const store = new Map<string, string>();

  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      store.set(key, value);
    },
    removeItem: async (key) => {
      store.delete(key);
    },
  };
};

const webStorage: SupabaseStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? {
        getItem: async (key) => window.localStorage.getItem(key),
        setItem: async (key, value) => {
          window.localStorage.setItem(key, value);
        },
        removeItem: async (key) => {
          window.localStorage.removeItem(key);
        },
      }
    : memoryStorage();

  const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Brakuje EXPO_PUBLIC_SUPABASE_URL lub EXPO_PUBLIC_SUPABASE_ANON_KEY w .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type BookStatus = 'to_read' | 'reading' | 'finished';

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  date_added: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}