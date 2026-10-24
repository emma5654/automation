export function cloudMode(){return process.env.STUDIO_STORAGE==='supabase';}
export function deploymentConfig(){
 if(!cloudMode()){
  if(process.env.NODE_ENV==='production'&&process.env.STUDIO_ALLOW_LOCAL_PRODUCTION!=='true')throw new Error('DEPLOYMENT_CONFIG');
  return;
 }
 const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key||!process.env.STUDIO_APP_URL)throw new Error('DEPLOYMENT_CONFIG');
 const origin=new URL(process.env.STUDIO_APP_URL);
 if(process.env.NODE_ENV==='production'&&origin.protocol!=='https:')throw new Error('DEPLOYMENT_CONFIG');
 return {url,key,origin:origin.origin};
}
