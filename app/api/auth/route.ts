import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { cloudMode } from '../../../lib/deployment';
import { cloudSession,serverSupabase } from '../../../lib/supabase';
const noCache={'Cache-Control':'private, no-store','Pragma':'no-cache'};
export async function GET(req:Request){try{guard(req);if(!cloudMode())return NextResponse.json({mode:'local'},{headers:noCache});const {user}=await cloudSession();return NextResponse.json({mode:'supabase',email:user.email},{headers:noCache});}catch(e){return failure(e);}}
export async function POST(req:Request){try{
 guard(req);if(!cloudMode())throw new Error('DEPLOYMENT_CONFIG');
 const input=z.object({email:z.string().email().max(254),password:z.string().min(1).max(200)}).parse(await req.json());
 const client=await serverSupabase();const {error}=await client.auth.signInWithPassword(input);if(error)throw new Error('UNAUTHORIZED');
 try{await cloudSession();}catch(e){await client.auth.signOut();throw e;}
 return NextResponse.json({ok:true},{headers:noCache});
 }catch(e){return failure(e);}}
export async function DELETE(req:Request){try{guard(req);if(cloudMode()){const client=await serverSupabase();const {error}=await client.auth.signOut();if(error)throw new Error('UNAUTHORIZED');}return NextResponse.json({ok:true},{headers:noCache});}catch(e){return failure(e);}}
