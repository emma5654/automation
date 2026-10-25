import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:3011';
async function state(){const r=await fetch(base+'/api/state');assert.equal(r.status,200);return (await r.json()).db;}
async function mutate(command){const db=await state();const r=await fetch(base+'/api/mutate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:db.revision,command})});assert.equal(r.status,200,await r.clone().text());return (await r.json()).db;}
test('editable prices seed new projects, support stays separate, and planner fails closed without a key',async()=>{
 const original=await state();const table={...original.pricingTable,hourly:83,services:original.pricingTable.services.map((s,i)=>i===0?{...s,hours:9,monthly:349,supportHours:2}:s)};let projectId,clientId;
 try{
 await mutate({type:'savePricingTable',table});
 let db=await mutate({type:'create',name:'QA business fixture'});const p=db.projects.at(-1);projectId=p.id;assert.equal(p.pricing.hourly,83);assert.equal(p.pricing.monthly,349);assert.equal(p.pricing.supportHours,2);
 const old=db.projects.find(p=>p.id===original.projects[0]?.id);if(old)assert.equal(old.pricing.hourly,original.projects[0].pricing.hourly);
 p.diagnosis.answers.serviceBrief='Atendimento de serviço fictício';p.diagnosis.answers.desiredFlow='Triagem seguida de equipe humana';await mutate({type:'saveProject',project:p});
 let r=await fetch(base+'/api/planner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,message:'Planejar'})});assert.equal(r.status,503);
 r=await fetch(base+'/api/planner',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,planAt:'missing'})});assert.equal(r.status,409);
 const now=new Date().toISOString();clientId=crypto.randomUUID();db=await mutate({type:'library',collection:'clients',record:{id:clientId,createdAt:now,updatedAt:now,ownerId:'local-user',name:'QA fixture cliente',segment:'',contact:'',notes:''}});
 const project=db.projects.find(p=>p.id===projectId);project.clientId=clientId;await mutate({type:'saveProject',project});
 r=await fetch(base+'/api/client-status');assert.equal(r.status,200);const signals=await r.json();assert.equal(signals.items.find(v=>v.clientId===clientId).health.tone,'gray');
 r=await fetch(base+'/api/monitor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId,expectedMinutes:60})});assert.equal(r.status,400);
 }finally{if(projectId)await mutate({type:'deleteProject',projectId});if(clientId)await mutate({type:'deleteLibrary',collection:'clients',id:clientId});await mutate({type:'savePricingTable',table:original.pricingTable});}
});

