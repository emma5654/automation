import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLegal,legalSchema,policyText } from '../lib/compliance';
import { validChoice,analyticsSection } from '../lib/tracking';
import { initialDB,dbSchema,clientInputSchema,clientSchema,metadata } from '../lib/model';
import { validateSecurityReport } from '../lib/security-model';

test('legal drafts stay explicit until real company and review details are filled',()=>{
 const legal=emptyLegal();assert.equal(legal.reviewed,false);assert.ok(policyText('privacy',legal).includes('[NOME EMPRESARIAL PENDENTE]'));assert.equal(legalSchema.safeParse({...legal,reviewed:true}).success,false);assert.ok(policyText('refund',legal).includes('sete dias'));assert.ok(policyText('refund',legal).includes('Não há cobrança'));
});
test('tracking choice requires correct policy, positive boolean, timestamp and expiration',()=>{
 const now=Date.now();assert.equal(validChoice(null,'v1',now),false);assert.equal(validChoice({version:'v1',at:now,analytics:false},'v1',now),true);assert.equal(validChoice({version:'old',at:now,analytics:true},'v1',now),false);assert.equal(validChoice({version:'v1',at:now-181*86400000,analytics:true},'v1',now),false);
});
test('analytics sections never contain client/project IDs or arbitrary paths',()=>{
 assert.equal(analyticsSection('/projects/client-secret-uuid/architecture'),'project_architecture');assert.equal(analyticsSection('/projects/client-secret-uuid/private-name'),'project_overview');assert.equal(analyticsSection('/clients/customer@email.example'),'clients');
});
test('contact data needs purpose and legal basis, while older records remain readable',()=>{
 const c={...metadata(),ownerId:'local-user',name:'Cliente',segment:'',contact:'contato@example.test',notes:''};assert.equal(clientSchema.safeParse(c).success,true);assert.equal(clientInputSchema.safeParse(c).success,false);assert.equal(clientInputSchema.safeParse({...c,purpose:'Responder sobre serviço solicitado',legalBasis:'Execução de contrato'}).success,true);assert.equal(clientInputSchema.safeParse({...c,purpose:'Enviar contato autorizado',legalBasis:'Consentimento'}).success,false);
});
test('additive local schema accepts existing records and initializes new modules',()=>{
 const db=JSON.parse(JSON.stringify(initialDB()));delete db.legal;delete db.privacyRequests;delete db.projects[0].security;const parsed=dbSchema.parse(db);assert.equal(parsed.legal.reviewed,false);assert.deepEqual(parsed.privacyRequests,[]);assert.deepEqual(parsed.projects[0].security.reviews,[]);assert.ok(parsed.projects[0].images.every(i=>i.alt.length>0));
});
test('AI security reports reject references to invented nodes',()=>{
 const report={summary:'Hipóteses de revisão',findings:[{nodeId:crypto.randomUUID(),severity:'Alta',title:'Revisar autenticação',detail:'Sem comprovação de implementação.',recommendation:'Verificar a configuração real.'}],testPlan:['Teste manual autorizado'],limitations:['Sem varredura externa']};assert.throws(()=>validateSecurityReport(report,[]),/INVALID_NODE_REFERENCE/);assert.equal(validateSecurityReport({...report,findings:[]},[]).findings.length,0);
});
