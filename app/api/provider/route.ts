import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard,failure } from '../../../lib/http';
import { publicImageConfiguration,configureImageSession,clearImageSession } from '../../../lib/provider-settings';
export async function POST(req:Request){try{guard(req);const config=z.object({key:z.string().trim().min(20,'Informe uma API key válida.').max(500),model:z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/,'Modelo inválido.'),textModel:z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/,'Modelo de texto inválido.').default('gpt-4.1-mini')}).parse(await req.json());await configureImageSession(config);return NextResponse.json(await publicImageConfiguration());}catch(e){return failure(e);}}
export async function DELETE(req:Request){try{guard(req);await clearImageSession();return NextResponse.json(await publicImageConfiguration());}catch(e){return failure(e);}}
