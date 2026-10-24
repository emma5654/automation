import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deploymentConfig } from './deployment';

// Only Route Handlers use this client. They can refresh HttpOnly cookies.
// A fresh client per request prevents sessions leaking between users.
export async function serverSupabase(){
 const config=deploymentConfig();if(!config)throw new Error('DEPLOYMENT_CONFIG');
 const jar=await cookies();
 return createServerClient(config.url,config.key,{
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll:()=>jar.getAll(),setAll:values=>{values.forEach(({name,value,options})=>jar.set(name,value,options));}},
 });
}
export async function cloudSession(){
 const client=await serverSupabase();const {data,error}=await client.auth.getUser();
 if(error||!data.user||data.user.is_anonymous)throw new Error('UNAUTHORIZED');
 const allowed=(process.env.STUDIO_ALLOWED_EMAILS||'').toLowerCase().split(',').map(v=>v.trim()).filter(Boolean);
 if(!allowed.length||!allowed.includes(data.user.email?.toLowerCase()||''))throw new Error('FORBIDDEN');
 return {client,user:data.user};
}
