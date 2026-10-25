import 'server-only';
import { cloudMode } from './deployment';
import { activeCredential,saveCredential,activateCredential,deleteCredential } from './credentials';
type ImageConfiguration={key:string;model:string;textModel?:string};
export async function imageConfiguration():Promise<ImageConfiguration|undefined>{
 const config=await activeCredential();if(config)return {key:config.key,model:config.model,textModel:config.textModel};
 if(!cloudMode()&&process.env.OPENAI_API_KEY&&process.env.OPENAI_IMAGE_MODEL)return {key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_IMAGE_MODEL,textModel:process.env.OPENAI_TEXT_MODEL||undefined};
}
export async function publicImageConfiguration(){const selected=await activeCredential();const config=selected||await imageConfiguration();return {configured:!!config,model:config?.model||null,textModel:config?.textModel||null,source:cloudMode()?(config?'encrypted':'none'):selected?'session':config?'environment':'none'};}
export async function configureImageSession(config:ImageConfiguration){const id=await saveCredential({label:'OpenAI',service:'openai',key:config.key,model:config.model,textModel:config.textModel||'gpt-4.1-mini'});await activateCredential(id);}
export async function clearImageSession(){const active=await activeCredential();if(active)await deleteCredential(active.id);}

