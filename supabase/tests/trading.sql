-- Run the ENTIRE script in Supabase SQL Editor on a development project.
-- Uses artificial EUR prices only for tests. ROLLBACK restores all prior data.
begin;

select id from public.profiles
where id = '00000000-0000-4000-8000-000000000001' for update;

update public.profiles set balance = 10000
where id = '00000000-0000-4000-8000-000000000001';
delete from public.positions
where profile_id = '00000000-0000-4000-8000-000000000001';

do $$
declare
  profile uuid := '00000000-0000-4000-8000-000000000001';
  prices jsonb := '{"AAPL":100,"MSFT":200,"TSLA":150}';
  result jsonb;
  transactions_before bigint;
  snapshots_before bigint;
  positions_before jsonb;
  invalid_quantity integer;
begin
  select count(*) into transactions_before from public.transactions where profile_id = profile;
  select count(*) into snapshots_before from public.snapshots where profile_id = profile;

  result := public.execute_trade('AAPL', 'BUY', 2, prices);
  if (result->>'balance')::numeric <> 9800 or (result->>'quantity')::integer <> 2 then
    raise exception 'BUY test failed';
  end if;
  result := public.execute_trade('AAPL', 'SELL', 1, prices);
  if (result->>'balance')::numeric <> 9900 or (result->>'quantity')::integer <> 1 then
    raise exception 'SELL test failed';
  end if;
  if (select quantity from public.positions where profile_id = profile and symbol = 'AAPL') <> 1 then
    raise exception 'Position persistence failed';
  end if;
  if (select count(*) from public.transactions where profile_id = profile) <> transactions_before + 2 then
    raise exception 'Transaction persistence failed';
  end if;
  if (select count(*) from public.snapshots where profile_id = profile) <> snapshots_before + 2 then
    raise exception 'Snapshot persistence failed';
  end if;
  if not exists (select 1 from public.snapshots where profile_id = profile
    and cash_balance = 9900 and positions_value = 100 and total_value = 10000) then
    raise exception 'Snapshot valuation failed';
  end if;

  begin
    perform public.execute_trade('AAPL', 'BUY', 100, prices);
    raise exception 'Insufficient cash accepted';
  exception when raise_exception then
    if sqlerrm <> 'Nepakanka virtualių pinigų.' then raise; end if;
  end;
  begin
    perform public.execute_trade('AAPL', 'SELL', 2, prices);
    raise exception 'Insufficient shares accepted';
  exception when raise_exception then
    if sqlerrm <> 'Nepakanka turimų akcijų.' then raise; end if;
  end;
  foreach invalid_quantity in array array[0, -1] loop
    begin
      perform public.execute_trade('AAPL', 'BUY', invalid_quantity, prices);
      raise exception 'Invalid quantity accepted';
    exception when raise_exception then
      if sqlerrm <> 'Kiekis turi būti teigiamas sveikasis skaičius.' then raise; end if;
    end;
  end loop;

  -- Fail AFTER balance/position/history changes, while valuing another holding.
  select jsonb_agg(to_jsonb(p) order by symbol) into positions_before
  from public.positions p where profile_id = profile;
  begin
    perform public.execute_trade('MSFT', 'BUY', 1, '{"MSFT":200}');
    raise exception 'Missing portfolio price accepted';
  exception when raise_exception then
    if sqlerrm <> 'Trūksta AAPL kainos portfelio vertei apskaičiuoti.' then raise; end if;
  end;
  if (select balance from public.profiles where id = profile) <> 9900
    or (select jsonb_agg(to_jsonb(p) order by symbol) from public.positions p where profile_id = profile)
      is distinct from positions_before
    or (select count(*) from public.transactions where profile_id = profile) <> transactions_before + 2
    or (select count(*) from public.snapshots where profile_id = profile) <> snapshots_before + 2 then
    raise exception 'Atomic rollback failed';
  end if;

  if has_function_privilege('anon', 'public.execute_trade(text,text,integer,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.execute_trade(text,text,integer,jsonb)', 'EXECUTE') then
    raise exception 'Browser can execute trades directly';
  end if;
  raise notice 'Trading SQL tests passed; test data will be rolled back.';
end;
$$;

rollback;
