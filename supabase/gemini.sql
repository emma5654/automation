alter table public.studio_api_keys drop constraint studio_api_active_openai;
alter table public.studio_api_keys add constraint studio_api_active_supported check (not active or service in ('openai','gemini'));
create or replace function public.studio_activate_api_key(key_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,90425));
 if not exists(select 1 from public.studio_api_keys where id=key_id and user_id=auth.uid() and service in ('openai','gemini')) then raise exception 'NOT_FOUND'; end if;
 update public.studio_api_keys set active=false,updated_at=now() where user_id=auth.uid() and active;
 update public.studio_api_keys set active=true,updated_at=now() where id=key_id and user_id=auth.uid();
 if not found then raise exception 'NOT_FOUND'; end if;
end;
$$;
revoke all on function public.studio_activate_api_key(uuid) from public,anon;
grant execute on function public.studio_activate_api_key(uuid) to authenticated;

