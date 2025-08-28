import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_APP_URL || window.location.origin;

export const authClient = createAuthClient({
  baseURL: baseURL + "/api/auth",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;