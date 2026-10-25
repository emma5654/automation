'use client';
import { useEffect,useState } from 'react';
import type { ClientSignal,Signal } from '../lib/client-signals';
export function useClientSignals(enabled:boolean){
 const [state,setState]=useState<{items:ClientSignal[];at:string;error:string}>({items:[],at:'',error:''});
 useEffect(()=>{if(!enabled)return;let disposed=false;const controller=new AbortController();let running=false;async function load(){if(running||document.hidden)return;running=true;try{const r=await fetch('/api/client-status',{cache:'no-store',signal:controller.signal});const body=await r.json();if(!r.ok)throw new Error(body.error);if(!disposed)setState({items:body.items,at:body.at,error:''});}catch{if(!disposed)setState(s=>({...s,error:'Não foi possível atualizar os sinalizadores. Os dados anteriores podem estar desatualizados.'}));}finally{running=false;}}void load();const timer=setInterval(load,15000);document.addEventListener('visibilitychange',load);return()=>{disposed=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',load);};},[enabled]);
 return state;
}
function Lamp({label,signal}:{label:string;signal:Signal}){const colors={green:'#187044',yellow:'#956600',red:'#b42335',gray:'#646876'};return <p title={signal.detail}><span aria-hidden="true" style={{display:'inline-block',width:12,height:12,borderRadius:'50%',background:colors[signal.tone],marginRight:8}}/><strong>{label}:</strong> {signal.label}<br/><small>{signal.detail}</small></p>;}
export function ClientLamps({signal,unavailable}:{signal?:ClientSignal;unavailable?:boolean}){if(unavailable)return <p role="status">Sinalizador sem atualização. Não há confirmação do estado atual.</p>;if(!signal)return <p>Carregando sinalizador...</p>;return <div><Lamp label="Projeto" signal={signal.project}/><Lamp label="Automação" signal={signal.health}/></div>;}

