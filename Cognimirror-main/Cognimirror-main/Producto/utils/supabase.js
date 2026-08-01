import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Exportamos el cliente para que cualquier parte de la app pueda usarlo
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
