import 'server-only';
import { cloudSession } from './supabase';
import { Database,dbSchema,initialDB } from './model';
export async function readCloudDB():Promise<Database>{
 const {client,user}=await cloudSession();
 let result=await client.from('studio_workspaces').select('document').eq('user_id',user.id).maybeSingle();
 if(result.error)throw new Error('CLOUD_STORAGE');
 if(!result.data){
  const created=await client.from('studio_workspaces').upsert({user_id:user.id,document:initialDB(),revision:0},{onConflict:'user_id',ignoreDuplicates:true});
  if(created.error)throw new Error('CLOUD_STORAGE');
  result=await client.from('studio_workspaces').select('document').eq('user_id',user.id).single();
 }
 if(result.error||!result.data)throw new Error('CLOUD_STORAGE');return dbSchema.parse(result.data.document);
}
export async function cloudTransaction(fn:(db:Database)=>void|Promise<void>,revision?:number){
 const {client,user}=await cloudSession();const db=await readCloudDB();const previous=db.revision;
 if(revision!==undefined&&revision!==previous)throw new Error('CONFLICT');
 await fn(db);db.revision++;dbSchema.parse(db);if(Buffer.byteLength(JSON.stringify(db),'utf8')>1800000)throw new Error('WORKSPACE_TOO_LARGE');
 const {data,error}=await client.from('studio_workspaces').update({document:db,revision:db.revision,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('revision',previous).select('user_id');
 if(error)throw new Error('CLOUD_STORAGE');if(!data?.length)throw new Error('CONFLICT');return db;
}
