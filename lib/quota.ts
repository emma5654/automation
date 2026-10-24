import 'server-only';
import { cloudMode } from './deployment';
import { cloudSession } from './supabase';
export async function consumeCloudQuota(kind:'images'|'reviews'){
 if(!cloudMode())return;
 const {client}=await cloudSession();const {data,error}=await client.rpc('studio_consume_quota',{kind});
 if(error)throw new Error('CLOUD_STORAGE');if(!data)throw new Error('RATE_LIMIT');
}
