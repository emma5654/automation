import 'server-only';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cloudMode } from './deployment';
import { cloudSession } from './supabase';
const bucket='studio-images';
const localDir=()=>path.resolve(process.env.STUDIO_DATA_DIR||'./data','images');
function validate(file:string){if(!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(file))throw new Error('NOT_FOUND');}
export async function saveImage(file:string,data:Buffer){
 validate(file);if(!cloudMode()){await mkdir(localDir(),{recursive:true});await writeFile(path.join(localDir(),file),data);return;}
 const {client,user}=await cloudSession();const {error}=await client.storage.from(bucket).upload(`${user.id}/${file}`,data,{contentType:file.endsWith('.jpg')?'image/jpeg':file.endsWith('.webp')?'image/webp':'image/png',upsert:false});if(error)throw new Error('CLOUD_STORAGE');
}
export async function loadImage(file:string){
 validate(file);if(!cloudMode())return readFile(path.join(localDir(),file));
 const {client,user}=await cloudSession();const {data,error}=await client.storage.from(bucket).download(`${user.id}/${file}`);if(error||!data)throw new Error('NOT_FOUND');return Buffer.from(await data.arrayBuffer());
}
export async function imageSignedUrl(file:string,download=false){
 validate(file);const {client,user}=await cloudSession();const {data,error}=await client.storage.from(bucket).createSignedUrl(`${user.id}/${file}`,60,download?{download:file}:undefined);if(error||!data)throw new Error('NOT_FOUND');return data.signedUrl;
}
export async function exportSignedUrl(projectId:string,data:Buffer){
 const {client,user}=await cloudSession();const file=`${user.id}/${projectId}.zip`;
 const result=await client.storage.from('studio-exports').upload(file,data,{contentType:'application/zip',upsert:true});if(result.error)throw new Error('CLOUD_STORAGE');
 const signed=await client.storage.from('studio-exports').createSignedUrl(file,60,{download:`projeto-${projectId}.zip`});if(signed.error||!signed.data)throw new Error('CLOUD_STORAGE');return signed.data.signedUrl;
}
