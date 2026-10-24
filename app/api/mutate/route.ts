import { NextResponse } from 'next/server';
import { z } from 'zod';
import { legalSchema,privacyRequestSchema } from '../../../lib/compliance';
import { guard,failure } from '../../../lib/http';
import { transaction,log } from '../../../lib/store';
import { projectSchema,automationSchema,clientInputSchema,messageSchema,skillSchema,newProject,deriveSequence,changeArchitecture,metadata,stamp,id } from '../../../lib/model';
const command=z.discriminatedUnion('type',[
 z.object({type:z.literal('privacyRequestDelete'),id:z.string().uuid()}),
 z.object({type:z.literal('saveLegal'),legal:legalSchema}),
 z.object({type:z.literal('privacyRequest'),record:privacyRequestSchema}),
 z.object({type:z.literal('privacyRequestUpdate'),id:z.string().uuid(),status:z.enum(['Recebida localmente','Em análise','Concluída']),response:z.string().max(5000)}),
 z.object({type:z.literal('create'),name:z.string().min(1).max(300)}),
 z.object({type:z.literal('saveProject'),project:projectSchema}),
 z.object({type:z.literal('architecture'),projectId:z.string().uuid(),automation:automationSchema}),
 z.object({type:z.literal('duplicate'),projectId:z.string().uuid()}),
 z.object({type:z.literal('deleteProject'),projectId:z.string().uuid()}),
 z.object({type:z.literal('library'),collection:z.enum(['clients','messages','skills']),record:z.unknown()}),
 z.object({type:z.literal('deleteLibrary'),collection:z.enum(['clients','messages','skills']),id:z.string().uuid()})
]);
export async function POST(req:Request){try{
 guard(req);const body=await req.json();const revision=z.number().int().parse(body.revision);const c=command.parse(body.command);
 const db=await transaction(db=>{
  if(c.type==='privacyRequestDelete'){db.privacyRequests=db.privacyRequests.filter(v=>v.id!==c.id);log(db,'Solicitação de titular removida pelo responsável');}
  if(c.type==='saveLegal'){if(JSON.stringify(c.legal)!==JSON.stringify(db.legal)&&c.legal.policyVersion===db.legal.policyVersion)c.legal.policyVersion='v'+Date.now();db.legal=c.legal;log(db,'Informações legais atualizadas');}
  if(c.type==='privacyRequest'){db.privacyRequests.push({...c.record,...metadata(),status:'Recebida localmente'});log(db,'Solicitação de titular registrada localmente');}
  if(c.type==='privacyRequestUpdate'){const item=db.privacyRequests.find(v=>v.id===c.id);if(!item)throw new Error('NOT_FOUND');item.status=c.status;item.response=c.response;item.updatedAt=stamp();log(db,'Solicitação de titular atualizada');}
  if(c.type==='create'){const p=deriveSequence(newProject(c.name));db.projects.push(p);log(db,`Projeto criado: ${p.name}`,p.id);}
  if(c.type==='saveProject'){
   const index=db.projects.findIndex(p=>p.id===c.project.id);if(index<0)throw new Error('NOT_FOUND');const previous=db.projects[index];
   // Architecture and historical evidence have dedicated server-controlled operations.
   const next={...c.project,automation:previous.automation,versions:previous.versions,history:previous.history};
   next.images=previous.images.map(image=>{const supplied=c.project.images.find(i=>i.id===image.id);return supplied?{...image,alt:supplied.alt,author:supplied.author,source:supplied.source,rightsNote:supplied.rightsNote,rightsConfirmed:supplied.rightsConfirmed,title:supplied.title,instruction:supplied.instruction,prompt:supplied.prompt,technicalReviewed:supplied.technicalReviewed,status:image.status==='desatualizado'?'desatualizado':(['revisado','testado'].includes(supplied.status)&&image.file?supplied.status:image.status)}:image;});
   next.tests=next.tests.map(test=>{const old=previous.tests.find(t=>t.id===test.id);const runs=old?.runs||[];const changed=old&&(old.status!==test.status||old.observed!==test.observed);return {...test,runs:changed?[...runs,{...metadata(),status:test.status,observed:test.observed,responsible:test.responsible,version:previous.automation.version}]:runs};});
   next.security={...next.security,id:previous.security.id,createdAt:previous.security.createdAt,updatedAt:stamp(),reviews:previous.security.reviews};next.updatedAt=stamp();db.projects[index]=projectSchema.parse(next);log(db,`Projeto atualizado: ${next.name}`,next.id);
  }
  if(c.type==='architecture'){const index=db.projects.findIndex(p=>p.id===c.projectId);if(index<0)throw new Error('NOT_FOUND');db.projects[index]=changeArchitecture(db.projects[index],c.automation);log(db,'Arquitetura salva e sequência sincronizada',c.projectId);}
  if(c.type==='duplicate'){const original=db.projects.find(p=>p.id===c.projectId);if(!original)throw new Error('NOT_FOUND');let p=newProject(`${original.name} · cópia`);const map=new Map(original.automation.nodes.map(n=>[n.id,id()]));p={...p,client:original.client,clientId:original.clientId,segment:original.segment,problem:original.problem,objective:original.objective,tools:original.tools,diagnosis:{...original.diagnosis,...metadata()},automation:{...p.automation,nodes:original.automation.nodes.map(n=>({...n,...metadata(),id:map.get(n.id)!})),connections:original.automation.connections.map(e=>({...e,...metadata(),source:map.get(e.source)!,target:map.get(e.target)!}))},pricing:{...original.pricing,...metadata()}};db.projects.push(deriveSequence(p));log(db,`Projeto duplicado: ${p.name}`,p.id);}
  if(c.type==='deleteProject'){db.projects=db.projects.filter(p=>p.id!==c.projectId);log(db,'Projeto excluído');}
  if(c.type==='library'){const schema={clients:clientInputSchema,messages:messageSchema,skills:skillSchema}[c.collection];const value=schema.parse(c.record);const collection=db[c.collection] as Array<typeof value>;const index=collection.findIndex(v=>v.id===value.id);if(index>=0)collection[index]={...value,createdAt:collection[index].createdAt,updatedAt:stamp()};else collection.push(value);log(db,`Biblioteca atualizada: ${value.name}`);}
  if(c.type==='deleteLibrary'){if(c.collection==='clients'){db.projects.forEach(p=>{if(p.clientId===c.id){p.clientId='';p.client='';}});db.clients=db.clients.filter(v=>v.id!==c.id);}if(c.collection==='messages')db.messages=db.messages.filter(v=>v.id!==c.id);if(c.collection==='skills')db.skills=db.skills.filter(v=>v.id!==c.id);log(db,'Registro removido da biblioteca');}
 },revision);return NextResponse.json({db});
 }catch(e){return failure(e);}}
