import { pricingTableSchema,defaultPricingTable } from './pricing-table';
import { z } from 'zod';
import { legalSchema,emptyLegal,privacyRequestSchema,legalBases } from './compliance';
import { securityReportSchema,securityRoles } from './security-model';

export const stamp = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
const text = z.string().max(20000);
const short = z.string().max(300);
const meta = { id: z.string().uuid(), createdAt: z.string(), updatedAt: z.string() };
import { nodeTypes } from './flow-types';
export { nodeTypes } from './flow-types';
import { savedPlanSchema } from './planning-model';
export const nodeSchema = z.object({ ...meta, number: z.number().int().positive(), type: z.enum(nodeTypes), title: short.min(1), description: text, platform: short, config: text, inputs: text, outputs: text, dependencies: text, x: z.number().finite(), y: z.number().finite() });
export const edgeSchema = z.object({ ...meta, source: z.string().uuid(), target: z.string().uuid(), label: short });
export const automationSchema = z.object({ ...meta, version: z.number().int().positive(), nodes: z.array(nodeSchema).max(150), connections: z.array(edgeSchema).max(400) }).superRefine((a,c)=>{
  const ids = new Set(a.nodes.map(n=>n.id));
  if(ids.size!==a.nodes.length || new Set(a.nodes.map(n=>n.number)).size!==a.nodes.length) c.addIssue({code:'custom',message:'IDs e números dos nós devem ser únicos.'});
  for(const e of a.connections) if(!ids.has(e.source)||!ids.has(e.target)) c.addIssue({code:'custom',message:'Conexão aponta para nó inexistente.'});
});
export const imageSchema = z.object({ ...meta, stepKey: short, sequence: z.number().int(), title: short, nodeIds: z.array(z.string().uuid()), version: z.number().int(), platform: short, instruction: text, prompt: text, status: z.enum(['pendente','ilustrativo','revisado','testado','desatualizado','erro']), file: z.string().regex(/^[a-f0-9-]+\.(png|jpg|webp)$/).optional(), error: short.optional(), alt:short.default(''),author:short.default(''),source:short.default(''),rightsNote:text.default(''),rightsConfirmed:z.boolean().default(false),technicalReviewed: z.boolean() });
export const stepSchema = z.object({ ...meta, stepKey: short, imageId: z.string().uuid(), nodeIds: z.array(z.string().uuid()), version: z.number().int(), title: short, instruction: text, done: z.boolean() });
export const testSchema = z.object({ ...meta, name: short.min(1), nodeId: z.string(), input: text, conditions: text, expected: text, observed: text, status: z.enum(['Pendente','Em execução','Aprovado','Reprovado','Simulado']), responsible: short, notes: text, runs: z.array(z.object({...meta,status:short,observed:text,responsible:short,version:z.number().int()})) });
export const pricingSchema = z.object({ ...meta, hours: z.number().min(0).max(100000), hourly: z.number().min(0).max(1000000), expenses: z.number().min(0), risk: z.number().min(0).max(100), tax: z.number().min(0).max(99), margin: z.number().min(0).max(99), price: z.number().min(0), monthly: z.number().min(0), licenses: z.number().min(0), supportHours:z.number().min(0).max(1000).default(1),supportScope:text.default(''),scope:text, exclusions:text, deadline:short }).refine(p=>p.margin+p.tax<100,{message:'Margem + taxas deve ser menor que 100%.'});
export const maintenanceSchema = z.object({...meta,projectId:z.string().uuid(),date:short,status:short,dependencies:text,incidents:text,changes:text,nextReview:short,notes:text,version:z.number().int()});
export const diagnosisFields = ['business','process','problem','channel','trigger','collected','destination','tools','volume','human','budget','limitations'] as const;
export const diagnosisSchema = z.object({...meta,answers:z.record(z.string(),text),proposal:text,planning:savedPlanSchema.optional()});
export const securitySchema=z.object({...meta,authorization:text,scope:text,targets:text,notes:text,checklist:z.record(z.string(),z.boolean()),reviews:z.array(z.object({...meta,role:z.enum(securityRoles),version:z.number().int().positive(),model:short,report:securityReportSchema})).max(100)});
export function blankSecurity():z.infer<typeof securitySchema>{return {...metadata(),authorization:'',scope:'',targets:'',notes:'',checklist:{},reviews:[]};}
export const projectSchema = z.object({ ...meta, ownerId:z.literal('local-user'), name:short.min(1),clientId:z.string(),client:short,segment:short,problem:text,objective:text,tools:short,status:z.enum(['Rascunho','Em elaboração','Pronto para teste','Pronto para entrega','Implantado','Arquivado']),demo:z.boolean(), security:securitySchema.default(()=>blankSecurity()), diagnosis:diagnosisSchema,automation:automationSchema,versions:z.array(z.object({...meta,version:z.number().int(),nodes:z.array(nodeSchema),connections:z.array(edgeSchema)})),images:z.array(imageSchema),steps:z.array(stepSchema),tests:z.array(testSchema),pricing:pricingSchema,maintenance:z.array(maintenanceSchema),tutorialIndex:z.number().int().min(0),history:z.array(z.object({...meta,action:short})) }).superRefine((p,c)=>{
 const ids=new Set(p.automation.nodes.map(n=>n.id));
 for(const im of p.images.filter(i=>i.version===p.automation.version)) if(im.nodeIds.some(n=>!ids.has(n)))c.addIssue({code:'custom',message:'Imagem aponta para nó ausente.'});
 for(const s of p.steps) if(s.version!==p.automation.version||s.nodeIds.some(n=>!ids.has(n))||!p.images.some(i=>i.id===s.imageId))c.addIssue({code:'custom',message:'Tutorial inconsistente com arquitetura.'});
 for(const t of p.tests) {if(t.nodeId&&!ids.has(t.nodeId))c.addIssue({code:'custom',message:'Teste aponta para nó ausente.'});if(t.status==='Aprovado'&&(!t.observed.trim()||!t.responsible.trim()))c.addIssue({code:'custom',message:'Aprovação requer resultado observado e responsável.'});}
});
export const clientSchema=z.object({...meta,ownerId:z.literal('local-user'),name:short.min(1),segment:short,contact:short,notes:text,purpose:text.default(''),legalBasis:z.enum(legalBases).default('A definir'),retention:short.default(''),consentReference:text.default('')});
export const clientInputSchema=clientSchema.superRefine((c,ctx)=>{if(c.contact&&(!c.purpose.trim()||c.legalBasis==='A definir'))ctx.addIssue({code:'custom',message:'Informe finalidade e base legal para o contato pessoal.'});if(c.legalBasis==='Consentimento'&&!c.consentReference.trim())ctx.addIssue({code:'custom',message:'Registre a referência da autorização de consentimento.'});});
export const messageSchema=z.object({...meta,ownerId:z.literal('local-user'),name:short.min(1),segment:short,objective:short,text,variables:short,platform:short,notes:text});
export const skillSchema=z.object({...meta,ownerId:z.literal('local-user'),name:short.min(1),description:text,category:short,platform:short,source:short,repository:short,license:short,version:short,dependencies:text,instructions:text,reviewDate:short});
export const dbSchema=z.object({schemaVersion:z.literal(1),pricingTable:pricingTableSchema.default(defaultPricingTable),legal:legalSchema.default(emptyLegal),privacyRequests:z.array(privacyRequestSchema).max(1000).default([]),revision:z.number().int(),user:z.object({...meta,id:z.literal('local-user'),name:short,mode:z.literal('local')}),projects:z.array(projectSchema).max(500),clients:z.array(clientSchema).max(1000),messages:z.array(messageSchema).max(1000),skills:z.array(skillSchema).max(500),activity:z.array(z.object({...meta,action:short})).max(2000)}).superRefine((db,c)=>{for(const p of db.projects)if(p.clientId&&!db.clients.some(v=>v.id===p.clientId))c.addIssue({code:'custom',message:'Cliente associado não encontrado.'});for(const collection of [db.projects,db.clients,db.messages,db.skills])if(new Set(collection.map(v=>v.id)).size!==collection.length)c.addIssue({code:'custom',message:'Identificador duplicado.'});});
export type StudioNode=z.infer<typeof nodeSchema>;
export type Automation=z.infer<typeof automationSchema>;
export type GuidedImage=z.infer<typeof imageSchema>;
export type Project=z.infer<typeof projectSchema>;
export type Database=z.infer<typeof dbSchema>;
export const metadata=()=>({id:id(),createdAt:stamp(),updatedAt:stamp()});

