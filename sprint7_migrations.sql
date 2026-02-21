-- ============================================================
-- Sprint 7 Migrations — AI Fresh Daily
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 7.2  Newsletter subscribers table (idempotent) ────────
create table if not exists newsletter_subscribers (
  id            bigint generated always as identity primary key,
  email         text not null unique,
  subscribed_at timestamptz not null default now(),
  is_active     boolean not null default true
);

-- Enable RLS (email addresses must never be readable via anon key)
alter table newsletter_subscribers enable row level security;

-- No SELECT policy for anon — only SECURITY DEFINER functions can read

-- ── subscribe_email RPC (upsert — safe to re-run) ─────────
create or replace function subscribe_email(p_email text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('success', false, 'error', 'invalid_email');
  end if;

  insert into newsletter_subscribers (email)
  values (lower(trim(p_email)))
  on conflict (email) do update
    set is_active = true;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function subscribe_email(text) to anon, authenticated;

-- ── get_newsletter_stats RPC ──────────────────────────────
create or replace function get_newsletter_stats()
returns table(total_subscribers bigint)
language sql
security definer
as $$
  select count(*) as total_subscribers
  from newsletter_subscribers
  where is_active = true;
$$;

grant execute on function get_newsletter_stats() to anon, authenticated;

-- ── Verify ────────────────────────────────────────────────
-- select get_newsletter_stats();
-- select subscribe_email('test@example.com');
-- select get_newsletter_stats();   -- should return 1
