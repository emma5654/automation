import type { Project,GuidedImage,Automation } from './model';
import { imageConfiguration } from './provider-settings';

export interface DiagnosisProvider { recommend(answers:Record<string,string>):Promise<string> }
export interface ArchitectureProvider { generate(project:Project):Promise<Automation> }
export interface InstructionProvider { generate(project:Project):Promise<Project['steps']> }
export interface VisualPromptProvider { generate(project:Project,image:GuidedImage):Promise<string> }
export interface ConsistencyProvider { review(project:Project):Promise<string[]> }
export interface TestSuggestionProvider { suggest(project:Project):Promise<Project['tests']> }
export interface ImageProvider { generate(prompt:string):Promise<Buffer> }
export class OpenAIImageProvider implements ImageProvider{
 async generate(prompt:string){
  const config=await imageConfiguration();
  if(!config)throw new Error('PROVIDER_NOT_CONFIGURED');
  const {key,model}=config;
  const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,n:1,size:'1024x1024'}),signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw new Error(`PROVIDER_HTTP_${response.status}`);
  const body=await response.json();const value=body.data?.[0]?.b64_json;
  if(typeof value!=='string')throw new Error('PROVIDER_INVALID_RESPONSE');
  const buffer=Buffer.from(value,'base64');if(buffer.length>20*1024*1024||buffer.length<8||buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('PROVIDER_INVALID_IMAGE');return buffer;
 }
}
export const imageProvider=():ImageProvider=>new OpenAIImageProvider();
