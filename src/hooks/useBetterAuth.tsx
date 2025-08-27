import { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signOut, signUp, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { Session, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn.email(
        { email, password },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Invalid email or password');
            throw new Error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success('Welcome back!');
          },
        }
      );
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      await signUp.email(
        { 
          email, 
          password, 
          name: `${firstName || ''} ${lastName || ''}`.trim(),
          firstName,
          lastName,
        },
        {
          onRequest: () => setLoading(true),
          onResponse: () => setLoading(false),
          onError: (ctx) => {
            toast.error(ctx.error.message || 'Unable to create account');
            throw new Error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success('Account created successfully!');
          },
        }
      );
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Error signing out');
      throw error;
    }
  };

  const value = {
    user: session?.user || null,
    session: session || null,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
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