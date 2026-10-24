import 'server-only';
import { cloudMode } from './deployment';
import { cloudSession } from './supabase';
import { encryptSecret,decryptSecret } from './secret-crypto';

type ImageConfiguration={key:string;model:string;textModel?:string};
const runtime=globalThis as typeof globalThis & {studioImageConfiguration?:ImageConfiguration};
export async function imageConfiguration():Promise<ImageConfiguration|undefined>{
 if(cloudMode()){
  const {client,user}=await cloudSession();const {data,error}=await client.from('studio_secrets').select('encrypted').eq('user_id',user.id).maybeSingle();
  if(error)throw new Error('CLOUD_STORAGE');return data?JSON.parse(decryptSecret(data.encrypted,user.id)) as ImageConfiguration:undefined;
 }
 if(runtime.studioImageConfiguration)return runtime.studioImageConfiguration;
 if(process.env.OPENAI_API_KEY&&process.env.OPENAI_IMAGE_MODEL)return {key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_IMAGE_MODEL,textModel:process.env.OPENAI_TEXT_MODEL||undefined};
}
export async function publicImageConfiguration(){const config=await imageConfiguration();return {configured:!!config,model:config?.model||null,textModel:config?.textModel||null,source:cloudMode()?(config?'encrypted':'none'):runtime.studioImageConfiguration?'session':config?'environment':'none'};}
export async function configureImageSession(config:ImageConfiguration){
 if(!cloudMode()){runtime.studioImageConfiguration=config;return;}
 const {client,user}=await cloudSession();const {error}=await client.from('studio_secrets').upsert({user_id:user.id,encrypted:encryptSecret(JSON.stringify(config),user.id),updated_at:new Date().toISOString()});if(error)throw new Error('CLOUD_STORAGE');
}
export async function clearImageSession(){
 if(!cloudMode()){delete runtime.studioImageConfiguration;return;}
 const {client,user}=await cloudSession();const {error}=await client.from('studio_secrets').delete().eq('user_id',user.id);if(error)throw new Error('CLOUD_STORAGE');
}
