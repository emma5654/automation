import { NextResponse } from 'next/server';
import { saveImage,loadImage,imageSignedUrl } from '../../../lib/image-storage';
import { cloudMode } from '../../../lib/deployment';
import { consumeCloudQuota } from '../../../lib/quota';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { readDB,transaction,log } from '../../../lib/store';
import { id,stamp } from '../../../lib/model';
import { imageProvider } from '../../../lib/providers';
import { imageConfiguration } from '../../../lib/provider-settings';
export const runtime='nodejs';
export const maxDuration=300;
let hourly={start:Date.now(),count:0};const active=new Set<string>();
export async function POST(req:Request){let activeKey='';try{
 guard(req);const data=await req.json();const input=z.object({projectId:z.string().uuid(),imageId:z.string().uuid(),upload:z.string().max(15000000).optional()}).parse(data);
 activeKey=input.imageId;if(active.has(activeKey))return NextResponse.json({error:'Esta imagem já está sendo processada.'},{status:409});active.add(activeKey);
 const db=await readDB();const p=db.projects.find(p=>p.id===input.projectId);const image=p?.images.find(i=>i.id===input.imageId);if(!p||!image)throw new Error('NOT_FOUND');if(image.version!==p.automation.version)throw new Error('CONFLICT');
 let buffer:Buffer,extension='png';
 if(input.upload){if(!image.rightsConfirmed||!image.rightsNote.trim())throw new Error('IMAGE_RIGHTS_REQUIRED');const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(input.upload);if(!match)throw new Error('INVALID_IMAGE');buffer=Buffer.from(match[2],'base64');if(buffer.length>(cloudMode()?2:10)*1024*1024)throw new Error('TOO_LARGE');const hex=buffer.subarray(0,12).toString('hex');if(match[1]==='png'&&!hex.startsWith('89504e470d0a1a0a')||match[1]==='jpeg'&&!hex.startsWith('ffd8ff')||match[1]==='webp'&&!(buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'))throw new Error('INVALID_IMAGE');extension=match[1]==='jpeg'?'jpg':match[1];}
 else{
  if(!image.technicalReviewed)throw new Error('REVIEW_REQUIRED');if(!await imageConfiguration())throw new Error('PROVIDER_NOT_CONFIGURED');await consumeCloudQuota('images');
  if(Date.now()-hourly.start>3600000)hourly={start:Date.now(),count:0};if(!cloudMode()&&hourly.count>=Number(process.env.IMAGE_HOURLY_LIMIT||10))throw new Error('RATE_LIMIT');hourly.count++;
  try{buffer=await imageProvider().generate(image.prompt);}catch(e){await transaction(db=>{const im=db.projects.find(x=>x.id===p.id)?.images.find(x=>x.id===image.id);if(im){im.error='Falha no provedor. Revise modelo, quota e credencial no servidor.';if(!im.file)im.status='erro';}log(db,'Geração de imagem falhou',p.id);});throw e;}
 }
 const generatedModel=(await imageConfiguration())?.model;
 const file=`${id()}.${extension}`;await saveImage(file,buffer);
 const updated=await transaction(db=>{const current=db.projects.find(x=>x.id===p.id);const im=current?.images.find(x=>x.id===image.id);if(!im||current?.automation.version!==image.version)throw new Error('CONFLICT');im.file=file;im.status='ilustrativo';if(!input.upload){im.author=generatedModel||'OpenAI';im.source='API OpenAI';im.rightsNote='Gerada por IA. Verificar termos do provedor, direitos de terceiros e condições de publicação.';im.rightsConfirmed=false;}im.error=undefined;im.updatedAt=stamp();log(db,input.upload?'Imagem enviada manualmente':'Imagem gerada pelo provedor',p.id);});
 return NextResponse.json({db:updated});
 }catch(e){return failure(e);}finally{active.delete(activeKey);}}
export async function GET(req:Request){try{guard(req);const file=new URL(req.url).searchParams.get('file')||'';if(!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(file))throw new Error('NOT_FOUND');const db=await readDB();if(!db.projects.some(p=>p.images.some(i=>i.file===file)))throw new Error('NOT_FOUND');if(cloudMode())return NextResponse.redirect(await imageSignedUrl(file,new URL(req.url).searchParams.get('download')==='1'),{status:302,headers:{'Cache-Control':'private, no-store'}});const buffer=await loadImage(file);return new Response(buffer,{headers:{'Content-Type':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.webp')?'image/webp':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return failure(e);}}
