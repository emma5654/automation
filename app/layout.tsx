import type { Metadata } from 'next';
import './globals.css';
import './accessibility.css';
export const metadata:Metadata={title:'Automation Studio AI',description:'Do problema ao fluxo. Da imagem à implementação.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
