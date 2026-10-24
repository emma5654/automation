import { cloudMode } from '../../../lib/deployment';
import { NextResponse } from 'next/server';
import { guard,failure } from '../../../lib/http';
import { readDB } from '../../../lib/store';
import { publicImageConfiguration } from '../../../lib/provider-settings';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{guard(req);return NextResponse.json({db:await readDB(),provider:{...await publicImageConfiguration(),mode:cloudMode()?'supabase':'local',uploadMaxMB:cloudMode()?2:10}},{headers:{'Cache-Control':'private, no-store','Pragma':'no-cache'}});}catch(e){return failure(e);}}
