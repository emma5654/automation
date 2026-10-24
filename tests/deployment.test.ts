import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret,decryptSecret } from '../lib/secret-crypto';
import { guard } from '../lib/http';
import { deploymentConfig } from '../lib/deployment';
test('production refuses a local file backend unless explicitly enabled for local QA',()=>{
 const environment=process.env as Record<string,string|undefined>;const previous=environment.NODE_ENV;
 environment.NODE_ENV='production';
 try{
  assert.throws(()=>deploymentConfig(),/DEPLOYMENT_CONFIG/);
  environment.STUDIO_ALLOW_LOCAL_PRODUCTION='true';assert.doesNotThrow(()=>deploymentConfig());
  assert.throws(()=>guard(new Request('https://public.example/api/state')),/LOCAL_ONLY/);
 }finally{environment.NODE_ENV=previous;delete environment.STUDIO_ALLOW_LOCAL_PRODUCTION;}
});
test('encrypted provider settings cannot be read with another owner, altered payload or wrong master',()=>{
 process.env.STUDIO_ENCRYPTION_KEY='01'.repeat(32);
 try{
  const value=encryptSecret('sk-fixture-0000000000000000','user-A');
  assert.equal(value.includes('sk-fixture'),false);
  assert.equal(decryptSecret(value,'user-A'),'sk-fixture-0000000000000000');
  assert.throws(()=>decryptSecret(value,'user-B'));
  const fields=value.split('.');fields[3]=Buffer.from('tampered').toString('base64');assert.throws(()=>decryptSecret(fields.join('.'),'user-A'));
  process.env.STUDIO_ENCRYPTION_KEY='02'.repeat(32);assert.throws(()=>decryptSecret(value,'user-A'));
 }finally{delete process.env.STUDIO_ENCRYPTION_KEY;}
});
test('cloud mutations require explicit matching Origin and complete deployment config',()=>{
 process.env.STUDIO_STORAGE='supabase';process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='fixture';process.env.STUDIO_APP_URL='https://studio.example';
 try{
  assert.doesNotThrow(()=>guard(new Request('https://studio.example/api/mutate',{method:'POST',headers:{Origin:'https://studio.example'}})));
  assert.throws(()=>guard(new Request('https://studio.example/api/mutate',{method:'POST'})),/ORIGIN/);
  assert.throws(()=>guard(new Request('https://studio.example/api/mutate',{method:'POST',headers:{Origin:'https://evil.example'}})),/ORIGIN/);
  delete process.env.SUPABASE_PUBLISHABLE_KEY;assert.throws(()=>deploymentConfig(),/DEPLOYMENT_CONFIG/);
 }finally{for(const key of ['STUDIO_STORAGE','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','STUDIO_APP_URL'])delete process.env[key];}
});
