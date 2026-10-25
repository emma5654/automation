import 'server-only';
import { cloudMode } from './deployment';
import { cloudSession } from './supabase';
import { encryptSecret,decryptSecret } from './secret-crypto';
import { normalizeTextModel,credentialInput,type CredentialInput,type CredentialSummary,type CredentialPage } from './credential-model';
type Row={id:string;label:string;service:string;active:boolean;created_at:string;encrypted:string};
type Payload={key:string;model:string;textModel?:string};
const runtime=globalThis as typeof globalThis & {studioCredentialRows?:Map<string,Row>};
function local(){return runtime.studioCredentialRows??=new Map();}
function payload(row:Row,owner?:string):Payload{return JSON.parse(owner?decryptSecret(row.encrypted,owner):row.encrypted);}
function summary(row:Row,owner?:string):CredentialSummary{const p=payload(row,owner);return {id:row.id,label:row.label,service:row.service,active:row.active,createdAt:row.created_at,model:p.model,textModel:normalizeTextModel(row.service,p.textModel)};}
export async function listCredentials(page=0):Promise<CredentialPage>{
 if(!cloudMode()){const rows=[...local().values()].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));return {items:rows.slice(page*50,page*50+50).map(r=>summary(r)),hasMore:rows.length>(page+1)*50,page,mode:'local'};}
 const {client,user}=await cloudSession();const {data,error}=await client.from('studio_api_keys').select('id,label,service,active,created_at,encrypted').eq('user_id',user.id).order('created_at').order('id').range(page*50,page*50+50);
 if(error)throw new Error('CLOUD_STORAGE');const rows=(data||[]) as Row[];return {items:rows.slice(0,50).map(r=>summary(r,user.id)),hasMore:rows.length>50,page,mode:'supabase'};
}
export async function saveCredential(input:CredentialInput,existingId?:string){
 const value=credentialInput.parse(input);const id=existingId||crypto.randomUUID();const {key,model}=value;const textModel=normalizeTextModel(value.service,value.textModel);const secret=JSON.stringify({key,model,textModel});
 if(!cloudMode()){const previous=local().get(id);if(existingId&&!previous)throw new Error('NOT_FOUND');if(previous?.active&&!['openai','gemini'].includes(value.service))throw new Error('CREDENTIAL_ACTIVE');local().set(id,{id,label:value.label,service:value.service,active:previous?.active||false,created_at:previous?.created_at||new Date().toISOString(),encrypted:secret});return id;}
 const {client,user}=await cloudSession();const fields={label:value.label,service:value.service,encrypted:encryptSecret(secret,user.id),updated_at:new Date().toISOString()};
 const result=existingId?await client.from('studio_api_keys').update(fields).eq('user_id',user.id).eq('id',id).select('id'):await client.from('studio_api_keys').insert({...fields,id,user_id:user.id}).select('id');
 if(result.error){if(result.error.code==='23514')throw new Error('CREDENTIAL_ACTIVE');throw new Error('CLOUD_STORAGE');}if(!result.data?.length)throw new Error('NOT_FOUND');return id;
}
export async function activateCredential(id:string){
 if(!cloudMode()){const row=local().get(id);if(!row||!['openai','gemini'].includes(row.service))throw new Error('NOT_FOUND');for(const r of local().values())r.active=r.id===id;return;}
 const {client}=await cloudSession();const {error}=await client.rpc('studio_activate_api_key',{key_id:id});if(error){if(error.message.includes('NOT_FOUND'))throw new Error('NOT_FOUND');throw new Error('CLOUD_STORAGE');}
}
export async function deleteCredential(id:string){
 if(!cloudMode()){if(!local().delete(id))throw new Error('NOT_FOUND');return;}
 const {client,user}=await cloudSession();const {data,error}=await client.from('studio_api_keys').delete().eq('user_id',user.id).eq('id',id).select('id');if(error)throw new Error('CLOUD_STORAGE');if(!data?.length)throw new Error('NOT_FOUND');
}
export async function activeCredential():Promise<(Payload&{id:string;service:string})|undefined>{
 if(!cloudMode()){const row=[...local().values()].find(r=>r.active&&['openai','gemini'].includes(r.service));return row?{...payload(row),id:row.id,service:row.service}:undefined;}
 const {client,user}=await cloudSession();const {data,error}=await client.from('studio_api_keys').select('id,label,service,active,created_at,encrypted').eq('user_id',user.id).eq('active',true).maybeSingle();if(error)throw new Error('CLOUD_STORAGE');return data?{...payload(data as Row,user.id),id:data.id,service:data.service}:undefined;
}

