import { NextResponse } from 'next/server';
import { deploymentConfig,cloudMode } from '../../../lib/deployment';
export async function GET(){try{
 deploymentConfig();if(cloudMode()&&(!/^[a-f0-9]{64}$/i.test(process.env.STUDIO_ENCRYPTION_KEY||'')||!process.env.STUDIO_ALLOWED_EMAILS?.trim()))throw new Error('CONFIG');
 return NextResponse.json({status:'ready',storage:cloudMode()?'supabase':'local'},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({status:'configuration_required'},{status:503,headers:{'Cache-Control':'no-store'}});}}
