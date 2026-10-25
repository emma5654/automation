create table public.studio_monitors (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 expected_minutes integer not null default 60 check(expected_minutes between 1 and 10080),
 status text check(status in ('ok','degraded','error')),
 last_event_at timestamptz,
 updated_at timestamptz not null default now(),
 unique(user_id,client_id)
);
alter table public.studio_monitors enable row level security;
revoke all on public.studio_monitors from public,anon;
grant select,insert,update,delete on public.studio_monitors to authenticated,service_role;
create policy studio_monitor_select on public.studio_monitors for select to authenticated using ((select auth.uid())=user_id);
create policy studio_monitor_insert on public.studio_monitors for insert to authenticated with check ((select auth.uid())=user_id);
create policy studio_monitor_update on public.studio_monitors for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy studio_monitor_delete on public.studio_monitors for delete to authenticated using ((select auth.uid())=user_id);

create function public.studio_cleanup_client_monitors() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='DELETE' then
  delete from public.studio_monitors where user_id=OLD.user_id;
  return OLD;
 end if;
 delete from public.studio_monitors m where m.user_id=NEW.user_id and not exists(select 1 from pg_catalog.jsonb_array_elements(coalesce(NEW.document->'clients','[]'::jsonb)) c where c->>'id'=m.client_id::text);
 return NEW;
end;
$$;
revoke all on function public.studio_cleanup_client_monitors() from public,anon;
create trigger studio_cleanup_client_monitors after update of document or delete on public.studio_workspaces for each row execute function public.studio_cleanup_client_monitors();

