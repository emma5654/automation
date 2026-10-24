import { cloudMode } from '../../../../lib/deployment';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { loadImage,exportSignedUrl } from '../../../../lib/image-storage';
import { guard,failure } from '../../../../lib/http';
import { readDB } from '../../../../lib/store';
import { projectDocumentation } from '../../../../lib/export';
export const runtime='nodejs';
export const maxDuration=300;
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{guard(req);const {id}=await params;const p=(await readDB()).projects.find(p=>p.id===id);if(!p)throw new Error('NOT_FOUND');const zip=new JSZip();zip.file('documentacao.md',projectDocumentation(p));zip.file('projeto.json',JSON.stringify(p,null,2));zip.file('arquitetura/atual.json',JSON.stringify(p.automation,null,2));zip.file('arquitetura/versoes.json',JSON.stringify(p.versions,null,2));zip.file('instrucoes/tutorial.json',JSON.stringify(p.steps,null,2));zip.file('seguranca/revisoes.json',JSON.stringify(p.security,null,2));zip.file('testes/relatorio.json',JSON.stringify(p.tests,null,2));zip.file('proposta/estimativa.json',JSON.stringify(p.pricing,null,2));zip.file('imagens/indice.json',JSON.stringify(p.images,null,2));let bytes=0;for(const im of p.images.filter(i=>i.file)){const buffer=await loadImage(im.file!);bytes+=buffer.length;if(bytes>45*1024*1024)throw new Error('EXPORT_TOO_LARGE');zip.file(`imagens/v${im.version}-${im.sequence}-${im.file}`,buffer);}const binary=await zip.generateAsync({type:'nodebuffer'});if(cloudMode())return NextResponse.redirect(await exportSignedUrl(p.id,binary),{status:302,headers:{'Cache-Control':'private, no-store'}});return new Response(new Uint8Array(binary).buffer,{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="projeto-${p.id}.zip"`}});}catch(e){return failure(e);}}

