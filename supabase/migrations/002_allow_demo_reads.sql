begin;

grant select on public.positions,
                public.transactions,
                public.snapshots
to anon;

create policy "Allow reading demo positions"
on public.positions
for select to anon
using (
  profile_id = '00000000-0000-4000-8000-000000000001'::uuid
);

create policy "Allow reading demo transactions"
on public.transactions
for select to anon
using (
  profile_id = '00000000-0000-4000-8000-000000000001'::uuid
);

create policy "Allow reading demo snapshots"
on public.snapshots
for select to anon
using (
  profile_id = '00000000-0000-4000-8000-000000000001'::uuid
);

commit;
