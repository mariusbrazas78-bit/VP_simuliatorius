
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: (input, options = {}) => fetch(input, {
        ...options,
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000),
      }),
    },
  })
  : null

export function getSupabase() {
  if (!supabase) throw new Error('Trūksta Supabase nustatymų. Patikrinkite .env arba Vercel aplinkos kintamuosius.')
  return supabase
}
