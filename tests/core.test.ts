import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDB,dbSchema,newProject,makeNode,deriveSequence,changeArchitecture,pricing,projectSchema,diagnose } from '../lib/model';
import { projectDocumentation } from '../lib/export';

test('demo is valid, all guided steps reference current canonical node IDs',()=>{
 const db=initialDB();assert.equal(dbSchema.safeParse(db).success,true);const p=db.projects[0];assert.equal(p.demo,true);assert.equal(p.images.length,15);assert.ok(p.images.every(i=>i.status==='pendente'&&!i.file));assert.ok(p.tests.every(t=>t.status==='Pendente'&&!t.observed));assert.ok(p.steps.every(s=>p.images.some(i=>i.id===s.imageId&&i.version===s.version)));assert.equal(new Set(p.automation.nodes.map(n=>n.number)).size,6);
});
test('architecture changes preserve previous snapshots and invalidate images and test results',()=>{
 const p=initialDB().projects[0];p.images[0].status='revisado';const removed=p.automation.nodes[0];p.tests[0].nodeId=removed.id;p.tests[0].status='Aprovado';p.tests[0].responsible='Ana';p.tests[0].observed='Testado manualmente';
 const a={...p.automation,nodes:p.automation.nodes.slice(1),connections:p.automation.connections.filter(e=>e.source!==removed.id&&e.target!==removed.id)};const next=changeArchitecture(p,a);
 assert.equal(next.automation.version,2);assert.equal(next.versions[0].nodes.length,6);assert.ok(next.images.filter(i=>i.version===1).every(i=>i.status==='desatualizado'));assert.ok(next.steps.every(s=>s.version===2&&!s.done));assert.equal(next.tests[0].status,'Pendente');assert.equal(next.tests[0].nodeId,'');assert.ok(projectSchema.safeParse(next).success);
});
test('duplicate node numbers and dangling connections are rejected',()=>{
 const p=initialDB().projects[0];p.automation.nodes[1].number=1;assert.equal(projectSchema.safeParse(p).success,false);p.automation.nodes[1].number=2;p.automation.connections[0].target=crypto.randomUUID();assert.equal(projectSchema.safeParse(p).success,false);
});
test('pricing distinguishes break-even, target margin and actual margin',()=>{
 const p=newProject('Orçamento');const result=pricing(p.pricing);assert.equal(result.cost,414);assert.ok(Math.abs(result.target-646.875)<.001);assert.ok(Math.abs(result.margin-34.60258)<.001);assert.throws(()=>pricing({...p.pricing,tax:60,margin:40}));
});
test('approval without observed evidence and responsible person is invalid',()=>{
 const p=initialDB().projects[0];p.tests[0].status='Aprovado';assert.equal(projectSchema.safeParse(p).success,false);p.tests[0].observed='Interação observada na conta de teste';p.tests[0].responsible='Responsável';assert.equal(projectSchema.safeParse(p).success,true);
});
test('sequence generation is idempotent and preserves completed work',()=>{
 let p=deriveSequence(newProject('Novo'));p.automation.nodes.push(makeNode(1));p=deriveSequence(p);p.steps[0].done=true;const n=deriveSequence(p);assert.equal(n.images.length,p.images.length);assert.equal(n.steps[0].id,p.steps[0].id);assert.equal(n.steps[0].done,true);
});
test('export reflects saved fields without claiming external execution',()=>{
 const p=initialDB().projects[0];p.name='Projeto personalizado';p.pricing.price=900;const doc=projectDocumentation(p);assert.ok(doc.includes('Projeto personalizado'));assert.ok(doc.includes('900.00'));assert.ok(doc.includes('geração pendente'));assert.ok(doc.includes('não confirma reserva'));
});
test('local diagnosis explicitly states manual prerequisites and channel rule',()=>{
 const proposal=diagnose({channel:'Instagram',problem:'Demora',budget:'500'});assert.ok(proposal.includes('ManyChat'));assert.ok(proposal.includes('sem IA'));assert.ok(proposal.includes('500'));assert.ok(proposal.includes('Pendências'));
});
