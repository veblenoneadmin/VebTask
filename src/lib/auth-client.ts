import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/plugins/client";

const baseURL = import.meta.env.VITE_APP_URL || window.location.origin;

export const authClient = createAuthClient({
  baseURL: baseURL + "/api/auth",
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;