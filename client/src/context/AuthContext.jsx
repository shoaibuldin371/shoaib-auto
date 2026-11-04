import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Check localStorage for offline demo session
      const savedUser = localStorage.getItem('reachout_local_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        // Default local demo user
        const demoUser = {
          id: 'demo-shoaib-001',
          email: 'Mshoaibuldin371@gmail.com',
          user_metadata: {
            full_name: 'Shoaib ul Din',
          },
        };
        setUser(demoUser);
        localStorage.setItem('reachout_local_user', JSON.stringify(demoUser));
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } else {
      const demoUser = {
        id: 'user-' + Date.now(),
        email: email || 'Mshoaibuldin371@gmail.com',
        user_metadata: { full_name: 'Shoaib ul Din' },
      };
      setUser(demoUser);
      localStorage.setItem('reachout_local_user', JSON.stringify(demoUser));
      return { user: demoUser };
    }
  };

  const signUp = async (email, password, fullName = 'Shoaib ul Din') => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return data;
    } else {
      const demoUser = {
        id: 'user-' + Date.now(),
        email,
        user_metadata: { full_name: fullName },
      };
      setUser(demoUser);
      localStorage.setItem('reachout_local_user', JSON.stringify(demoUser));
      return { user: demoUser };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('reachout_local_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

