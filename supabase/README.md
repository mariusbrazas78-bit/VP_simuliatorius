# Duomenų bazės paruošimas

Naujame Supabase projekte SQL Editor vieną kartą paleiskite visus `migrations` skriptus skaitine tvarka: `001`, `002`, `003`.
Komandos dabartiniame projekte šie skriptai jau įvykdyti rankiniu būdu. Ten jų pakartotinai nevykdykite.

## Vietinis paleidimas

1. Projekto aplanke paleiskite `npm install`.
2. Nukopijuokite `.env.example` į `.env` ir užpildykite Supabase URL bei publishable raktą.
3. Paleiskite `npm run dev` ir atidarykite terminale parodytą adresą.

URL turi būti `https://PROJECT_ID.supabase.co`, be `/rest/v1`. Pakeitus `.env`, perkraukite serverį.
`VITE_` reikšmės pasiekiamos naršyklėje: čia negalima laikyti secret arba service_role raktų. `.env` nekeliamas į GitHub.

## Sutartys komandai

- Bendra demonstracinė paskyra: `00000000-0000-4000-8000-000000000001`, pradinis balansas 10 000 EUR.
- Simboliai: AAPL, MSFT, TSLA. Kiekiai – teigiami sveikieji skaičiai.
- `profiles`: paskyra ir laisvų pinigų `balance`.
- `transactions`: `profile_id`, `symbol`, `type` (BUY/SELL), `quantity`, `price` (vienos akcijos EUR kaina), `created_at`.
- `positions`: `profile_id`, `symbol`, `quantity`.
- `snapshots`: `profile_id`, `cash_balance`, `positions_value`, automatiškai apskaičiuojamas `total_value`, `created_at`. Visos vertės EUR.
- Julijos kainų funkcija grąžins `{ symbol, price, updatedAt }`, kur `price` yra EUR. USD kainos prieš prekybą turi būti konvertuotos.

Pradinis snapshot yra tikra pradinė būsena: 10 000 EUR pinigų ir 0 EUR akcijų.
Visoms lentelėms įjungtas RLS. Naršyklė gali skaityti demonstracinį profilį, pozicijas, istoriją ir snapshots. Rašymo taisyklių naršyklei nepridėta.

## BUY/SELL būsena

`003_execute_trade.sql` apibrėžia serveriui skirtą funkciją, kuri tikrina balansą bei turimą kiekį ir vienoje DB transakcijoje pakeičia balansą, poziciją, sandorių istoriją ir snapshot. Nesėkmės atveju visi šie pakeitimai atšaukiami kartu. Paskyros eilutė užrakinama iki sandorio pabaigos.
Kaina turi ateiti iš patikimo kainų šaltinio, o ne iš vartotojo įvesties. Snapshot akcijų vertė skaičiuojama pagal visų turimų pozicijų kainas.

## Serverio funkcija `trade`

`functions/trade/index.ts` yra serverio funkcija, o `functions/trade/stock-prices.ts` – Julijos kainų API adapteris. Supabase Edge Functions redaktoriuje funkcijai `trade` reikia abiejų failų, jų pavadinimai turi sutapti su importu. Testų failo publikuoti nereikia. Vietiniai pakeitimai automatiškai nepakeičia paskelbtos funkcijos.

POST užklausos formatas: `{ "symbol": "AAPL", "type": "BUY", "quantity": 1 }`. Kaina iš naršyklės nepriimama. `SUPABASE_URL` ir `SUPABASE_SERVICE_ROLE_KEY` skaitomi serverio aplinkoje; raktų reikšmių šiame faile nėra ir į naršyklės `.env` jų dėti negalima.

### Julijos kainų API prijungimas

Julijos šakoje `feature/api-charts` yra Vercel funkcija `api/stock.js`. Ši šaka nebuvo sujungta į `feature/database`; adapteris naudoja jos HTTP sutartį.

Kai API bus publikuota, Supabase Edge Functions → Secrets pridėkite `STOCK_API_URL` su pilnu adresu, pvz. `https://JUSU-PROJEKTAS.vercel.app/api/stock`, be query parametrų. Tai serverio nustatymas, ne `VITE_` kintamasis. Nepateikite GitHub nuorodos ar localhost adreso. Alpha Vantage raktas lieka Julijos API serverio aplinkoje.

Adapteris kviečia API tris kartus su `symbol=AAPL`, `MSFT`, `TSLA`. Tikrinami simbolis, teigiama skaitinė kaina, `currency: "EUR"` ir `updatedAt` data. Tai istorinės dienos uždarymo kainos, ne realaus laiko kotiruotės. Atskiros akcijos gali turėti skirtingas duomenų datas. Automatinio pakartojimo nėra; kiekvienas bandymas prekiauti sunaudoja iki trijų kainų API užklausų, todėl reikia įvertinti nemokamo plano limitą.

Kol adreso nėra arba API neveikia, grąžinama HTTP 503: „Akcijų kainos šiuo metu nepasiekiamos. Sandoris neatliktas.“ Neteisingi kiekiai atmetami prieš kainų gavimą. Frontend forma prijungta, tačiau tikrų sandorių iš puslapio patikra dar neatlikta. Supabase paskelbtas kodas kol kas yra ankstesnis: kainoms prijungti reikės publikuoti atnaujintus abu serverio failus.

Adapterio automatinė patikra (Node 24): `node --test supabase/functions/trade/stock-prices.test.mjs`. Ji naudoja imituotus HTTP atsakymus ir nenaudoja API rakto ar tikrų sandorių.

Patikros: `npm run lint` ir `npm run build`.
