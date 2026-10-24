-- Applied remotely as studio_cloud_foundation. Internal local-user labels
-- are not authorization: the outer user_id is the authenticated owner.
create table public.studio_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null,
 revision bigint not null default 0,
 updated_at timestamptz not null default now(),
 constraint studio_revision_matches check (revision >= 0 and revision = (document->>'revision')::bigint),
 constraint studio_document_size check (octet_length(document::text) <= 20000000)
);
alter table public.studio_workspaces enable row level security;
create policy studio_workspace_select on public.studio_workspaces for select to authenticated using ((select auth.uid()) = user_id);
create policy studio_workspace_insert on public.studio_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy studio_workspace_update on public.studio_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy studio_workspace_delete on public.studio_workspaces for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.studio_workspaces from anon;
grant select,insert,update,delete on public.studio_workspaces to authenticated;
create table public.studio_secrets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 encrypted text not null check (length(encrypted) < 5000),
 updated_at timestamptz not null default now()
);
alter table public.studio_secrets enable row level security;
create policy studio_secret_select on public.studio_secrets for select to authenticated using ((select auth.uid()) = user_id);
create policy studio_secret_insert on public.studio_secrets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy studio_secret_update on public.studio_secrets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy studio_secret_delete on public.studio_secrets for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.studio_secrets from anon;
grant select,insert,update,delete on public.studio_secrets to authenticated;
create schema if not exists studio_private;
revoke all on schema studio_private from public;
create table studio_private.usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('images','reviews')),
 hour timestamptz not null,
 count integer not null,
 primary key(user_id,kind,hour)
);
alter table studio_private.usage enable row level security;
-- Definer only in a non-exposed schema, with no caller-supplied owner or limit.
create function studio_private.consume_quota(quota_kind text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); used integer; cap integer;
begin
 if uid is null or quota_kind not in ('images','reviews') then return false; end if;
 cap := case when quota_kind='images' then 10 else 20 end;
 insert into studio_private.usage as u(user_id,kind,hour,count)
 values(uid,quota_kind,date_trunc('hour',now()),1)
 on conflict(user_id,kind,hour) do update set count=u.count+1 where u.count < cap
 returning count into used;
 return used is not null;
end; $$;
revoke all on function studio_private.consume_quota(text) from public;
grant usage on schema studio_private to authenticated;
grant execute on function studio_private.consume_quota(text) to authenticated;
create function public.studio_consume_quota(kind text) returns boolean
language sql security invoker set search_path = '' as $$ select studio_private.consume_quota(kind); $$;
revoke all on function public.studio_consume_quota(text) from public,anon;
grant execute on function public.studio_consume_quota(text) to authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('studio-images','studio-images',false,20971520,array['image/png','image/jpeg','image/webp']);
create policy studio_image_select on storage.objects for select to authenticated using (bucket_id='studio-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_image_insert on storage.objects for insert to authenticated with check (bucket_id='studio-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_image_update on storage.objects for update to authenticated using (bucket_id='studio-images' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='studio-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_image_delete on storage.objects for delete to authenticated using (bucket_id='studio-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Remote hardening migration studio_permission_hardening.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
create policy studio_usage_no_direct_access on studio_private.usage for all to authenticated using (false) with check (false);
