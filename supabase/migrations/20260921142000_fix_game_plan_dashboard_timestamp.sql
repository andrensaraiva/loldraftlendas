create or replace function public.get_admin_dashboard_metrics_before_daily_challenges()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  metrics jsonb;
  plan_metrics jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin authorization required' using errcode = '42501';
  end if;

  metrics := public.get_admin_dashboard_metrics_before_game_plans();

  with
  plan_catalog(key, label, sort_order) as (
    values
      ('aggression', 'Agressão', 1),
      ('teamfight', 'Teamfight', 2),
      ('control_pick', 'Controle/Pick', 3),
      ('scaling', 'Escala', 4)
  ),
  started as (
    select distinct on (campaign_id)
      campaign_id,
      properties ->> 'game_plan' as game_plan
    from public.analytics_events
    where
      event_name = 'worlds_started'
      and properties ->> 'game_plan' in ('aggression', 'teamfight', 'control_pick', 'scaling')
    order by campaign_id, occurred_at desc
  ),
  finished as (
    select distinct on (campaign_id)
      campaign_id,
      properties ->> 'outcome' as outcome
    from public.analytics_events
    where event_name = 'campaign_finished'
    order by campaign_id, occurred_at desc
  ),
  aggregate_plans as (
    select
      catalog.key,
      catalog.label,
      catalog.sort_order,
      count(started.campaign_id) as campaigns_started,
      coalesce(round(
        100.0 * count(finished.campaign_id) / nullif(count(started.campaign_id), 0),
        1
      ), 0) as completion_rate,
      coalesce(round(
        100.0 * count(finished.campaign_id) filter (where finished.outcome = 'Campeão mundial') /
        nullif(count(finished.campaign_id), 0),
        1
      ), 0) as title_rate
    from plan_catalog catalog
    left join started on started.game_plan = catalog.key
    left join finished using (campaign_id)
    group by catalog.key, catalog.label, catalog.sort_order
  )
  select jsonb_agg(
    jsonb_build_object(
      'key', key,
      'label', label,
      'campaigns_started', campaigns_started,
      'completion_rate', completion_rate,
      'title_rate', title_rate
    )
    order by sort_order
  )
  into plan_metrics
  from aggregate_plans;

  return jsonb_set(metrics, '{game_plans}', coalesce(plan_metrics, '[]'::jsonb), true);
end;
$$;

revoke all on function public.get_admin_dashboard_metrics_before_daily_challenges() from public, anon, authenticated;
