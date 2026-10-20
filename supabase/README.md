# Duomenų bazės paruošimas

Naujame Supabase projekte SQL Editor vieną kartą paleiskite visus `migrations` skriptus skaitine tvarka: `001`, `002`, `003`.
Komandos dabartiniame projekte šie skriptai jau įvykdyti rankiniu būdu. Ten jų pakartotinai nevykdykite.

## Vietinis paleidimas

1. Projekto aplanke paleiskite `npm install`.
2. Nukopijuokite `.env.example` į `.env` ir užpildykite Supabase URL bei publishable raktą.
3. Jei reikia tikrų kainų vietiniame projekte, `.env` įrašykite `ALPHA_VANTAGE_API_KEY`. Tai serverio raktas be `VITE_` priešdėlio. Vite kūrimo serveris aptarnauja Julijos `/api/stock` funkciją; raktas į naršyklės paketą neįtraukiamas.
4. Paleiskite `npm run dev` ir atidarykite terminale parodytą adresą.

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

Julijos Vercel funkcija yra `api/stock.js`. Mariaus ekranai, Julijos API ir Arvydo DB kodas dabar yra bendrame šios šakos kode. Adapteris naudoja API HTTP sutartį.

Kai API bus publikuota, Supabase Edge Functions → Secrets pridėkite `STOCK_API_URL` su pilnu adresu, pvz. `https://JUSU-PROJEKTAS.vercel.app/api/stock`, be query parametrų. Tai serverio nustatymas, ne `VITE_` kintamasis. Nepateikite GitHub nuorodos ar localhost adreso. Alpha Vantage raktas lieka Julijos API serverio aplinkoje.

Adapteris kviečia API tris kartus su `symbol=AAPL`, `MSFT`, `TSLA`. Tikrinami simbolis, teigiama skaitinė kaina, `currency: "EUR"` ir `updatedAt` data. Tai istorinės dienos uždarymo kainos, ne realaus laiko kotiruotės. Atskiros akcijos gali turėti skirtingas duomenų datas. Automatinio pakartojimo nėra; kiekvienas bandymas prekiauti sunaudoja iki trijų kainų API užklausų, todėl reikia įvertinti nemokamo plano limitą.

Kol adreso nėra arba API neveikia, grąžinama HTTP 503: „Akcijų kainos šiuo metu nepasiekiamos. Sandoris neatliktas.“ Neteisingi kiekiai atmetami prieš kainų gavimą. Frontend forma prijungta, tačiau tikrų sandorių iš puslapio patikra dar neatlikta. Supabase paskelbtas kodas kol kas yra ankstesnis: kainoms prijungti reikės publikuoti atnaujintus abu serverio failus.

Adapterio automatinė patikra (Node 24): `node --test supabase/functions/trade/stock-prices.test.mjs`. Ji naudoja imituotus HTTP atsakymus ir nenaudoja API rakto ar tikrų sandorių.

## Ekranų integracija

`App.jsx` įkelia profilį, pozicijas, paskutinius 100 sandorių ir iki 500 naujausių snapshots. Portfolio, Trade ir History nebesiremia pavyzdiniais sandoriais. Mygtukas „Atnaujinti duomenis“ leidžia pamatyti ir kito komandos nario įvykdytus sandorius bendroje paskyroje.

Portfolio rodo dabartinį laisvų pinigų balansą ir paskutinį išsaugotą portfelio vertinimą su jo data. Tai nėra nuolat atnaujinamas rinkos vertinimas. P/L lyginamas su pradiniu 10 000 EUR kapitalu. „Grafikai“ naudoja akcijos API istoriją ir Supabase snapshots; tuštiems ar nepasiekiamiems duomenims pavyzdinės reikšmės nepridedamos.

Trade leidžia tik AAPL, MSFT ir TSLA, teigiamą sveiką kiekį ir BUY/SELL. Rodoma preliminari suma pagal EUR API kainą. Serveris sandorio vykdymo metu kainas gauna iš naujo; naršyklė kainos į sandorio užklausą nesiunčia. Vykdymo metu mygtukai blokuojami. Po sėkmės atnaujinamas balansas, pozicijos, istorija ir snapshots. Jei atnaujinimas nepavyksta, pranešama, kad sandoris jau atliktas. Jei užklausos rezultatas neaiškus, prieš kartojant reikia atnaujinti duomenis ir patikrinti istoriją.

## Automatinės patikros

- `npm run lint` ir `npm run build`.
- `npm test`: EUR konvertavimas, API adapteris, validacija ir izoliuotas PostgreSQL (PGlite) su visomis trimis migracijomis. Tikrinamas BUY/SELL, istorija, snapshots, nepakankamos lėšos / akcijos, dalinių pakeitimų atšaukimas bei naršyklės teisių ribojimas. Tikros Supabase DB šie testai nekeičia.
- `npm run test:browser`: paleidžia atskirą Vite serverį 5175 prievade ir naršyklėje tikrina formą, dvigubą paspaudimą, BUY/SELL, perkrovimą, API/DB klaidas ir grafikus su imituotais HTTP atsakymais. Windows naudojamas įdiegtas Microsoft Edge. Kitose sistemose prieš testą paleiskite `npx playwright install chromium`.
- `supabase/tests/trading.sql`: tą patį DB sandorių bandymą galima visą paleisti Supabase SQL Editor kūrimo projekte. Skriptas baigiasi `ROLLBACK`, todėl bandymo duomenys neišsaugomi. Jo nereikia vykdyti kaip migracijos.

## Liko prieš galutinį demonstravimą

1. Vercel nustatyti `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` ir serverio `ALPHA_VANTAGE_API_KEY`, tada publikuoti bendrą projektą.
2. Supabase nustatyti `STOCK_API_URL` ir publikuoti dabartinius `index.ts` bei `stock-prices.ts` failus.
3. Iš viešo puslapio atlikti vieną virtualų BUY ir SELL. Patikrinti `profiles.balance`, `positions`, `transactions`, `snapshots` atnaujinimą ir puslapio perkrovimą. Šie bandymai pakeičia bendrą demonstracinį portfelį, todėl jų nepainioti su izoliuotais automatiniais testais.
4. SQL funkcijoje `FOR UPDATE` užraktas saugo nuo lygiagrečių tos pačios paskyros sandorių. Automatinis PGlite testas tikrina nuoseklias operacijas ir rollback, bet ne atskirų PostgreSQL prisijungimų lenktynes. Jei norite tai papildomai patikrinti kūrimo DB, dviem SQL sesijomis bandykite pirkimus, kurių bendra suma viršija balansą: antroji sesija turi palaukti pirmosios transakcijos pabaigos ir tikrinti jau atnaujintą balansą.
