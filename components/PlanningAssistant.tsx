'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button,Field,Badge } from './ui';
import type { Project } from '../lib/model';
export default function PlanningAssistant({project,savedProject,onChange,save,refresh,configured,busy,providerName='provedor selecionado'}:{providerName?:string;project:Project;savedProject:Project;onChange:(p:Project)=>void;save:(p:Project)=>Promise<void>;refresh:()=>Promise<void>;configured:boolean;busy:boolean}){
 const [message,setMessage]=useState('');const [working,setWorking]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const plan=savedProject.diagnosis.planning;
 function answer(key:string,value:string){onChange({...project,diagnosis:{...project.diagnosis,answers:{...project.diagnosis.answers,[key]:value}}});}
 async function act(apply=false){setWorking(true);setError('');setNotice('');try{
 if(!apply)await save(project);
 const r=await fetch('/api/planner',{method:apply?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(apply?{projectId:project.id,planAt:plan?.at}:{projectId:project.id,message})});const body=await r.json();if(!r.ok)throw new Error(body.error);await refresh();setMessage('');setNotice(apply?'Fluxo aplicado. Abra Arquitetura para revisar os nós e conexões.':'Proposta salva no diagnóstico. Revise dúvidas e etapas antes de aplicar.');
 }catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar o plano.');}finally{setWorking(false);}}
 return <section className="panel"><Badge tone="lilac">Agente IA · entendimento e fluxo por cliente</Badge><h2>Conte como o serviço funciona.</h2><p>Explique o atendimento atual e como você quer que a automação funcione. O agente analisa este cliente, faz perguntas e propõe um fluxo para sua revisão.</p>
 <Field label="Funcionamento completo do serviço do cliente" hint="Descreva serviços, etapas, regras, exceções e quem atende. Use exemplos fictícios e não inclua senhas ou dados pessoais de clientes."><textarea rows={7} maxLength={16000} value={project.diagnosis.answers.serviceBrief||''} onChange={e=>answer('serviceBrief',e.target.value)} placeholder="O cliente oferece... Hoje o atendimento começa quando... Depois a equipe..."/></Field>
 <Field label="Como quero que a automação funcione"><textarea rows={6} maxLength={16000} value={project.diagnosis.answers.desiredFlow||''} onChange={e=>answer('desiredFlow',e.target.value)} placeholder="Quando acontecer..., quero responder..., verificar..., encaminhar para..."/></Field>
 <Field label="Pedido ao agente ou respostas às perguntas"><textarea rows={4} maxLength={6000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ex.: monte o fluxo no ManyChat; a agenda é externa e a equipe confirma a reserva."/></Field>
 {!configured&&<p className="notice">Selecione uma chave OpenAI ou Gemini e um modelo de texto em <Link href="/settings">Configurações</Link> para usar o agente.</p>}
 <div className="actions"><Button disabled={!configured||busy} busy={working} onClick={()=>act()}>{plan?'Refinar proposta com IA':'Entender e propor fluxo com IA'}</Button><Button kind="secondary" disabled={working||busy} onClick={()=>save(project)}>Salvar descrição sem gerar</Button></div><p className="muted">Ao gerar, o diagnóstico é salvo e enviado ao {providerName} com a chave selecionada. Pode haver custo no provedor. A proposta exige revisão; as integrações externas serão configuradas separadamente.</p>
 {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
 {plan&&<div><h3>Proposta para {savedProject.client||savedProject.name}</h3><p>{plan.report.summary}</p><small>Modelo: {plan.model} · Base: V{plan.version} · {new Date(plan.at).toLocaleString('pt-BR')}</small>
 {([['Perguntas para você',plan.report.questions],['Premissas a confirmar',plan.report.assumptions],['Ferramentas propostas',plan.report.tools],['Testes sugeridos',plan.report.tests],['Próximos passos',plan.report.nextActions]] as const).map(([title,items])=>items.length>0&&<div key={title}><h4>{title}</h4><ul>{items.map((item,i)=><li key={i}>{item}</li>)}</ul></div>)}
 <h4>Fluxo proposto · {plan.report.nodes.length} etapas</h4>{plan.report.nodes.map(n=><details className="panel" key={n.number}><summary>{n.number}. {n.title} · {n.type}</summary><p>{n.description}</p><p>Plataforma: {n.platform}</p><p>Entrada: {n.inputs}</p><p>Saída: {n.outputs}</p><p>Configuração planejada: {n.config}</p><p>Dependências: {n.dependencies}</p></details>)}
 {plan.report.connections.length>0&&<ul>{plan.report.connections.map((e,i)=><li key={i}>Etapa {e.source} → Etapa {e.target}: {e.label}</li>)}</ul>}
 {plan.version!==savedProject.automation.version?<p className="notice">A arquitetura mudou desde esta proposta. Gere uma nova revisão para aplicar outro fluxo.</p>:plan.report.nodes.length>0&&<Button disabled={busy} busy={working} onClick={()=>{if(!savedProject.automation.nodes.length||confirm('Aplicar este fluxo como nova versão? A arquitetura anterior será preservada e as imagens e testes precisarão de revisão.'))void act(true);}}>Aplicar fluxo revisado à arquitetura</Button>}
 <p><Link href={'/projects/'+project.id+'/architecture'}>Abrir arquitetura do cliente</Link></p></div>}
 </section>;
}

