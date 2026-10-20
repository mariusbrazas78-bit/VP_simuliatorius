import { useEffect, useState } from 'react'
import { getStockQuote } from './lib/stocks'

export default function useStockQuote(symbol) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ symbol: null, quote: null, error: '', loading: true })

  useEffect(() => {
    const controller = new AbortController()
    getStockQuote(symbol, { signal: controller.signal })
      .then((quote) => {
        if (!controller.signal.aborted) setState({ symbol, quote, error: '', loading: false })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ symbol, quote: null, error: error.message, loading: false })
      })
    return () => controller.abort()
  }, [symbol, attempt])

  function retry() {
    setState({ symbol, quote: null, error: '', loading: true })
    setAttempt((value) => value + 1)
  }

  return state.symbol === symbol ? { ...state, retry }
    : { quote: null, error: '', loading: true, retry }
}
