import 'server-only';
export type TextConfiguration={key:string;textModel:string;service:'openai'|'gemini'};
export async function structuredText(config:TextConfiguration,options:{instructions:string;input:string;schema:Record<string,unknown>;name:string;maxTokens:number}){
 const gemini=config.service==='gemini';
 if(!/^[a-zA-Z0-9._-]+$/.test(config.textModel))throw new Error('PROVIDER_UNAVAILABLE');
 const response=await fetch(gemini?'https://generativelanguage.googleapis.com/v1beta/models/'+config.textModel+':generateContent':'https://api.openai.com/v1/responses',{
 method:'POST',headers:gemini?{'x-goog-api-key':config.key,'Content-Type':'application/json'}:{Authorization:'Bearer '+config.key,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),
 body:JSON.stringify(gemini?{systemInstruction:{parts:[{text:options.instructions}]},contents:[{role:'user',parts:[{text:options.input}]}],generationConfig:{maxOutputTokens:options.maxTokens,responseFormat:{text:{mimeType:'APPLICATION_JSON',schema:options.schema}}}}:{model:config.textModel,store:false,max_output_tokens:options.maxTokens,instructions:options.instructions,input:options.input,text:{format:{type:'json_schema',name:options.name,strict:true,schema:options.schema}}})
 });
 if(!response.ok){
 let details='';try{const b=await response.json();details=JSON.stringify({status:b.error?.status,details:b.error?.details,code:b.error?.code,message:b.error?.message});}catch{}
 if(details.includes('SERVICE_DISABLED')||details.includes('API has not been used'))throw new Error('PROVIDER_SERVICE_DISABLED');
 if(response.status===401||response.status===403||details.includes('API_KEY_INVALID')||details.includes('API key not valid'))throw new Error('PROVIDER_AUTH');
 if(response.status===429){if(/credit_balance_exhausted|insufficient_quota|spend_limit_exceeded/.test(details))throw new Error('PROVIDER_BILLING');throw new Error('PROVIDER_QUOTA');}
 throw new Error('PROVIDER_UNAVAILABLE');
 }
 const body=await response.json();
 if(gemini){
 const candidate=body.candidates?.[0];if(!candidate||candidate.finishReason!=='STOP')throw new Error('PROVIDER_INVALID_RESPONSE');
 const output=(candidate.content?.parts||[]).filter((p:{thought?:boolean;text?:string})=>!p.thought&&typeof p.text==='string').map((p:{text:string})=>p.text).join('');if(!output)throw new Error('PROVIDER_INVALID_RESPONSE');return output;
 }
 if(body.status==='incomplete')throw new Error('PROVIDER_INVALID_RESPONSE');
 const envelope=(body.output||[]) as Array<{type?:string;content?:Array<{type?:string;text?:string}>}>;
 const output=envelope.flatMap(item=>item.type==='message'?item.content||[]:[]).filter(c=>c.type==='output_text').map(c=>c.text||'').join('');if(!output)throw new Error('PROVIDER_INVALID_RESPONSE');return output;
}

