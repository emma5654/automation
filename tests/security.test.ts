import test from 'node:test';
import assert from 'node:assert/strict';
import { guard } from '../lib/http';

test('same-origin browser requests survive Next hostname canonicalization',()=>{
 assert.doesNotThrow(()=>guard(new Request('http://localhost:3001/api/mutate',{headers:{Host:'127.0.0.1:3001',Origin:'http://127.0.0.1:3001'}})));
});
test('foreign origins and non-local Host headers are rejected',()=>{
 assert.throws(()=>guard(new Request('http://localhost:3001/api/mutate',{headers:{Host:'127.0.0.1:3001',Origin:'https://foreign.example'}})),/ORIGIN/);
 assert.throws(()=>guard(new Request('http://localhost:3001/api/mutate',{headers:{Host:'foreign.example',Origin:'http://foreign.example'}})),/LOCAL_ONLY/);
});
