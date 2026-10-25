import { z } from 'zod';
const model=z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/);
export const credentialInput=z.object({
 label:z.string().trim().min(1,'Informe um nome para a chave.').max(120),
 service:z.string().trim().toLowerCase().min(1).max(80).regex(/^[a-z0-9_-]+$/,'Use letras sem acento, números ou hífen no serviço.'),
 key:z.string().trim().min(8,'Informe a chave de API.').max(8000),
 model:model.default('gpt-image-1.5'),
 textModel:model.default('gpt-4.1-mini')
});
export type CredentialInput=z.infer<typeof credentialInput>;
export type CredentialSummary={id:string;label:string;service:string;active:boolean;createdAt:string;model:string;textModel:string};
export type CredentialPage={items:CredentialSummary[];hasMore:boolean;page:number;mode:'supabase'|'local'};

