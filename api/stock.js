
export default async function handler(req, res) {
    const symbol = String(req.query.symbol || '').toUpperCase();
  
    if (!['AAPL', 'MSFT', 'TSLA'].includes(symbol)) {
      return res.status(400).json({
        error: 'Pasirink AAPL, MSFT arba TSLA',
      });
    }
  
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({
        error: 'Nenustatytas API raktas',
      });
    }
  
    try {
      const url = new URL('https://www.alphavantage.co/query');
      url.searchParams.set('function', 'TIME_SERIES_DAILY');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', apiKey);
  
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error('API užklausa nepavyko');
      }
  
      const data = await response.json();

      if (data.Information || data.Note) {
        return res.status(502).json({
          error: 'Alpha Vantage laikinai riboja užklausas. Palaukite ir bandykite vėliau.',
        });
      }
  
      const history = data['Time Series (Daily)'];
  
      if (!history) {
        return res.status(502).json({
          error: 'Kainos gauti nepavyko. Patikrink API limitą arba plano galimybes.',
        });
      }
  
      const dates = Object.keys(history).sort();
      const latestDate = dates[dates.length - 1];
      const priceHistory = dates.slice(-30).map((date) => ({
        date,
        price: Number(history[date]['4. close']),
      }));
  
      return res.status(200).json({
        symbol,
        price: Number(history[latestDate]['4. close']),
        updatedAt: latestDate,
        history: priceHistory,
      });
    } catch {
      return res.status(500).json({
        error: 'Nepavyko susisiekti su akcijų kainų tiekėju',
      });
    }
  }
  
