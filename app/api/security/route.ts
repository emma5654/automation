import { cloudMode } from '../../../lib/deployment';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { securityRoles } from '../../../lib/security-model';
import { reviewArchitecture } from '../../../lib/security-provider';
import { readDB,transaction,log } from '../../../lib/store';
import { metadata } from '../../../lib/model';
export const runtime='nodejs';
export const maxDuration=300;
const active=new Set<string>();let usage={start:Date.now(),count:0};
export async function POST(req:Request){let key='';try{
 guard(req);const input=z.object({projectId:z.string().uuid(),role:z.enum(securityRoles)}).parse(await req.json());
 const db=await readDB();const p=db.projects.find(p=>p.id===input.projectId);if(!p)throw new Error('NOT_FOUND');
 if(!p.automation.nodes.length)throw new Error('ARCHITECTURE_REQUIRED');
 if(input.role==='pentest'&&(!p.security.scope.trim()||!p.security.authorization.trim()))throw new Error('SCOPE_REQUIRED');
 key=`${p.id}:${input.role}`;if(active.has(key))throw new Error('CONFLICT');active.add(key);
 if(Date.now()-usage.start>3600000)usage={start:Date.now(),count:0};if(!cloudMode()&&usage.count>=Number(process.env.AI_REVIEW_HOURLY_LIMIT||20))throw new Error('RATE_LIMIT');usage.count++;
 const review=await reviewArchitecture(p,input.role);
 const updated=await transaction(db=>{const current=db.projects.find(v=>v.id===p.id);if(!current)throw new Error('NOT_FOUND');if(current.automation.version!==p.automation.version)throw new Error('CONFLICT');current.security.reviews.unshift({...metadata(),role:input.role,version:p.automation.version,...review});log(db,'Revisão de arquitetura por agente de segurança',p.id);});
 return NextResponse.json({db:updated});
 }catch(e){return failure(e);}finally{active.delete(key);}}
