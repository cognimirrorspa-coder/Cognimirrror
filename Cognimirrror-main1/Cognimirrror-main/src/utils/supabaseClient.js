import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://viqtdxvoryovilzsfhwu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcXRkeHZvcnlvdmlsenNmaHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDcxNzQsImV4cCI6MjA5MjQ4MzE3NH0.ZPyzo2vYCjo1Wozy0s3eVkyS4zmeLH3m7zVo4NiSHJ0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
