import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:3010';
test('credential vault keeps multiple secrets hidden and switches the active key',async()=>{
 const ids=[];const keys=['fixture-openai-alpha-12345678','fixture-openai-beta-12345678','fixture-manychat-12345678'];
 async function call(method,body){return fetch(base+'/api/credentials',{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
 async function list(){const r=await call('GET');assert.equal(r.status,200);const text=await r.text();for(const k of keys)assert.equal(text.includes(k),false);return JSON.parse(text);}
 try{
  for(let i=0;i<3;i++){const r=await call('POST',{label:'QA cofre '+i,service:i===2?'manychat':'openai',key:keys[i]});assert.equal(r.status,200);ids.push((await r.json()).id);}
  let rows=(await list()).items;assert.ok(ids.every(id=>rows.some(r=>r.id===id)));
  let r=await call('PATCH',{action:'activate',id:ids[0]});assert.equal(r.status,200);
  r=await call('PATCH',{action:'activate',id:ids[1]});assert.equal(r.status,200);
  rows=(await list()).items;assert.equal(rows.filter(r=>r.active).length,1);assert.equal(rows.find(r=>r.active).id,ids[1]);
  r=await call('PATCH',{action:'activate',id:ids[2]});assert.equal(r.status,404);
  r=await call('PATCH',{action:'replace',id:ids[1],credential:{label:'QA substituída',service:'openai',key:'replacement-fixture-key-12345678',model:'gpt-image-1.5',textModel:'gpt-4.1-mini'}});assert.equal(r.status,200);
  const state=await (await fetch(base+'/api/state')).text();assert.equal(state.includes('replacement-fixture'),false);for(const k of keys)assert.equal(state.includes(k),false);
  r=await call('PATCH',{action:'replace',id:ids[1],credential:{label:'QA',service:'manychat',key:keys[1]}});assert.equal(r.status,400);
  r=await fetch(base+'/api/credentials',{method:'POST',headers:{Origin:'https://foreign.example','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);
  r=await call('DELETE',{id:ids[1]});assert.equal(r.status,200);assert.equal((await list()).items.some(r=>r.id===ids[1]),false);
 }finally{for(const id of ids)await call('DELETE',{id});}
});

