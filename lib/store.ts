import 'server-only';
import { mkdir,readFile,writeFile,rename } from 'node:fs/promises';
import path from 'node:path';
import { cloudMode,deploymentConfig } from './deployment';
import { readCloudDB,cloudTransaction } from './cloud-store';
import { Database,dbSchema,initialDB,metadata,stamp } from './model';

export const dataDir=()=>path.resolve(process.env.STUDIO_DATA_DIR||'./data');
let queue:Promise<unknown>=Promise.resolve();
async function load():Promise<Database>{
 await mkdir(dataDir(),{recursive:true});
 try{return dbSchema.parse(JSON.parse(await readFile(path.join(dataDir(),'studio.json'),'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;const db=initialDB();await save(db);return db;}
}
async function save(db:Database){const target=path.join(dataDir(),'studio.json');await writeFile(target+'.tmp',JSON.stringify(db,null,2),'utf8');await rename(target+'.tmp',target);}
export function transaction(fn:(db:Database)=>void|Promise<void>,revision?:number):Promise<Database>{
 deploymentConfig();if(cloudMode())return cloudTransaction(fn,revision);
 const job=queue.then(async()=>{const db=await load();if(revision!==undefined&&revision!==db.revision)throw new Error('CONFLICT');await fn(db);db.revision++;dbSchema.parse(db);await save(db);return db;});queue=job.catch(()=>{});return job;
}
export function readDB():Promise<Database>{deploymentConfig();if(cloudMode())return readCloudDB();const job=queue.then(load);queue=job.catch(()=>{});return job;}
export function log(db:Database,action:string,projectId?:string){db.activity.unshift({...metadata(),action});db.activity=db.activity.slice(0,1000);const p=db.projects.find(p=>p.id===projectId);if(p){p.updatedAt=stamp();p.history.unshift({...metadata(),action});p.history=p.history.slice(0,500);}}
