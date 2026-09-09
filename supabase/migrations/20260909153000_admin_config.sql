create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.product_config (
  id boolean primary key default true check (id),
  version integer not null default 1 check (version > 0),
  starting_exchanges smallint not null default 3 check (starting_exchanges between 0 and 9),
  active_years integer[] not null check (cardinality(active_years) > 0),
  active_region_groups text[] not null check (
    cardinality(active_region_groups) > 0
    and active_region_groups <@ array[
      'KOREA',
      'CHINA',
      'EUROPE',
      'NORTH_AMERICA',
      'OTHER_REGIONS',
      'EUROPE_NORTH_AMERICA'
    ]::text[]
  ),
  analytics_enabled boolean not null default true,
  maintenance_banner text,
  dataset_version text not null,
  updated_at timestamptz not null default now()
);

insert into public.product_config (
  id,
  starting_exchanges,
  active_years,
  active_region_groups,
  analytics_enabled,
  dataset_version
)
values (
  true,
  3,
  array[2015, 2017, 2019, 2020, 2022, 2023],
  array['KOREA', 'CHINA', 'EUROPE', 'NORTH_AMERICA', 'OTHER_REGIONS', 'EUROPE_NORTH_AMERICA'],
  true,
  'multi-era-v1.0.0'
)
on conflict (id) do nothing;

alter table public.product_config enable row level security;

create policy "admins can read product config"
on public.product_config
for select
to authenticated
using (public.is_admin());

create or replace function public.update_product_config(
  p_expected_version integer,
  p_starting_exchanges smallint,
  p_active_years integer[],
  p_active_region_groups text[],
  p_analytics_enabled boolean,
  p_maintenance_banner text,
  p_dataset_version text
)
returns public.product_config
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_config public.product_config;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  update public.product_config
  set
    version = version + 1,
    starting_exchanges = p_starting_exchanges,
    active_years = p_active_years,
    active_region_groups = p_active_region_groups,
    analytics_enabled = p_analytics_enabled,
    maintenance_banner = nullif(btrim(p_maintenance_banner), ''),
    dataset_version = p_dataset_version,
    updated_at = now()
  where id = true and version = p_expected_version
  returning * into updated_config;

  if updated_config is null then
    raise exception 'configuration changed; reload and try again' using errcode = 'P0001';
  end if;

  return updated_config;
end;
$$;

revoke all on function public.update_product_config(integer, smallint, integer[], text[], boolean, text, text) from public;
grant execute on function public.update_product_config(integer, smallint, integer[], text[], boolean, text, text) to authenticated;