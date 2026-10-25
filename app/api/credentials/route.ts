import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { credentialInput } from '../../../lib/credential-model';
import { listCredentials,saveCredential,activateCredential,deleteCredential } from '../../../lib/credentials';
const json=(body:unknown)=>NextResponse.json(body,{headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){try{guard(req);const page=z.coerce.number().int().min(0).max(1000000).parse(new URL(req.url).searchParams.get('page')||0);return json(await listCredentials(page));}catch(e){return failure(e);}}
export async function POST(req:Request){try{guard(req);const id=await saveCredential(credentialInput.parse(await req.json()));return json({id,saved:true});}catch(e){return failure(e);}}
export async function PATCH(req:Request){try{guard(req);const body=z.discriminatedUnion('action',[z.object({action:z.literal('activate'),id:z.string().uuid()}),z.object({action:z.literal('replace'),id:z.string().uuid(),credential:credentialInput})]).parse(await req.json());if(body.action==='activate')await activateCredential(body.id);else await saveCredential(body.credential,body.id);return json({saved:true});}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{guard(req);const {id}=z.object({id:z.string().uuid()}).parse(await req.json());await deleteCredential(id);return json({removed:true});}catch(e){return failure(e);}}

