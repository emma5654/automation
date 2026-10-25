import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
Deno.serve(async(req:Request)=>{
 const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!/^[a-f0-9]{64}$/.test(token))return reply(401,{error:'Invalid token'});
 try{
 if(Number(req.headers.get('content-length')||0)>512)return reply(413,{error:'Payload too large'});
 const text=await req.text();if(text.length>512)return reply(413,{error:'Payload too large'});
 let payload;try{payload=JSON.parse(text);}catch{return reply(400,{error:'Invalid JSON'});}
 if(!payload||!['ok','degraded','error'].includes(payload.status))return reply(400,{error:'status must be ok, degraded or error'});
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(v=>v.toString(16).padStart(2,'0')).join('');
 const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
 const key=keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!key)return reply(503,{error:'Unavailable'});
 const client=createClient(Deno.env.get('SUPABASE_URL')!,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.from('studio_monitors').select('id,last_event_at').eq('token_hash',hash).maybeSingle();
 if(error)return reply(503,{error:'Unavailable'});if(!data)return reply(401,{error:'Invalid token'});
 if(data.last_event_at&&Date.now()-Date.parse(data.last_event_at)<5000)return reply(429,{error:'Wait five seconds between events'});
 const now=new Date().toISOString();
 const result=await client.from('studio_monitors').update({status:payload.status,last_event_at:now,updated_at:now}).eq('id',data.id).eq('token_hash',hash).select('id');
 if(result.error)return reply(503,{error:'Unavailable'});if(!result.data?.length)return reply(401,{error:'Invalid token'});
 return reply(200,{received:true});
 }catch{return reply(500,{error:'Unable to record event'});}
});

