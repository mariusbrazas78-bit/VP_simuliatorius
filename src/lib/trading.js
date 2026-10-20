
import { supabase } from './supabase'

export const DEMO_PROFILE_ID =
  '00000000-0000-4000-8000-000000000001'

export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, balance')
    .eq('id', DEMO_PROFILE_ID)
    .single()

  if (error) {
    throw new Error(
      `Nepavyko gauti paskyros duomenų: ${error.message}`
    )
  }

  return data
}

export async function getPositions() {
  const { data, error } = await supabase
    .from('positions')
    .select('symbol, quantity')
    .eq('profile_id', DEMO_PROFILE_ID)
    .gt('quantity', 0)
    .order('symbol')

  if (error) {
    throw new Error('Nepavyko gauti turimų akcijų.')
  }

  return data
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, symbol, type, quantity, price, created_at')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error('Nepavyko gauti sandorių istorijos.')
  }

  return data
}

export async function executeTrade({ symbol, type, quantity }) {
    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 2147483647
    ) {
      throw new Error('Kiekis turi būti teigiamas sveikasis skaičius.')
    }
  
    const { data, error } = await supabase.functions.invoke('trade', {
      body: { symbol, type, quantity },
    })
  
    if (error) {
      let message = 'Nepavyko įvykdyti sandorio.'
  
      if (error.context instanceof Response) {
        try {
          const response = await error.context.json()
  
          if (typeof response.error === 'string') {
            message = response.error
          }
        } catch {
          // Jei serveris negrąžino JSON, paliekame bendrą pranešimą.
        }
      } else {
        message =
          'Nepavyko gauti sandorio rezultato. Prieš kartodami patikrinkite istoriją.'
      }
  
      throw new Error(message)
    }
  
    if (!data || !data.data) {
      throw new Error(
        'Negautas sandorio rezultatas. Prieš kartodami patikrinkite istoriją.'
      )
    }
  
    return data.data
  }
  