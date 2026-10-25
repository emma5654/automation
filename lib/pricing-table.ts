import { z } from 'zod';
export const pricingTableSchema=z.object({
 hourly:z.number().min(0).max(1000000),expenses:z.number().min(0).max(10000000),risk:z.number().min(0).max(100),tax:z.number().min(0).max(99),margin:z.number().min(0).max(99),
 services:z.array(z.object({name:z.string().trim().min(1).max(120),hours:z.number().min(0).max(100000),supportHours:z.number().min(0).max(1000),monthly:z.number().min(0).max(10000000)})).min(1).max(30)
}).refine(t=>t.tax+t.margin<100,{message:'Margem + taxas deve ser menor que 100%.'});
export type PricingTable=z.infer<typeof pricingTableSchema>;
export function defaultPricingTable():PricingTable{return {hourly:60,expenses:0,risk:15,tax:6,margin:30,services:[{name:'Fluxo essencial',hours:6,supportHours:1,monthly:197},{name:'Fluxo intermediário',hours:12,supportHours:2,monthly:297},{name:'Fluxo avançado',hours:24,supportHours:4,monthly:497}]};}
export function suggestedPrice(table:Pick<PricingTable,'hourly'|'expenses'|'risk'|'tax'|'margin'>,hours:number){if(table.tax+table.margin>=100)return null;return Math.ceil((hours*table.hourly+table.expenses)*(1+table.risk/100)/(1-(table.tax+table.margin)/100));}

