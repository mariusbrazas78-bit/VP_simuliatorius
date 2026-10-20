import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('SQL migrations, atomic BUY/SELL and browser permissions in isolated PostgreSQL', async () => {
  const db = new PGlite()
  try {
    await db.exec('create role anon; create role authenticated; create role service_role;')
    for (const name of ['001_create_trading_tables.sql', '002_allow_demo_reads.sql', '003_execute_trade.sql']) {
      await db.exec(await readFile(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8'))
    }
    await db.exec(await readFile(new URL('../supabase/tests/trading.sql', import.meta.url), 'utf8'))
    assert.equal((await db.query('select balance from public.profiles')).rows[0].balance, '10000.00')
    assert.equal((await db.query('select count(*) from public.transactions')).rows[0].count, 0)
    assert.equal((await db.query('select count(*) from public.positions')).rows[0].count, 0)
    assert.equal((await db.query('select count(*) from public.snapshots')).rows[0].count, 1)

    await db.exec('set role anon;')
    assert.equal((await db.query('select balance from public.profiles')).rows.length, 1)
    await assert.rejects(db.exec('update public.profiles set balance = 99999;'), /permission denied/)
    await assert.rejects(db.exec("select public.execute_trade('AAPL','BUY',1,'{\"AAPL\":1}');"), /permission denied/)
    await db.exec('reset role;')
    // A different profile must not be visible under the demo read policy.
    await db.exec("insert into public.profiles (name) values ('Private test profile'); set role anon;")
    assert.equal((await db.query('select * from public.profiles')).rows.length, 1)
  } finally {
    await db.close()
  }
})
