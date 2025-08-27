import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://azzyyzympmwrwrjburer.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6enl5enltcG13cndyamJ1cmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTA1MzEsImV4cCI6MjA3MTI2NjUzMX0.UiupCRjMQF3m98tNQiGLrIt-XnyVp-G8y2ksAJek7qY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable Supabase auth since we're using Clerk
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      // This will be set dynamically in the auth hook
    }
  }
})