-- Correr esto una sola vez en el SQL Editor de Supabase (Project > SQL Editor)

create table reminders (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  notify_at timestamptz not null,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reminders enable row level security;

-- la app de escritorio usa la anon key, solo necesita poder crear y leer
create policy "anon puede insertar" on reminders for insert to anon with check (true);
create policy "anon puede leer" on reminders for select to anon using (true);

-- pg_cron dispara la función, pg_net es lo que le permite hacer el request http
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- reemplaza <SERVICE_ROLE_KEY> por la key real de Project Settings > API antes de correr esto
-- (no la pegues en ningún archivo del repo, solo aquí en el editor)
select cron.schedule(
  'check-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://frvluocqqmkoqydscpdn.supabase.co/functions/v1/check-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    )
  );
  $$
);
