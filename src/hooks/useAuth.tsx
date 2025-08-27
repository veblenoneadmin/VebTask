import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthSecurity } from '@/lib/auth-security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    
    // Input validation
    if (!email || !password) {
      toast.error('Email and password are required');
      throw new Error('Email and password are required');
    }

    // Email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      throw new Error('Invalid email format');
    }

    // Check account lockout status
    const lockoutStatus = await AuthSecurity.checkAccountLockout(cleanEmail);
    
    if (lockoutStatus.is_locked) {
      const timeRemaining = AuthSecurity.formatLockoutTime(lockoutStatus.locked_until!);
      toast.error(`Account temporarily locked due to multiple failed attempts. Try again in ${timeRemaining}.`);
      throw new Error('Account locked');
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Record failed login attempt
        const isLocked = await AuthSecurity.recordFailedLogin(cleanEmail);
        
        // Log security event
        await AuthSecurity.logSecurityEvent('failed_login', cleanEmail, {
          error: error.message,
          attempts: lockoutStatus.attempts + 1
        });
        
        if (isLocked) {
          toast.error('Too many failed attempts. Account locked for 15 minutes.');
        } else {
          const remainingAttempts = 5 - (lockoutStatus.attempts + 1);
          // Provide more helpful error message
          if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
            toast.error('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('User not found')) {
            toast.error('No account found with this email address. Please sign up first.');
          } else {
            toast.error(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
          }
        }
        
        throw error;
      }

      // Clear failed attempts on successful login
      await AuthSecurity.clearFailedAttempts(cleanEmail);
      
      // Log successful login
      await AuthSecurity.logSecurityEvent('successful_login', cleanEmail);
      
      toast.success('Welcome back!');
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    // Input validation
    if (!email || !password) {
      toast.error('Email and password are required');
      throw new Error('Email and password are required');
    }

    // Email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      throw new Error('Invalid email format');
    }

    // Password strength validation
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      throw new Error('Password too weak');
    }

    // Sanitize names
    const sanitizedFirstName = firstName?.replace(/[<>]/g, '').trim() || '';
    const sanitizedLastName = lastName?.replace(/[<>]/g, '').trim() || '';

    console.log('Attempting signup with:', { 
      email: email.toLowerCase().trim(), 
      redirectTo: `${window.location.origin}/dashboard` 
    });

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
        },
      },
    });

    console.log('Signup response:', { data, error });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists. Try signing in instead.');
      } else if (error.message.includes('Email rate limit exceeded')) {
        toast.error('Email service temporarily unavailable. Please try again in a few minutes.');
      } else {
        toast.error(`Account creation failed: ${error.message}`);
      }
      throw error;
    }

    // Enhanced debugging for email confirmation
    console.log('User created:', {
      id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      confirmation_sent_at: data.user?.confirmation_sent_at
    });

    // Check if user needs email confirmation
    if (data.user && !data.user.email_confirmed_at) {
      if (data.user.confirmation_sent_at) {
        toast.success('Account created! Check your email (including spam folder) to confirm your account.');
      } else {
        toast.error('Account created but confirmation email failed to send. Contact support.');
        console.error('No confirmation_sent_at timestamp - email likely failed');
      }
    } else if (data.user && data.user.email_confirmed_at) {
      toast.success('Account created and confirmed! You can now sign in.');
    } else {
      toast.success('Check your email to confirm your account!');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Signed out successfully');
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      toast.error(`Failed to resend confirmation: ${error.message}`);
      throw error;
    }

    toast.success('Confirmation email sent! Check your inbox and spam folder.');
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}