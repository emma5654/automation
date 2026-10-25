import 'server-only';
import { cloudMode } from './deployment';
import { activeCredential,saveCredential,activateCredential,deleteCredential } from './credentials';
import { normalizeTextModel } from './credential-model';
import type { TextConfiguration } from './text-generation';
type ImageConfiguration={key:string;model:string;textModel?:string};
export async function imageConfiguration():Promise<ImageConfiguration|undefined>{
 const config=await activeCredential();if(config?.service==='openai')return {key:config.key,model:config.model,textModel:config.textModel};
 if(!cloudMode()&&process.env.OPENAI_API_KEY&&process.env.OPENAI_IMAGE_MODEL)return {key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_IMAGE_MODEL,textModel:process.env.OPENAI_TEXT_MODEL||undefined};
}
export async function textConfiguration():Promise<TextConfiguration|undefined>{
 const selected=await activeCredential();if(selected&&(selected.service==='openai'||selected.service==='gemini'))return {key:selected.key,service:selected.service,textModel:normalizeTextModel(selected.service,selected.textModel)};
 const local=await imageConfiguration();if(local?.textModel)return {key:local.key,textModel:local.textModel,service:'openai'};
}
export async function publicImageConfiguration(){
 const selected=await activeCredential();const local=!cloudMode()&&!selected?await imageConfiguration():undefined;
 const image=selected?.service==='openai'?selected:local;
 const text=selected&&(selected.service==='openai'||selected.service==='gemini')?{textModel:normalizeTextModel(selected.service,selected.textModel),service:selected.service}:local?.textModel?{textModel:local.textModel,service:'openai'}:undefined;
 return {configured:!!image,textConfigured:!!text,model:image?.model||null,textModel:text?.textModel||null,textProvider:text?.service||null,source:cloudMode()?(selected?'encrypted':'none'):selected?'session':local?'environment':'none'};
}
export async function configureImageSession(config:ImageConfiguration){const id=await saveCredential({label:'OpenAI',service:'openai',key:config.key,model:config.model,textModel:config.textModel||'gpt-4.1-mini'});await activateCredential(id);}
export async function clearImageSession(){const active=await activeCredential();if(active)await deleteCredential(active.id);}

