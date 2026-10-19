import { createClient } from 'npm:@supabase/supabase-js@2'
import { getStockPrices } from './stock-prices.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return respond(405, { error: 'Naudokite POST užklausą.' })
  }

  let body

  try {
    body = await request.json()
  } catch {
    return respond(400, { error: 'Neteisingas užklausos formatas.' })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return respond(400, { error: 'Neteisingas užklausos formatas.' })
  }

  const { symbol, type, quantity } = body

  if (!['AAPL', 'MSFT', 'TSLA'].includes(symbol)) {
    return respond(400, { error: 'Nepalaikomas akcijos simbolis.' })
  }

  if (!['BUY', 'SELL'].includes(type)) {
    return respond(400, { error: 'Veiksmas turi būti BUY arba SELL.' })
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    quantity > 2147483647
  ) {
    return respond(400, {
      error: 'Kiekis turi būti teigiamas sveikasis skaičius.',
    })
  }

  let prices: Record<string, number>

  try {
    prices = await getStockPrices(Deno.env.get('STOCK_API_URL'))

    for (const stock of ['AAPL', 'MSFT', 'TSLA']) {
      if (!Number.isFinite(prices[stock]) || prices[stock] <= 0) {
        throw new Error('INVALID_PRICE')
      }
    }
  } catch {
    return respond(503, {
      error: 'Akcijų kainos šiuo metu nepasiekiamos. Sandoris neatliktas.',
    })
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !key) {
    return respond(500, { error: 'Trūksta serverio nustatymų.' })
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    const { data, error } = await supabase.rpc('execute_trade', {
      p_symbol: symbol,
      p_type: type,
      p_quantity: quantity,
      p_prices: prices,
    })

    if (error) {
      const businessErrors = [
        'Nepakanka virtualių pinigų.',
        'Nepakanka turimų akcijų.',
        'Sandorio vertė per maža.',
      ]

      const message = businessErrors.includes(error.message)
        ? error.message
        : 'Nepavyko įvykdyti sandorio.'

      return respond(400, { error: message })
    }

    return respond(200, { data })
  } catch {
    return respond(500, {
      error: 'Nepavyko gauti sandorio rezultato. Prieš kartodami patikrinkite istoriją.',
    })
  }
})
