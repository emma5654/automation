import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { cloudMode } from '../../../lib/deployment';
import { readDB,transaction,log } from '../../../lib/store';
import { applySavedPlan } from '../../../lib/planning-apply';
import { planAutomation } from '../../../lib/planning-provider';
import { planText } from '../../../lib/planning-model';
export const runtime='nodejs';export const maxDuration=180;
let localUsage={at:Date.now(),count:0};
export async function POST(req:Request){try{
 guard(req);const {projectId,message}=z.object({projectId:z.string().uuid(),message:z.string().trim().max(6000).default('')}).parse(await req.json());
 const db=await readDB();const p=db.projects.find(p=>p.id===projectId);if(!p)throw new Error('NOT_FOUND');
 if(![p.problem,p.objective,...Object.values(p.diagnosis.answers)].join(' ').trim())throw new Error('BRIEF_REQUIRED');
 if(!cloudMode()){if(Date.now()-localUsage.at>3600000)localUsage={at:Date.now(),count:0};if(localUsage.count>=20)throw new Error('RATE_LIMIT');localUsage.count++;}
 const plan=await planAutomation(p,message);
 const updated=await transaction(current=>{const project=current.projects.find(v=>v.id===p.id);if(!project)throw new Error('NOT_FOUND');project.diagnosis={...project.diagnosis,updatedAt:new Date().toISOString(),proposal:planText(plan.report),planning:{version:p.automation.version,model:plan.model,at:new Date().toISOString(),report:plan.report}};log(current,'Agente preparou proposta de automação para revisão',p.id);},db.revision);
 return NextResponse.json({db:updated},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return failure(e);}}
export async function PATCH(req:Request){try{
 guard(req);const {projectId,planAt}=z.object({projectId:z.string().uuid(),planAt:z.string().max(100)}).parse(await req.json());const snapshot=await readDB();
 const updated=await transaction(db=>{const p=db.projects.find(v=>v.id===projectId);if(!p)throw new Error('NOT_FOUND');const next=applySavedPlan(p,planAt);db.projects[db.projects.findIndex(v=>v.id===p.id)]=next;log(db,'Proposta do agente aplicada à arquitetura após revisão',p.id);
 },snapshot.revision);
 return NextResponse.json({db:updated},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return failure(e);}}

