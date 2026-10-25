import type { Database,Project } from './model';
type Tone='green'|'yellow'|'red'|'gray';
export type Signal={tone:Tone;label:string;detail:string};
export type ClientSignal={clientId:string;project:Signal;health:Signal};
function projectSignal(p:Project,today:string):Signal{
 if(p.tests.some(t=>t.status==='Reprovado'))return {tone:'red',label:'Atenção necessária',detail:'Há teste reprovado registrado.'};
 if(['cybersecurity','pentest'].some(role=>p.security.reviews.find(r=>r.role===role&&r.version===p.automation.version)?.report.findings.some(f=>f.severity==='Crítica'||f.severity==='Alta')))return {tone:'red',label:'Risco em revisão',detail:'A revisão desta versão aponta risco alto ou crítico; exige análise humana.'};
 const latestMaintenance=[...p.maintenance].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt))[0];
 if(latestMaintenance?.nextReview&&latestMaintenance.nextReview<today)return {tone:'yellow',label:'Revisão pendente',detail:'Há revisão de manutenção vencida.'};
 if(['Pronto para entrega','Implantado'].includes(p.status)&&p.automation.nodes.length>0&&p.tests.length>0&&p.tests.every(t=>t.status==='Aprovado'))return {tone:'green',label:'Projeto validado',detail:'Estado declarado e testes registrados estão completos. Isso não comprova disponibilidade externa.'};
 return {tone:'yellow',label:'Em preparação',detail:'Há etapas ou validações pendentes no projeto.'};
}
export function clientSignals(db:Database,now=new Date()):ClientSignal[]{
 const today=now.toISOString().slice(0,10);const rank={gray:0,green:1,yellow:2,red:3};
 return db.clients.map(c=>{const projects=db.projects.filter(p=>p.clientId===c.id&&p.status!=='Arquivado');const signals=projects.map(p=>projectSignal(p,today));const worst=signals.sort((a,b)=>rank[b.tone]-rank[a.tone])[0];
 return {clientId:c.id,project:worst||{tone:'gray',label:'Sem projeto',detail:'Associe um projeto a este cliente para acompanhar as pendências.'},health:{tone:'gray',label:'Sem monitoramento',detail:'Nenhuma fonte de eventos de execução está conectada. Não há confirmação da saúde da automação.'}};
 });
}


export type MonitorSnapshot={client_id:string;expected_minutes:number;status:'ok'|'degraded'|'error'|null;last_event_at:string|null};
export function healthSignal(m:MonitorSnapshot|undefined,now=new Date()):Signal{if(!m)return {tone:'gray',label:'Sem monitoramento',detail:'Conecte a fonte de eventos deste cliente.'};if(!m.last_event_at||!m.status)return {tone:'gray',label:'Aguardando primeiro sinal',detail:'A conexão foi criada, mas nenhum evento válido chegou.'};const age=now.getTime()-Date.parse(m.last_event_at);const interval=m.expected_minutes*60000;const last=' Último sinal: '+new Date(m.last_event_at).toLocaleString('pt-BR')+'.';if(!Number.isFinite(age)||age>interval*2)return {tone:'red',label:'Sem sinal recente',detail:'A fonte não envia sinais há mais de dois intervalos.'+last};if(m.status==='error')return {tone:'red',label:'Falha informada',detail:'A plataforma informou falha.'+last};if(age>interval||m.status==='degraded')return {tone:'yellow',label:age>interval?'Sinal atrasado':'Alerta informado',detail:'Verifique a execução na plataforma.'+last};return {tone:'green',label:'Funcionamento informado',detail:'A fonte enviou um sinal de sucesso dentro do intervalo esperado.'+last};}
