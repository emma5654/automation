import { readFile,readdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
const root=process.cwd();
const zip=new JSZip();
const ignored=new Set(['node_modules','.studio-build','.next','data','.git']);
async function walk(dir,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(ignored.has(entry.name)||entry.name.startsWith('.env')&&entry.name!=='.env.example'||entry.name.endsWith('.tsbuildinfo'))continue;
  const key=prefix+entry.name;const absolute=path.join(dir,entry.name);
  if(entry.isDirectory())await walk(absolute,key+'/');else zip.file('automation-studio-web/'+key,await readFile(absolute));
 }
}
await walk(root);const output=path.resolve(root,'../automation-studio-web.zip');await writeFile(output,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));console.log(output);
