import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { cloudMode,deploymentConfig } from './deployment';
export function guard(req:Request){
 const deployment=deploymentConfig();
 if(cloudMode()){
  if(!deployment)throw new Error('DEPLOYMENT_CONFIG');
  const origin=req.headers.get('origin');
  if(origin&&origin!==deployment.origin)throw new Error('ORIGIN');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&origin!==deployment.origin)throw new Error('ORIGIN');
  if(Number(req.headers.get('content-length')||0)>30*1024*1024)throw new Error('TOO_LARGE');
  return;
 }
 const url=new URL(req.url);const allowed=['localhost','127.0.0.1','[::1]'];if(!allowed.includes(url.hostname))throw new Error('LOCAL_ONLY');
 // Next may canonicalize req.url to localhost even when the browser uses 127.0.0.1.
 // Match Origin to the actual, locally allowlisted Host header.
 const target=new URL(`${url.protocol}//${req.headers.get('host')||url.host}`);
 if(!allowed.includes(target.hostname))throw new Error('LOCAL_ONLY');
 const origin=req.headers.get('origin');if(origin&&origin!==target.origin)throw new Error('ORIGIN');
 if(Number(req.headers.get('content-length')||0)>30*1024*1024)throw new Error('TOO_LARGE');
}
export function failure(e:unknown){
 if(e instanceof ZodError)return NextResponse.json({error:e.issues.map(i=>i.message).slice(0,5).join(' ')},{status:400});
 const message=e instanceof Error?e.message:'';
 const known:Record<string,[number,string]>={CONFLICT:[409,'Outra alteração foi salva. Recarregue os dados e tente novamente.'],NOT_FOUND:[404,'Registro não encontrado.'],LOCAL_ONLY:[403,'Este modo é apenas local.'],ORIGIN:[403,'Origem não autorizada.'],TOO_LARGE:[413,'Arquivo ou conteúdo muito grande.'],PROVIDER_NOT_CONFIGURED:[503,'Geração pendente: configure OPENAI_API_KEY e OPENAI_IMAGE_MODEL no servidor.'],RATE_LIMIT:[429,'Limite local de gerações por hora atingido.'],REVIEW_REQUIRED:[400,'Revise os dados técnicos antes de gerar.'],INVALID_IMAGE:[400,'Envie PNG, JPEG ou WebP válido de até 10 MB.']};
 Object.assign(known,{IMAGE_RIGHTS_REQUIRED:[400,'Registre a licença/condições e confirme a autorização antes de enviar a imagem.'],TEXT_PROVIDER_NOT_CONFIGURED:[503,'Configure a API key e um modelo de texto em Configurações para usar os agentes.'],ARCHITECTURE_REQUIRED:[400,'Adicione e salve os nós da arquitetura antes da revisão.'],SCOPE_REQUIRED:[400,'Registre e salve o escopo e a autorização para a revisão de pentest.']});
 Object.assign(known,{WORKSPACE_TOO_LARGE:[413,'O workspace atingiu o limite desta versão. Exporte e arquive os dados com o administrador.'],EXPORT_TOO_LARGE:[413,'Este pacote excede o limite de 50 MB. Exporte os materiais em partes.'],UNAUTHORIZED:[401,'Entre novamente para acessar seu estúdio.'],FORBIDDEN:[403,'Esta conta não está autorizada neste estúdio.'],DEPLOYMENT_CONFIG:[503,'Configuração de deploy incompleta. Verifique as variáveis do servidor.'],ENCRYPTION_CONFIG:[503,'A proteção das chaves de IA precisa ser configurada no servidor.'],CLOUD_STORAGE:[503,'Não foi possível acessar o armazenamento. Tente novamente.']});
 Object.assign(known,{MONITOR_CLOUD_REQUIRED:[400,'Conecte o aplicativo ao Supabase para receber eventos de saúde.'],PROVIDER_SERVICE_DISABLED:[400,'Ative a Generative Language API no projeto Google da chave selecionada.'],PROVIDER_BILLING:[429,'O provedor informou falta de créditos ou limite de gastos. Confira o faturamento da conta.'],CREDENTIAL_ACTIVE:[400,'A chave ativa deve continuar identificada como openai ou gemini. Selecione outra chave antes de mudar o serviço.'],BRIEF_REQUIRED:[400,'Descreva o serviço do cliente e o funcionamento desejado antes de gerar.'],PROVIDER_AUTH:[400,'O provedor recusou a chave selecionada. Confira a chave e as permissões em Configurações.'],PROVIDER_QUOTA:[429,'O provedor informou limite ou saldo insuficiente. Confira sua conta.'],PROVIDER_UNAVAILABLE:[502,'O provedor está indisponível ou o modelo não aceita esta operação.'],PROVIDER_INVALID_RESPONSE:[502,'A IA não entregou um plano completo e válido. Tente novamente com um pedido menor.']});
 const [status,error]=known[message]||[500,'Não foi possível concluir. Seus dados anteriores foram preservados.'];return NextResponse.json({error},{status,headers:{'Cache-Control':'private, no-store'}});
}
