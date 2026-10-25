import test from 'node:test';
import assert from 'node:assert/strict';
import { clientSignals,healthSignal } from '../lib/client-signals';
import { initialDB,metadata } from '../lib/model';
import { defaultPricingTable,pricingTableSchema,suggestedPrice } from '../lib/pricing-table';
test('editable price table calculates implementation and independent monthly references',()=>{
 const table=defaultPricingTable();assert.equal(suggestedPrice(table,6),647);assert.equal(pricingTableSchema.safeParse({...table,tax:60,margin:40}).success,false);
 const copy={...table,hourly:90};assert.ok(suggestedPrice(copy,6)!>suggestedPrice(table,6)!);assert.equal(table.hourly,60);
 assert.equal(suggestedPrice({...table,expenses:0},table.services[0].supportHours),108);
});
test('client project signal identifies pending and failed tests without fabricating uptime',()=>{
 const db=initialDB();const c={...metadata(),ownerId:'local-user' as const,name:'QA',segment:'',contact:'',notes:'',purpose:'',legalBasis:'A definir' as const,retention:'',consentReference:''};db.clients.push(c);db.projects[0].clientId=c.id;
 assert.equal(clientSignals(db)[0].project.tone,'yellow');assert.equal(clientSignals(db)[0].health.tone,'gray');
 db.projects[0].tests[0].status='Reprovado';assert.equal(clientSignals(db)[0].project.tone,'red');
});
test('health signal requires an event and expires success when heartbeat stops',()=>{
 const now=new Date('2026-10-25T12:00:00Z');const monitor={client_id:'fixture',expected_minutes:10,status:'ok' as const,last_event_at:'2026-10-25T11:55:00Z'};
 assert.equal(healthSignal(undefined,now).tone,'gray');assert.equal(healthSignal({...monitor,last_event_at:null},now).tone,'gray');
 assert.equal(healthSignal(monitor,now).tone,'green');assert.equal(healthSignal({...monitor,status:'error'},now).tone,'red');
 assert.equal(healthSignal({...monitor,last_event_at:'2026-10-25T11:45:00Z'},now).tone,'yellow');
 assert.equal(healthSignal({...monitor,last_event_at:'2026-10-25T11:35:00Z'},now).tone,'red');
});

