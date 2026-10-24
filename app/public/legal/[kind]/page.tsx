import Link from 'next/link';
import { notFound } from 'next/navigation';
import { emptyLegal,legalSchema,legalTitles,policyText,LegalKind } from '../../../../lib/compliance';
export const dynamic='force-dynamic';
export default async function PublicLegal({params}:{params:Promise<{kind:string}>}){
 const {kind}=await params;if(!Object.hasOwn(legalTitles,kind))notFound();
 let legal=emptyLegal();let invalid=false;
 try{if(process.env.STUDIO_PUBLIC_LEGAL_JSON)legal=legalSchema.parse(JSON.parse(process.env.STUDIO_PUBLIC_LEGAL_JSON));}catch{invalid=true;}
 return <main className="panel legal-page" style={{maxWidth:900,margin:'32px auto',padding:32}}><Link href="/">← Voltar ao estúdio</Link><h1>{legalTitles[kind as LegalKind]}</h1><p>{legal.reviewed?'Revisão declarada pelo responsável':'Rascunho: dados empresariais e revisão pendentes'}</p>{invalid&&<p role="alert">Configuração das informações públicas inválida. Contate o administrador.</p>}{(kind==='rights'?'Solicite acesso, correção, informações ou eliminação pelos canais de privacidade abaixo. Informe apenas o necessário para localizar e responder ao pedido.':policyText(kind as LegalKind,legal)).split('\n\n').map((p,i)=><p key={i}>{p}</p>)}{kind==='rights'&&<p>Contato para solicitações: {legal.privacyEmail?<a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>:'pendente de definição pelo responsável'}. Não envie documentos ou dados sensíveis antes de confirmar o canal.</p>}<nav aria-label="Informações legais">{Object.entries(legalTitles).map(([key,title])=><p key={key}><Link href={`/public/legal/${key}`}>{title}</Link></p>)}</nav></main>;
}
