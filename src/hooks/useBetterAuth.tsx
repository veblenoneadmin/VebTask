// Simple adapter for better-auth
import { useSession, signIn, signOut, signUp } from '@/lib/auth-client';

export function useBetterAuth() {
  const { data: session, isPending, error } = useSession();

  return {
    session,
    user: session?.user || null,
    loading: isPending,
    error,
    signIn,
    signOut,
    signUp,
  };
}