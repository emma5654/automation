import { z } from 'zod';

export const securityRoles=['cybersecurity','pentest'] as const;
export const securityReportSchema=z.object({summary:z.string().max(20000),findings:z.array(z.object({nodeId:z.string().uuid().nullable(),severity:z.enum(['Crítica','Alta','Média','Baixa','Informativa']),title:z.string().max(300),detail:z.string().max(20000),recommendation:z.string().max(20000)})).max(30),testPlan:z.array(z.string().max(20000)).max(30),limitations:z.array(z.string().max(20000)).max(20)});
export type SecurityReport=z.infer<typeof securityReportSchema>;
export const securityControls=[['authorization','Escopo e autorização documentados'],['secrets','Credenciais fora de nós, imagens e logs'],['access','Permissões mínimas e autenticação'],['webhooks','Autenticidade e proteção de webhooks'],['input','Validação de entradas e limites de tamanho'],['privacy','Coleta mínima e retenção de dados'],['recovery','Duplicidade, limites, contingência e recuperação'],['ai','Injeção de prompt, saídas da IA e custos controlados']] as const;
export const roleNames={cybersecurity:'Cibersegurança sênior',pentest:'Hacker ético sênior · Pentest'};
export function validateSecurityReport(value:unknown,nodeIds:string[]){const report=securityReportSchema.parse(value);if(report.findings.some(f=>f.nodeId!==null&&!nodeIds.includes(f.nodeId)))throw new Error('INVALID_NODE_REFERENCE');return report;}
