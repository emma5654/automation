import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDB } from '../lib/model';
import { saveCredential,activateCredential,deleteCredential } from '../lib/credentials';
import { planAutomation } from '../lib/planning-provider';
test('planner sends only the selected project context and validates provider responses',async()=>{
 const id=await saveCredential({label:'QA',service:'openai',key:'fixture-not-real-provider-key',model:'fixture-image',textModel:'fixture-text'});await activateCredential(id);
 const original=globalThis.fetch;let request:Record<string,unknown>={};const report={summary:'Entendimento do cliente',questions:['Qual é o horário?'],assumptions:[],tools:['n8n'],nodes:[],connections:[],tests:['Validar'],nextActions:['Responder pergunta']};
 try{
 globalThis.fetch=async(_url,init)=>{request=JSON.parse(String(init?.body));return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(report)}]}]}));};
 const result=await planAutomation(initialDB().projects[0],'Preciso triagem e atendimento humano');
 assert.equal(result.report.summary,report.summary);assert.equal(request.store,false);assert.equal(request.model,'fixture-text');assert.equal(JSON.stringify(result).includes('fixture-not-real-provider-key'),false);
 globalThis.fetch=async()=>new Response(JSON.stringify({status:'incomplete',output:[]}));
 await assert.rejects(()=>planAutomation(initialDB().projects[0],''),/PROVIDER_INVALID_RESPONSE/);
 globalThis.fetch=async()=>new Response('{}',{status:401});await assert.rejects(()=>planAutomation(initialDB().projects[0],''),/PROVIDER_AUTH/);
 }finally{globalThis.fetch=original;await deleteCredential(id);}
});

