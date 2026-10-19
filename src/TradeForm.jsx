
import { useState } from 'react'
import { executeTrade } from './lib/trading'

export default function TradeForm({ onTradeCompleted }) {
  const [symbol, setSymbol] = useState('AAPL')
  const [type, setType] = useState('BUY')
  const [quantity, setQuantity] = useState('1')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (pending) return

    setError('')
    setSuccess('')

    const amount = Number(quantity)

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 2147483647
    ) {
      setError('Kiekis turi būti teigiamas sveikasis skaičius.')
      return
    }

    setPending(true)

    try {
      await executeTrade({ symbol, type, quantity: amount })
    } catch (tradeError) {
      setError(tradeError.message)
      setPending(false)
      return
    }

    setSuccess('Sandoris sėkmingai atliktas.')

    try {
      await onTradeCompleted()
    } catch {
      setError(
        'Sandoris atliktas, bet nepavyko atnaujinti duomenų. Perkraukite puslapį.'
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>Prekyba virtualiais pinigais. Kainos EUR.</p>

      <fieldset disabled={pending}>
        <legend>Sandorio duomenys</legend>

        <p>
          <label htmlFor="trade-symbol">Akcija </label>
          <select
            id="trade-symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
          >
            <option value="AAPL">AAPL</option>
            <option value="MSFT">MSFT</option>
            <option value="TSLA">TSLA</option>
          </select>
        </p>

        <p>
          <label htmlFor="trade-type">Veiksmas </label>
          <select
            id="trade-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="BUY">Pirkti</option>
            <option value="SELL">Parduoti</option>
          </select>
        </p>

        <p>
          <label htmlFor="trade-quantity">Akcijų kiekis </label>
          <input
            id="trade-quantity"
            type="number"
            min="1"
            max="2147483647"
            step="1"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </p>

        <p>
          Sandoris bus vykdomas serverio gauta kaina EUR.
          Galutinė suma priklausys nuo tos kainos.
        </p>

        <button type="submit">
          {pending
            ? 'Vykdomas sandoris…'
            : type === 'BUY'
              ? 'Pirkti'
              : 'Parduoti'}
        </button>
      </fieldset>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </form>
  )
}
