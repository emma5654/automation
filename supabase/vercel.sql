-- Remote migration studio_vercel_storage. Payloads stay below function limits.
alter table public.studio_workspaces drop constraint studio_document_size;
alter table public.studio_workspaces add constraint studio_document_size check (octet_length(document::text) <= 2000000);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('studio-exports','studio-exports',false,52428800,array['application/zip']);
create policy studio_export_select on storage.objects for select to authenticated using (bucket_id='studio-exports' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_export_insert on storage.objects for insert to authenticated with check (bucket_id='studio-exports' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_export_update on storage.objects for update to authenticated using (bucket_id='studio-exports' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='studio-exports' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy studio_export_delete on storage.objects for delete to authenticated using (bucket_id='studio-exports' and (storage.foldername(name))[1]=(select auth.uid())::text);
