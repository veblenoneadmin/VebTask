import { createAuthClient } from "better-auth/react";

// Determine the base URL based on environment
const baseURL = import.meta.env.VITE_APP_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

console.log('Auth client baseURL:', baseURL + '/api/auth');

export const authClient = createAuthClient({
  baseURL: baseURL + "/api/auth",
});

// Export the hooks and methods we'll use
export const {
  signIn,
  signOut, 
  signUp,
  useSession,
} = authClient;