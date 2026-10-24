'use client';
import { useState,useId,useRef,useEffect,cloneElement,isValidElement } from 'react';
import { Check,Copy,LoaderCircle } from 'lucide-react';
export function Button({children,kind='primary',busy=false,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{kind?:'primary'|'secondary'|'ghost'|'danger';busy?:boolean}){return <button {...props} onClick={e=>{const result=props.onClick?.(e) as unknown;if(result instanceof Promise)result.catch(()=>{});}} disabled={props.disabled||busy} className={`button ${kind} ${props.className||''}`}>{busy&&<LoaderCircle size={16} className="spin"/>}{children}</button>;}
export function Field({label,children,hint}:{label:string;children:React.ReactNode;hint?:string}){const fieldId=useId();const control=isValidElement(children)?cloneElement(children as React.ReactElement<{id?:string;'aria-describedby'?:string}>,{id:fieldId,'aria-describedby':hint?`${fieldId}-hint`:undefined}):children;return <div className="field"><label htmlFor={fieldId}>{label}</label>{control}{hint&&<small id={`${fieldId}-hint`}>{hint}</small>}</div>;}
export function CopyButton({text}:{text:string}){const[copied,setCopied]=useState(false);return <Button kind="ghost" onClick={async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{window.prompt('Copie este conteúdo',text);}}}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copiado':'Copiar'}</Button>;}
export function Badge({children,tone='neutral'}:{children:React.ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>;}
export function Empty({title,children}:{title:string;children?:React.ReactNode}){return <div className="empty"><div className="empty-icon">✦</div><h3>{title}</h3><div>{children}</div></div>;}
export function Modal({label,onClose,children}:{label:string;onClose:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;const dialog=ref.current;dialog?.showModal();return()=>{dialog?.close();previous?.focus();};},[]);
 return <dialog ref={ref} tabIndex={-1} className="studio-dialog" aria-label={label} onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{
  if(e.key!=='Tab')return;
  const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0);
  const first=controls[0],last=controls.at(-1);
  if(!first){e.preventDefault();e.currentTarget.focus();return;}
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }}>{children}</dialog>;
}
export const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
export const date=(s:string)=>s?new Date(s.length===10?s+'T12:00:00':s).toLocaleDateString('pt-BR'):'Não definida';
export function download(name:string,data:unknown,type='application/json'){const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
