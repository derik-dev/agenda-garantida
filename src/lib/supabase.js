import { createClient } from '@supabase/supabase-js'

// Usando variáveis de ambiente para maior segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)