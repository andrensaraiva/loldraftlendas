-- Run after replaying migrations into a fresh database. No writes are made.
do $$
declare
  config jsonb := public.get_public_product_config();
  catalog_version text;
  catalog_years jsonb;
begin
  select dataset_version into strict catalog_version
  from public.duel_catalog_versions where active;
  select jsonb_agg(worlds_year order by worlds_year) into catalog_years
  from (
    select distinct worlds_year from public.duel_candidates
    where dataset_version = catalog_version
  ) years;
  if config->>'dataset_version' is distinct from catalog_version then
    raise exception 'initial product configuration does not match the active catalog';
  end if;
  if config->'active_years' is distinct from catalog_years then
    raise exception 'initial product configuration does not cover the current years';
  end if;
  if config->'analytics_enabled' is distinct from 'false'::jsonb then
    raise exception 'analytics must remain disabled during initial activation';
  end if;
end;
$$;
