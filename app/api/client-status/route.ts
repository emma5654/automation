import { NextResponse } from 'next/server';
import { guard,failure } from '../../../lib/http';
import { readDB } from '../../../lib/store';
import { cloudMode } from '../../../lib/deployment';
import { cloudSession } from '../../../lib/supabase';
import { clientSignals,healthSignal } from '../../../lib/client-signals';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{guard(req);const now=new Date();const db=await readDB();const items=clientSignals(db,now);if(cloudMode()){const {client,user}=await cloudSession();const {data,error}=await client.from('studio_monitors').select('client_id,expected_minutes,status,last_event_at').eq('user_id',user.id).limit(1000);if(error)throw new Error('CLOUD_STORAGE');for(const item of items)item.health=healthSignal(data?.find(m=>m.client_id===item.clientId),now);}
return NextResponse.json({items,at:now.toISOString()},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return failure(e);}}

