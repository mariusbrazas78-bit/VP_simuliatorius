begin;

create function public.execute_trade(
  p_symbol text,
  p_type text,
  p_quantity integer,
  p_prices jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid :=
    '00000000-0000-4000-8000-000000000001';

  v_balance numeric;
  v_quantity integer;
  v_price numeric;
  v_total numeric;
  v_positions_value numeric := 0;
  v_position_price numeric;
  v_transaction_id uuid;
  v_position record;
begin
  -- Tikriname prekybos veiksmą.
  if p_symbol is null
     or p_symbol not in ('AAPL', 'MSFT', 'TSLA') then
    raise exception 'Nepalaikomas akcijos simbolis.';
  end if;

  if p_type is null or p_type not in ('BUY', 'SELL') then
    raise exception 'Veiksmas turi būti BUY arba SELL.';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Kiekis turi būti teigiamas sveikasis skaičius.';
  end if;

  -- Kainų žemėlapį pateiks serveris, gavęs EUR kainas.
  if p_prices is null
     or jsonb_typeof(p_prices) <> 'object' then
    raise exception 'Nepateiktos akcijų kainos.';
  end if;

  if jsonb_typeof(p_prices -> p_symbol)
     is distinct from 'number' then
    raise exception 'Trūksta pasirinktos akcijos kainos.';
  end if;

  v_price := (p_prices ->> p_symbol)::numeric;

  if v_price <= 0 then
    raise exception 'Akcijos kaina turi būti teigiama.';
  end if;

  -- Paskyros užraktas apsaugo nuo lygiagretaus tų pačių pinigų išleidimo.
  select balance
  into v_balance
  from public.profiles
  where id = v_profile_id
  for update;

  if not found then
    raise exception 'Demonstracinė paskyra nerasta.';
  end if;

  select quantity
  into v_quantity
  from public.positions
  where profile_id = v_profile_id
    and symbol = p_symbol;

  v_quantity := coalesce(v_quantity, 0);

  -- Kainos tikslumas atitinka transactions.price lauką.
  v_price := round(v_price, 6);
  v_total := round(v_price * p_quantity, 2);

  if v_price <= 0 or v_total <= 0 then
    raise exception 'Sandorio vertė per maža.';
  end if;

  if p_type = 'BUY' then
    if v_balance < v_total then
      raise exception 'Nepakanka virtualių pinigų.';
    end if;

    v_balance := v_balance - v_total;
    v_quantity := v_quantity + p_quantity;
  else
    if v_quantity < p_quantity then
      raise exception 'Nepakanka turimų akcijų.';
    end if;

    v_balance := v_balance + v_total;
    v_quantity := v_quantity - p_quantity;
  end if;

  update public.profiles
  set balance = v_balance
  where id = v_profile_id;

  insert into public.positions (profile_id, symbol, quantity)
  values (v_profile_id, p_symbol, v_quantity)
  on conflict (profile_id, symbol)
  do update set quantity = excluded.quantity;

  insert into public.transactions (
    profile_id, symbol, type, quantity, price
  )
  values (
    v_profile_id, p_symbol, p_type, p_quantity, v_price
  )
  returning id into v_transaction_id;

  -- Snapshot reikia visų turimų akcijų kainų.
  for v_position in
    select symbol, quantity
    from public.positions
    where profile_id = v_profile_id
      and quantity > 0
  loop
    if jsonb_typeof(p_prices -> v_position.symbol)
       is distinct from 'number' then
      raise exception
        'Trūksta % kainos portfelio vertei apskaičiuoti.',
        v_position.symbol;
    end if;

    v_position_price :=
      (p_prices ->> v_position.symbol)::numeric;

    if v_position_price <= 0 then
      raise exception 'Neteisinga portfelio akcijos kaina.';
    end if;

    v_positions_value := v_positions_value
      + v_position.quantity * v_position_price;
  end loop;

  insert into public.snapshots (
    profile_id, cash_balance, positions_value
  )
  values (
    v_profile_id, v_balance, round(v_positions_value, 2)
  );

  return jsonb_build_object(
    'transactionId', v_transaction_id,
    'balance', v_balance,
    'symbol', p_symbol,
    'quantity', v_quantity,
    'price', v_price
  );
end;
$$;

-- Naršyklė negali pateikti savo kainų ir vykdyti sandorių.
revoke execute on function public.execute_trade(
  text, text, integer, jsonb
) from public, anon, authenticated;

grant execute on function public.execute_trade(
  text, text, integer, jsonb
) to service_role;

commit;
