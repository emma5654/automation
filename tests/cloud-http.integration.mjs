import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.STUDIO_TEST_URL||'http://127.0.0.1:3002';
const origin=process.env.STUDIO_TEST_ORIGIN||'https://studio.example';
test('cloud rejects unauthenticated data access, requires Origin and leaves public policies reachable',async()=>{
 const id='a9dbe28e-719b-4fdb-9cf0-cc55e9000001';
 for(const path of ['/api/state','/api/auth',`/api/export/${id}`,`/api/images?file=${id}.png`]){
  const response=await fetch(base+path);assert.equal(response.status,401,path);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(JSON.stringify(await response.json()).includes('document'),false);
 }
 for(const [path,body] of [
  ['/api/provider',{key:'sk-fixture-not-real-0000000000000000',model:'gpt-image-1.5'}],
  ['/api/mutate',{revision:0,command:{type:'create',name:'unauthenticated fixture'}}],
  ['/api/images',{projectId:id,imageId:id}],
  ['/api/security',{projectId:id,role:'cybersecurity'}],
 ]){
  const response=await fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,401,path);
 }
 for(const headers of [{},{Origin:'https://foreign.example'}]){
  const response=await fetch(base+'/api/provider',{method:'DELETE',headers});assert.equal(response.status,403);
 }
 for(const kind of ['privacy','terms','cookies','refund','accessibility','rights']){
  const response=await fetch(base+'/public/legal/'+kind);assert.equal(response.status,200,kind);const html=await response.text();assert.match(html,/Rascunho/);assert.equal(html.includes('fixture-not-real'),false);
 }
 const health=await fetch(base+'/api/health');assert.equal(health.status,200);assert.equal((await health.json()).storage,'supabase');
});
