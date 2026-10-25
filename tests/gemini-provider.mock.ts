import test from 'node:test';
import assert from 'node:assert/strict';
import { saveCredential,activateCredential,deleteCredential,listCredentials } from '../lib/credentials';
import { imageConfiguration,publicImageConfiguration } from '../lib/provider-settings';
import { planAutomation } from '../lib/planning-provider';
import { initialDB } from '../lib/model';
test('Gemini activates for text only and uses the Google endpoint without exposing its secret',async()=>{
 const secret='fixture-google-key-not-real-12345678';const id=await saveCredential({label:'QA Gemini',service:'gemini',key:secret,model:'gpt-image-1.5',textModel:'gpt-4.1-mini'});await activateCredential(id);
 const original=globalThis.fetch;const report={summary:'Plano fictício Gemini',questions:['Qual serviço?'],assumptions:[],tools:[],nodes:[],connections:[],tests:[],nextActions:['Responder']};
 try{
 assert.equal(await imageConfiguration(),undefined);const config=await publicImageConfiguration();assert.equal(config.configured,false);assert.equal(config.textConfigured,true);assert.equal(config.textProvider,'gemini');assert.equal(config.textModel,'gemini-3.5-flash-lite');assert.equal(JSON.stringify(await listCredentials()).includes(secret),false);
 globalThis.fetch=async(url,init)=>{assert.ok(String(url).startsWith('https://generativelanguage.googleapis.com/'));assert.equal(new Headers(init?.headers).get('x-goog-api-key'),secret);assert.equal(new Headers(init?.headers).has('authorization'),false);const body=JSON.parse(String(init?.body));assert.ok(body.generationConfig.responseFormat.text.schema.properties.summary);return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(report)}]}}]}));};
 const result=await planAutomation(initialDB().projects[0],'Montar plano');assert.equal(result.report.summary,report.summary);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED'}}),{status:429});await assert.rejects(()=>planAutomation(initialDB().projects[0],''),/PROVIDER_QUOTA/);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{details:[{reason:'SERVICE_DISABLED'}]}}),{status:403});await assert.rejects(()=>planAutomation(initialDB().projects[0],''),/PROVIDER_SERVICE_DISABLED/);
 }finally{globalThis.fetch=original;await deleteCredential(id);}
});

