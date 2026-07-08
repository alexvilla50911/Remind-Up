
create table reminders (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  notify_at timestamptz not null,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table reminders enable row level security;

--
create policy "anon puede insertar" on reminders for insert to anon with check (true);
create policy "anon puede leer" on reminders for select to anon using (true);

create extension if not exists pg_cron;
create extension if not exists pg_net;


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
