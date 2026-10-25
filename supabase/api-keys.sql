create table public.studio_api_keys (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 label text not null check(length(label) between 1 and 120),
 service text not null check(length(service) between 1 and 80),
 encrypted text not null check(length(encrypted) between 1 and 16000),
 active boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint studio_api_active_openai check (not active or service='openai')
);
create index studio_api_keys_owner on public.studio_api_keys(user_id,created_at,id);
create unique index studio_api_keys_one_active on public.studio_api_keys(user_id) where active;
alter table public.studio_api_keys enable row level security;
revoke all on public.studio_api_keys from anon,public;
grant select,insert,update,delete on public.studio_api_keys to authenticated;
create policy studio_keys_select on public.studio_api_keys for select to authenticated using ((select auth.uid())=user_id);
create policy studio_keys_insert on public.studio_api_keys for insert to authenticated with check ((select auth.uid())=user_id);
create policy studio_keys_update on public.studio_api_keys for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy studio_keys_delete on public.studio_api_keys for delete to authenticated using ((select auth.uid())=user_id);
create function public.studio_activate_api_key(key_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,90425));
 if not exists(select 1 from public.studio_api_keys where id=key_id and user_id=auth.uid() and service='openai') then raise exception 'NOT_FOUND'; end if;
 update public.studio_api_keys set active=false,updated_at=now() where user_id=auth.uid() and active;
 update public.studio_api_keys set active=true,updated_at=now() where id=key_id and user_id=auth.uid();
 if not found then raise exception 'NOT_FOUND'; end if;
end;
$$;
revoke all on function public.studio_activate_api_key(uuid) from public,anon;
grant execute on function public.studio_activate_api_key(uuid) to authenticated;
-- Preserve the previous encrypted configuration and retain the legacy row for rollback.
insert into public.studio_api_keys(user_id,label,service,encrypted,active)
select user_id,'OpenAI existente','openai',encrypted,true from public.studio_secrets;