export function pricing(p:z.infer<typeof pricingSchema>){
 if(p.tax+p.margin>=100)throw new Error('Margem + taxas deve ser menor que 100%.');
 const cost=Math.round((p.hours*p.hourly+p.expenses)*(1+p.risk/100)*100)/100;
 return {cost,minimum:cost/(1-p.tax/100),target:cost/(1-(p.tax+p.margin)/100),margin:p.price?100-p.tax-cost/p.price*100:0};
}
export function suggestEffort(p:Project,complexity:'Baixa'|'Média'|'Alta'){
 const integrations=p.automation.nodes.filter(n=>['HTTP','Webhook','Planilha','CRM','Agendamento'].includes(n.type)).length;
 const factor={Baixa:1,Média:1.5,Alta:2.2}[complexity];
 const build=Math.ceil((p.automation.nodes.length*.4+p.automation.connections.length*.15+integrations*1.5)*factor*2)/2;
 const visual=Math.max(1,Math.ceil(p.steps.length*.12*2)/2);
 const tests=Math.max(1,Math.ceil((p.tests.length*.2+p.automation.connections.length*.1)*2)/2);
 const support=1;return {hours:build+visual+tests+support,build,visual,tests,support,integrations};
}
export function makeNode(number:number,type:StudioNode['type']='Ação',title='Nova etapa'):StudioNode{return {...metadata(),number,type,title,description:'',platform:'A validar',config:'',inputs:'',outputs:'',dependencies:'',x:80+(number-1)%3*300,y:80+Math.floor((number-1)/3)*200};}
export function newProject(name:string):Project{return {...metadata(),ownerId:'local-user',name,clientId:'',client:'',segment:'',problem:'',objective:'',tools:'',status:'Rascunho',demo:false,security:blankSecurity(),diagnosis:{...metadata(),answers:{},proposal:''},automation:{...metadata(),version:1,nodes:[],connections:[]},versions:[],images:[],steps:[],tests:[],pricing:{...metadata(),hours:6,hourly:60,expenses:0,risk:15,tax:6,margin:30,price:697,monthly:197,licenses:0,supportHours:1,supportScope:'',scope:'',exclusions:'Licenças, anúncios e atendimento humano contínuo.',deadline:''},maintenance:[],tutorialIndex:0,history:[]};}
export function deriveSequence(p:Project):Project{
 const a=p.automation;
 const specs=[{key:'overview',title:'Visão geral da automação',nodes:a.nodes}, {key:'prepare',title:'Preparar contas e permissões',nodes:[] as StudioNode[]},...a.nodes.flatMap(n=>[{key:`build-${n.id}`,title:`Montar Nó ${String(n.number).padStart(2,'0')} · ${n.title}`,nodes:[n]},{key:`config-${n.id}`,title:`Configurar Nó ${String(n.number).padStart(2,'0')}`,nodes:[n]}]),{key:'validate',title:'Validar caminhos e contingência',nodes:a.nodes}];
 const images=[...p.images];
 const steps:Project['steps']=[];
 specs.forEach((s,i)=>{
  const existing=images.find(x=>x.stepKey===s.key&&x.version===a.version);
  const instructions=s.key==='overview'?`Revise os ${a.nodes.length} nós e ${a.connections.length} conexões. Verifique decisões, saída humana e falhas. A arquitetura é um projeto, não uma integração conectada.`:s.key==='prepare'?`Acesse as contas do cliente para ${p.tools||'as ferramentas escolhidas'}. Confirme permissões e plano pela documentação oficial. Não compartilhe senhas. Anote as referências verificadas antes de configurar.`:s.key==='validate'?'Teste cada caminho, entradas ausentes e inválidas, falhas e atendimento humano. Registre resultado observado no Laboratório. Enviar link não confirma agendamento.':s.nodes.map(n=>`Onde: ${n.platform}. Criar/selecionar: ${n.type} — ação exata a validar na documentação. Objetivo: ${n.description||'preencher manualmente'}. Campos e conteúdo: ${n.config||'preencher configuração verificada'}. Entrada: ${n.inputs||'a definir'}. Saída: ${n.outputs||'a definir'}. Dependências: ${n.dependencies||'a confirmar'}. Conectar: ${a.connections.filter(e=>e.source===n.id).map(e=>`${e.label||'próximo'} → Nó ${a.nodes.find(x=>x.id===e.target)?.number}`).join('; ')||'sem saída definida'}. Salve na plataforma após verificar sua interface. Teste com dados fictícios e compare o resultado com a saída prevista. Se falhar, confira permissões, dados e conexões; encaminhe à pessoa responsável.`).join('\n');
  const img:GuidedImage=existing||{...metadata(),stepKey:s.key,sequence:i+1,title:s.title,nodeIds:s.nodes.map(n=>n.id),version:a.version,platform:s.nodes[0]?.platform||p.tools||'A validar',instruction:instructions,prompt:`Representação ilustrativa instrutiva, não captura real. Projeto ${p.name}; versão ${a.version}; etapa ${i+1}: ${s.title}. Contexto: ${p.problem}. Ferramentas: ${p.tools}. Nós: ${JSON.stringify(s.nodes)}. Conexões: ${JSON.stringify(a.connections)}. Ensinar: ${instructions}. Fundo branco, rosa/lilás, números grandes, setas claras. Não inventar menus oficiais. Não inserir credenciais. Dados técnicos são oferecidos separadamente.`,status:'pendente',alt:`Representação ilustrativa da etapa ${i+1}: ${s.title}`,author:'',source:'',rightsNote:'',rightsConfirmed:false,technicalReviewed:false};
  if(!existing)images.push(img);
  const old=p.steps.find(t=>t.stepKey===s.key&&t.version===a.version);
  steps.push(old||{...metadata(),stepKey:s.key,imageId:img.id,nodeIds:img.nodeIds,version:a.version,title:s.title,instruction:img.instruction,done:false});
 });
 return {...p,images,steps,tutorialIndex:Math.min(p.tutorialIndex,Math.max(0,steps.length-1))};
}
export function changeArchitecture(p:Project,a:Automation):Project{
 const parsed=automationSchema.parse(a);
 if(JSON.stringify({...parsed,version:0,updatedAt:''})===JSON.stringify({...p.automation,version:0,updatedAt:''}))return p;
 const updated={...p,security:{...p.security,checklist:{}},versions:[...p.versions,{...metadata(),version:p.automation.version,nodes:p.automation.nodes,connections:p.automation.connections}],automation:{...parsed,version:p.automation.version+1,updatedAt:stamp()},images:p.images.map(i=>({...i,status:'desatualizado' as const})),steps:[],tests:p.tests.map(t=>({...t,nodeId:parsed.nodes.some(n=>n.id===t.nodeId)?t.nodeId:'',status:'Pendente' as const})),status:'Em elaboração' as const};
 return deriveSequence(updated);
}
export function diagnose(answers:Record<string,string>){return `Proposta por regras explícitas (sem IA)\n\nProblema: ${answers.problem||'não informado'}.\nProcesso atual: ${answers.process||'a esclarecer'}.\nSolução: ${/instagram|direct|coment/i.test(answers.channel||'')?'Avaliar fluxo simples no ManyChat com escolhas e encaminhamento humano.':'Mapear gatilho, resposta e saída humana na ferramenta já utilizada.'}\nFerramentas atuais: ${answers.tools||'não informadas'}. Não adicionar integrações sem necessidade.\nDados: ${answers.collected||'definir mínimo necessário'} → ${answers.destination||'destino a confirmar'}.\nPremissas: acesso autorizado e recursos compatíveis com o plano.\nRiscos: permissões, limites de envio, dados ausentes e indisponibilidade.\nPré-requisitos: verificar documentação e definir responsável humano (${answers.human||'pendente'}).\nPendências: confirmar links, credenciais por referência, retenção, orçamento (${answers.budget||'não informado'}) e critérios de aceite.\nResultado: reduzir tarefas repetitivas; sem garantia de vendas ou agendamento.`;}
export function initialDB():Database{
 let p=newProject('Agenda no Direct');p.demo=true;p.segment='Beleza';p.client='Estúdio Aurora · fictício';p.problem='Perguntas repetidas e contatos sem orientação no Instagram.';p.objective='Orientar a escolha do serviço e enviar o link de agenda.';p.tools='ManyChat · Instagram (não conectados)';p.status='Em elaboração';
 p.automation.nodes=[makeNode(1,'Gatilho','Comentário AGENDA'),makeNode(2,'Mensagem','Convite no Direct'),makeNode(3,'Condição','Escolher serviço'),makeNode(4,'Agendamento','Enviar link'),makeNode(5,'Humano','Falar com a equipe'),makeNode(6,'Erro','Contingência')].map(n=>({...n,platform:'ManyChat · a validar',description:n.number===4?'Enviar o link. A reserva depende da agenda.':'Etapa ilustrativa; validar recursos e permissões na conta.',config:n.number===2?'Oi! Quer conhecer nossos serviços?':n.number===4?'[LINK VERIFICADO DO CLIENTE]':'Configuração manual pendente de verificação.',inputs:n.number===1?'Comentário elegível':'Interação elegível do usuário',outputs:'Próxima etapa conforme condição',dependencies:'Conta autorizada e plano compatível'}));
 const connect=(source:number,target:number,label:string)=>({...metadata(),source:p.automation.nodes[source-1].id,target:p.automation.nodes[target-1].id,label});
 p.automation.connections=[connect(1,2,'Palavra elegível'),connect(2,3,'Interagiu'),connect(3,4,'Serviço válido'),connect(3,5,'Humano / inválido'),connect(4,6,'Falha detectada'),connect(6,5,'Contingência manual')];
 p.diagnosis.answers={business:'Estúdio de beleza fictício',process:'Atendimento manual',problem:p.problem,channel:'Instagram Direct e comentários',tools:'ManyChat',human:'Equipe do estúdio',budget:'A definir'};p.diagnosis.proposal=diagnose(p.diagnosis.answers);p=deriveSequence(p);
 p.tests=['Palavra-chave elegível','Escolha de serviço','Encaminhamento humano','Entrada inválida','Link indisponível','Evento duplicado'].map(name=>({...metadata(),name,nodeId:'',input:'Preencher antes do teste',conditions:'Conta e permissões verificadas',expected:'Caminho correto sem afirmar reserva confirmada',observed:'',status:'Pendente',responsible:'',notes:'Demonstração: teste ainda não executado.',runs:[]}));
 p.pricing.scope='Um fluxo principal, uma palavra-chave, até quatro serviços, um link, saída humana, documentação e sete dias de suporte no escopo.';
 return {schemaVersion:1,pricingTable:defaultPricingTable(),legal:emptyLegal(),privacyRequests:[],revision:0,user:{...metadata(),id:'local-user',name:'Meu estúdio',mode:'local'},projects:[p],clients:[],messages:[{...metadata(),ownerId:'local-user',name:'Boas-vindas · Beleza',segment:'Beleza',objective:'Apresentar serviços',text:'Oi, {{nome}}! Qual serviço você procura? Posso mostrar as opções ou chamar a equipe.',variables:'nome',platform:'Instagram',notes:'Modelo ilustrativo; validar janela e permissões.'}],skills:[],activity:[]};
}
