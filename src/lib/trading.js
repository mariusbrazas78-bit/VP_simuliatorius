import { getSupabase } from './supabase'
import { validateTrade } from './stocks'

export const DEMO_PROFILE_ID = '00000000-0000-4000-8000-000000000001'

export async function getProfile() {
  const { data, error } = await getSupabase().from('profiles')
    .select('id, name, balance').eq('id', DEMO_PROFILE_ID).single()
  if (error) throw new Error('Nepavyko gauti paskyros duomenų.')
  return data
}

export async function getPositions() {
  const { data, error } = await getSupabase().from('positions')
    .select('symbol, quantity').eq('profile_id', DEMO_PROFILE_ID)
    .gt('quantity', 0).order('symbol')
  if (error) throw new Error('Nepavyko gauti turimų akcijų.')
  return data
}

export async function getTransactions() {
  const { data, error } = await getSupabase().from('transactions')
    .select('id, symbol, type, quantity, price, created_at')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100)
  if (error) throw new Error('Nepavyko gauti sandorių istorijos.')
  return data
}

export async function getSnapshots() {
  const { data, error } = await getSupabase().from('snapshots')
    .select('id, cash_balance, positions_value, total_value, created_at')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(500)
  if (error) throw new Error('Nepavyko gauti portfelio vertės istorijos.')
  return data.reverse()
}

export async function getTradingData() {
  const [profile, positions, transactions, snapshots] = await Promise.all([
    getProfile(), getPositions(), getTransactions(), getSnapshots(),
  ])
  return { profile, positions, transactions, snapshots }
}

export async function executeTrade({ symbol, type, quantity }) {
  validateTrade({ symbol, type, quantity })
  const { data, error } = await getSupabase().functions.invoke('trade', {
    body: { symbol, type, quantity },
  })
  const uncertain = 'Nepavyko gauti sandorio rezultato. Prieš kartodami atnaujinkite duomenis ir patikrinkite istoriją.'
  if (error) {
    let message = uncertain
    if (error.context instanceof Response) {
      try {
        const response = await error.context.json()
        if (typeof response.error === 'string') message = response.error
        else if (error.context.status === 401) message = 'Serveris atmetė prieigos raktą. Patikrinkite trade funkcijos prieigos nustatymus.'
      } catch { /* Neaiškaus atsakymo atveju nesiūlome aklai kartoti sandorio. */ }
    }
    throw new Error(message)
  }
  if (!data?.data?.transactionId) throw new Error(uncertain)
  return data.data
}
