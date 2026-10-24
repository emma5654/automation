import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:3000';
const meta=()=>({id:crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
async function state(){const r=await fetch(base+'/api/state');assert.equal(r.status,200);return (await r.json()).db;}
async function mutate(command,revision){const db=await state();const response=await fetch(base+'/api/mutate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:revision??db.revision,command})});return {response,body:await response.json()};}

test('HTTP: CRUD, persistence, architecture, sequence, upload, export and optimistic conflict',async()=>{
 let projectId;const libraryRecords=[];
 try{
  const fakeKey='sk-qa-not-a-real-key-00000000000000';
  const provider=await fetch(base+'/api/provider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:fakeKey,model:'gpt-image-1.5',textModel:'gpt-4.1-mini'})});assert.equal(provider.status,200);assert.equal(JSON.stringify(await provider.json()).includes(fakeKey),false);assert.equal(JSON.stringify(await state()).includes(fakeKey),false);await fetch(base+'/api/provider',{method:'DELETE'});
  let r=await mutate({type:'create',name:'QA · fixture descartável'});assert.equal(r.response.status,200);let p=r.body.db.projects.at(-1);projectId=p.id;
  p.problem='Triagem de contatos';p.diagnosis.answers={channel:'Instagram',budget:'500'};p.diagnosis.proposal='Recomendação manual salva';r=await mutate({type:'saveProject',project:p});assert.equal(r.response.status,200);p=r.body.db.projects.find(x=>x.id===projectId);
  const oldRevision=r.body.db.revision;const a={...p.automation,nodes:[{...meta(),number:1,type:'Gatilho',title:'Entrada',platform:'Manual',description:'Receber contato',config:'Sem segredo',inputs:'Evento',outputs:'Contato',dependencies:'Permissão',x:10,y:20},{...meta(),number:2,type:'Humano',title:'Equipe',platform:'Manual',description:'Atender',config:'',inputs:'Contato',outputs:'Atendimento',dependencies:'Equipe',x:300,y:20}],connections:[]};a.connections=[{...meta(),source:a.nodes[0].id,target:a.nodes[1].id,label:'Precisar de ajuda'}];
  r=await mutate({type:'architecture',projectId,automation:a});assert.equal(r.response.status,200);p=r.body.db.projects.find(x=>x.id===projectId);assert.equal(p.automation.version,2);assert.equal(p.steps.length,7);assert.equal(p.versions.length,1);
  const conflict=await mutate({type:'saveProject',project:p},oldRevision);assert.equal(conflict.response.status,409);
  const reloaded=(await state()).projects.find(x=>x.id===projectId);assert.equal(reloaded.diagnosis.proposal,'Recomendação manual salva');assert.equal(reloaded.automation.connections.length,1);assert.equal(reloaded.automation.nodes[0].id,a.nodes[0].id);
  p=reloaded;p.steps[0].done=true;p.tutorialIndex=2;Object.assign(p.images.find(i=>i.id===p.steps[0].imageId),{technicalReviewed:true,rightsConfirmed:true,rightsNote:'Fixture de teste de 1 pixel; uso exclusivo do QA.'});
  r=await mutate({type:'saveProject',project:p});assert.equal(r.response.status,200);p=r.body.db.projects.find(x=>x.id===projectId);
  const current=p.images.find(i=>i.version===p.automation.version);
  const missingText=await fetch(base+'/api/security',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,role:'cybersecurity'})});assert.equal(missingText.status,503);
  if(!(await (await fetch(base+'/api/state')).json()).provider.configured){const noProvider=await fetch(base+'/api/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,imageId:current.id})});assert.equal(noProvider.status,503);}
  const upload=await fetch(base+'/api/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,imageId:current.id,upload:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII='})});assert.equal(upload.status,200);p=(await upload.json()).db.projects.find(x=>x.id===projectId);const image=p.images.find(i=>i.id===current.id);assert.ok(image.file);assert.equal((await fetch(base+'/api/images?file='+image.file)).status,200);
  const invalidUpload=await fetch(base+'/api/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({projectId,imageId:current.id,upload:'data:image/png;base64,aGVsbG8='})});assert.equal(invalidUpload.status,400);
  const exported=await fetch(base+'/api/export/'+projectId);assert.equal(exported.status,200);const zip=await JSZip.loadAsync(await exported.arrayBuffer());assert.ok(zip.file('documentacao.md'));assert.ok(Object.keys(zip.files).some(f=>f.endsWith(image.file)));assert.equal(JSON.parse(await zip.file('projeto.json').async('text')).tutorialIndex,2);
  for(const collection of ['clients','messages','skills']){
   const record={...meta(),ownerId:'local-user',name:'QA registro',...(collection==='clients'?{segment:'QA',contact:'',notes:''}:collection==='messages'?{segment:'QA',objective:'Teste',text:'Olá',variables:'',platform:'Manual',notes:''}:{description:'Teste',category:'QA',platform:'Manual',source:'Local',repository:'',license:'',version:'1',dependencies:'',instructions:'# Teste',reviewDate:'2026-10-22'})};
   r=await mutate({type:'library',collection,record});assert.equal(r.response.status,200);assert.ok(r.body.db[collection].some(x=>x.id===record.id));libraryRecords.push({collection,id:record.id});
  }
  r=await mutate({type:'duplicate',projectId});assert.equal(r.response.status,200);const copy=r.body.db.projects.at(-1);assert.notEqual(copy.automation.nodes[0].id,a.nodes[0].id);assert.equal(copy.images.some(i=>i.file),false);await mutate({type:'deleteProject',projectId:copy.id});
  const csrf=await fetch(base+'/api/mutate',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
 }finally{await fetch(base+'/api/provider',{method:'DELETE'});for(const item of libraryRecords)await mutate({type:'deleteLibrary',...item});if(projectId)await mutate({type:'deleteProject',projectId});}
});
