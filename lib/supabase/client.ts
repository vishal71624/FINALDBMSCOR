import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://syidelmiujkdpwvzlhgm.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5aWRlbG1pdWprZHB3dnpsaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjY1MTMsImV4cCI6MjA4OTc0MjUxM30.6YpGteMcBiqHZ8fBO9G0U2I0beS7bJtycpUKYu8JHfs'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
