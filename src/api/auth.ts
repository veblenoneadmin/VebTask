import { auth } from "@/lib/auth";

// Export the auth handlers for use in your app
export const { GET, POST } = auth.handler;