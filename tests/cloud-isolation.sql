-- Run as database administrator. All fixtures and quota changes are rolled back.
begin;
insert into auth.users(id) values
 ('a9dbe28e-719b-4fdb-9cf0-cc55e9000001'),
 ('a9dbe28e-719b-4fdb-9cf0-cc55e9000002');
insert into public.studio_workspaces(user_id,document,revision) values
 ('a9dbe28e-719b-4fdb-9cf0-cc55e9000001','{"revision":0,"marker":"A"}',0),
 ('a9dbe28e-719b-4fdb-9cf0-cc55e9000002','{"revision":0,"marker":"B"}',0);
insert into public.studio_secrets(user_id,encrypted) values
 ('a9dbe28e-719b-4fdb-9cf0-cc55e9000001','fixture-A'),
 ('a9dbe28e-719b-4fdb-9cf0-cc55e9000002','fixture-B');
insert into storage.objects(bucket_id,name) values
 ('studio-images','a9dbe28e-719b-4fdb-9cf0-cc55e9000001/fixture.png'),
 ('studio-images','a9dbe28e-719b-4fdb-9cf0-cc55e9000002/fixture.png'),
 ('studio-exports','a9dbe28e-719b-4fdb-9cf0-cc55e9000001/fixture.zip'),
 ('studio-exports','a9dbe28e-719b-4fdb-9cf0-cc55e9000002/fixture.zip');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a9dbe28e-719b-4fdb-9cf0-cc55e9000001","role":"authenticated"}',true);
do $$
declare affected integer; accepted boolean;
begin
 if (select count(*) from public.studio_workspaces)<>1 then raise exception 'workspace isolation failed'; end if;
 if (select count(*) from public.studio_secrets)<>1 then raise exception 'secret isolation failed'; end if;
 if (select count(*) from storage.objects where bucket_id='studio-images')<>1 then raise exception 'image isolation failed'; end if;
 if (select count(*) from storage.objects where bucket_id='studio-exports')<>1 then raise exception 'export isolation failed'; end if;
 update public.studio_workspaces set document='{"revision":0}' where user_id='a9dbe28e-719b-4fdb-9cf0-cc55e9000002';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'cross-user write allowed'; end if;
 begin
  update public.studio_workspaces set user_id='a9dbe28e-719b-4fdb-9cf0-cc55e9000002' where user_id='a9dbe28e-719b-4fdb-9cf0-cc55e9000001';
  raise exception 'owner reassignment allowed';
 exception when insufficient_privilege then null;
 end;
 for i in 1..10 loop
  accepted:=public.studio_consume_quota('images');
  if not accepted then raise exception 'quota rejected too early'; end if;
 end loop;
 if public.studio_consume_quota('images') then raise exception 'quota exceeded'; end if;
 update public.studio_workspaces set document='{"revision":1}',revision=1 where revision=0;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'own write failed'; end if;
 update public.studio_workspaces set document='{"revision":1}',revision=1 where revision=0;
 get diagnostics affected=row_count;if affected<>0 then raise exception 'stale write allowed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"a9dbe28e-719b-4fdb-9cf0-cc55e9000002","role":"authenticated"}',true);
do $$ begin
 if (select document->>'marker' from public.studio_workspaces) <> 'B' then raise exception 'user B data changed'; end if;
 if not public.studio_consume_quota('images') then raise exception 'quotas shared between users'; end if;
end $$;
reset role;
select 'PASS: two-user isolation, private storage, owner protection, optimistic revision, quota limit and separation' as result;
rollback;
