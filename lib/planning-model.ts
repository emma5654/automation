import { z } from 'zod';
import { nodeTypes } from './flow-types';
const line=z.string().max(1200);
export const planSchema=z.object({
 summary:z.string().min(1).max(3000),
 questions:z.array(line).max(10),assumptions:z.array(line).max(10),tools:z.array(z.string().max(120)).max(10),
 nodes:z.array(z.object({number:z.number().int().positive(),type:z.enum(nodeTypes),title:z.string().min(1).max(150),platform:z.string().max(150),description:line,config:line,inputs:line,outputs:line,dependencies:line})).max(20),
 connections:z.array(z.object({source:z.number().int().positive(),target:z.number().int().positive(),label:z.string().max(150)})).max(50),
 tests:z.array(line).max(12),nextActions:z.array(line).max(12)
}).superRefine((p,c)=>{const ids=new Set(p.nodes.map(n=>n.number));if(ids.size!==p.nodes.length)c.addIssue({code:'custom',message:'Números de nós duplicados.'});if(p.connections.some(e=>!ids.has(e.source)||!ids.has(e.target)))c.addIssue({code:'custom',message:'Conexão aponta para etapa inexistente.'});});
export type AutomationPlan=z.infer<typeof planSchema>;
export const savedPlanSchema=z.object({version:z.number().int().positive(),model:z.string().max(100),at:z.string(),report:planSchema});
export function planText(p:AutomationPlan){return [p.summary,'Ferramentas: '+p.tools.join(', '),'Perguntas pendentes:',...p.questions,'Premissas:',...p.assumptions,'Próximas ações:',...p.nextActions].join('\n').slice(0,20000);}

