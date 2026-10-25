import test from 'node:test';
import assert from 'node:assert/strict';
import { planSchema } from '../lib/planning-model';
import { initialDB,projectSchema } from '../lib/model';
import { applySavedPlan } from '../lib/planning-apply';
const node=(number:number,type:'Gatilho'|'Humano')=>({number,type,title:'Etapa '+number,platform:'Manual',description:'Descrição',config:'Configuração pendente',inputs:'Evento',outputs:'Próxima etapa',dependencies:'Autorização'});
const report={summary:'Triagem específica ao cliente',questions:['Qual horário de atendimento?'],assumptions:['Equipe disponível'],tools:['n8n'],nodes:[node(1,'Gatilho'),node(2,'Humano')],connections:[{source:1,target:2,label:'Solicita equipe'}],tests:['Pedido de humano'],nextActions:['Validar plataforma']};
test('planner rejects dangling edges and duplicate node numbers',()=>{
 assert.equal(planSchema.safeParse({...report,connections:[{source:1,target:99,label:''}]}).success,false);
 assert.equal(planSchema.safeParse({...report,nodes:[node(1,'Gatilho'),node(1,'Humano')]}).success,false);
});
test('approved plan preserves old architecture, synchronizes tutorials, and refuses stale replay',()=>{
 const p=initialDB().projects[0];p.diagnosis.planning={version:p.automation.version,at:'fixture-plan',model:'fixture',report:planSchema.parse(report)};
 const next=applySavedPlan(p,'fixture-plan');projectSchema.parse(next);
 assert.equal(next.automation.version,p.automation.version+1);assert.equal(next.versions.at(-1)?.nodes.length,p.automation.nodes.length);
 assert.equal(next.automation.nodes.length,2);assert.equal(next.automation.connections[0].target,next.automation.nodes[1].id);
 assert.ok(next.steps.length>0);assert.ok(next.tests.every(t=>t.status==='Pendente'));assert.throws(()=>applySavedPlan(next,'fixture-plan'),/CONFLICT/);
});

