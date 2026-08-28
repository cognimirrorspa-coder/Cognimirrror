import { createClient } from '@supabase/supabase-js';

// Base de Datos Principal (BD 2 - Limpia)
const primaryUrl = import.meta.env.VITE_SUPABASE_URL || 'https://viqtdxvoryovilzsfhwu.supabase.co';
const primaryAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcXRkeHZvcnlvdmlsenNmaHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDcxNzQsImV4cCI6MjA5MjQ4MzE3NH0.ZPyzo2vYCjo1Wozy0s3eVkyS4zmeLH3m7zVo4NiSHJ0';

export const supabase = createClient(primaryUrl, primaryAnonKey);

// Base de Datos de Respaldo / Backup (BD 1)
const backupUrl = import.meta.env.VITE_SUPABASE_BACKUP_URL || 'https://hnbxhuqficktoaivrrqj.supabase.co';
const backupAnonKey = import.meta.env.VITE_SUPABASE_BACKUP_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnhodXFmaWNrdG9haXZycnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTk4NDQsImV4cCI6MjA4MjczNTg0NH0.Q1fHRK4uqxrL5fxiuqS076DRq0xH5UoSnzOcCSzn4Qs';

export const supabaseBackup = createClient(backupUrl, backupAnonKey);

export default supabase;
