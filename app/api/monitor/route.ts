import { NextResponse } from 'next/server';
import { randomBytes,createHash } from 'node:crypto';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { cloudMode,deploymentConfig } from '../../../lib/deployment';
import { cloudSession } from '../../../lib/supabase';
import { readDB } from '../../../lib/store';
const json=(body:unknown)=>NextResponse.json(body,{headers:{'Cache-Control':'private, no-store'}});
async function owner(clientId:string){const db=await readDB();if(!db.clients.some(c=>c.id===clientId))throw new Error('NOT_FOUND');}
export async function GET(req:Request){try{guard(req);const clientId=z.string().uuid().parse(new URL(req.url).searchParams.get('clientId'));await owner(clientId);if(!cloudMode())return json({monitor:null,endpoint:null,mode:'local'});const {client,user}=await cloudSession();const {data,error}=await client.from('studio_monitors').select('id,expected_minutes,status,last_event_at').eq('user_id',user.id).eq('client_id',clientId).maybeSingle();if(error)throw new Error('CLOUD_STORAGE');return json({monitor:data,endpoint:deploymentConfig()!.url+'/functions/v1/studio-health-event',mode:'supabase'});}catch(e){return failure(e);}}
export async function POST(req:Request){try{guard(req);const {clientId,expectedMinutes}=z.object({clientId:z.string().uuid(),expectedMinutes:z.number().int().min(1).max(10080)}).parse(await req.json());await owner(clientId);if(!cloudMode())throw new Error('MONITOR_CLOUD_REQUIRED');const {client,user}=await cloudSession();const token=randomBytes(32).toString('hex');const tokenHash=createHash('sha256').update(token).digest('hex');const {error}=await client.from('studio_monitors').upsert({user_id:user.id,client_id:clientId,token_hash:tokenHash,expected_minutes:expectedMinutes,status:null,last_event_at:null,updated_at:new Date().toISOString()},{onConflict:'user_id,client_id'});if(error)throw new Error('CLOUD_STORAGE');return json({token,endpoint:deploymentConfig()!.url+'/functions/v1/studio-health-event',saved:true});}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{guard(req);const {clientId}=z.object({clientId:z.string().uuid()}).parse(await req.json());await owner(clientId);if(!cloudMode())throw new Error('MONITOR_CLOUD_REQUIRED');const {client,user}=await cloudSession();const {error}=await client.from('studio_monitors').delete().eq('user_id',user.id).eq('client_id',clientId);if(error)throw new Error('CLOUD_STORAGE');return json({removed:true});}catch(e){return failure(e);}}

