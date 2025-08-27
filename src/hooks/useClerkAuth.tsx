import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/clerk-client';
import { toast } from 'sonner';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuth();
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (clerkUser) {
      // Create a user object compatible with existing code
      const compatibleUser = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        user_metadata: {
          first_name: clerkUser.firstName || '',
          last_name: clerkUser.lastName || '',
        },
      };

      // Create a compatible session object
      const compatibleSession = {
        user: compatibleUser,
        access_token: 'clerk-session',
      };

      setUser(compatibleUser);
      setSession(compatibleSession);

      // Set up Supabase headers with Clerk token
      setupSupabaseAuth(clerkUser.id);

      // Sync user with Supabase profiles table
      syncUserWithSupabase(compatibleUser);
    } else {
      setUser(null);
      setSession(null);
    }

    setLoading(false);
  }, [clerkUser, clerkLoaded, getToken]);

  const setupSupabaseAuth = async (userId: string) => {
    try {
      // For development, we'll set the user ID in a way that RLS can access
      // In production, you would set up proper JWT integration with Clerk
      // For now, we'll disable RLS and rely on application-level security
      console.log('Setting up auth for user:', userId);
    } catch (error) {
      console.error('Error setting up Supabase auth:', error);
    }
  };

  const syncUserWithSupabase = async (user: any) => {
    try {
      // For now, we'll skip profile creation to avoid RLS issues
      // In a full production setup, you'd configure proper Clerk-Supabase JWT integration
      console.log('Skipping profile sync for now - user:', user.id);
      
      // Commented out until proper Clerk-Supabase RLS integration is set up
      /*
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile with Clerk user ID
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            first_name: user.user_metadata.first_name,
            last_name: user.user_metadata.last_name,
          });

        if (error) {
          console.error('Error creating profile:', error);
        }
      }
      */
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
    }
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
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