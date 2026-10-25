import { changeArchitecture,makeNode,metadata,type Project } from './model';
export function applySavedPlan(p:Project,planAt:string):Project{
 const plan=p.diagnosis.planning;if(!plan||plan.at!==planAt||plan.version!==p.automation.version)throw new Error('CONFLICT');if(!plan.report.nodes.length)throw new Error('ARCHITECTURE_REQUIRED');
 const nodes=plan.report.nodes.map(n=>({...makeNode(n.number,n.type,n.title),platform:n.platform,description:n.description,config:n.config,inputs:n.inputs,outputs:n.outputs,dependencies:n.dependencies}));const numbers=new Map(nodes.map(n=>[n.number,n.id]));
 const automation={...p.automation,nodes,connections:plan.report.connections.map(e=>({...metadata(),source:numbers.get(e.source)!,target:numbers.get(e.target)!,label:e.label}))};
 const next=changeArchitecture(p,automation);next.tools=plan.report.tools.join(' · ').slice(0,300);return next;
}

