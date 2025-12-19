import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type LoginContext = 'admin' | 'user' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  loginContext: LoginContext;
  signIn: (email: string, password: string, context: LoginContext) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [loginContext, setLoginContext] = useState<LoginContext>(null);

  const checkAdminStatus = async (userEmail: string) => {
    setCheckingAdmin(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      setIsAdmin(!!data && !error);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  useEffect(() => {
    const storedContext = localStorage.getItem('loginContext') as LoginContext;
    setLoginContext(storedContext);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        checkAdminStatus(session.user.email);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user?.email) {
          setUser(session.user);
          await checkAdminStatus(session.user.email);
        } else {
          setUser(null);
          setIsAdmin(false);
          setLoginContext(null);
          localStorage.removeItem('loginContext');
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, context: LoginContext) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user?.email) {
        if (context === 'admin') {
          await checkAdminStatus(data.user.email);
        }
        setLoginContext(context);
        if (context) {
          localStorage.setItem('loginContext', context);
        }
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!error && data.user) {
        setLoginContext('user');
        localStorage.setItem('loginContext', 'user');
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setLoginContext(null);
    localStorage.removeItem('loginContext');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, checkingAdmin, loginContext, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
