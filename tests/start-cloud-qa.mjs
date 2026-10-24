// QA only: all credentials are fixtures; never use this key in production.
import { spawn } from 'node:child_process';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3002'],{
 stdio:'inherit',env:{...process.env,STUDIO_STORAGE:'supabase',SUPABASE_URL:'https://sqtsnecaxcvwgqkljyca.supabase.co',SUPABASE_PUBLISHABLE_KEY:'fixture-publishable-not-a-real-key',STUDIO_APP_URL:'https://studio.example',STUDIO_ALLOWED_EMAILS:'fixture@studio.invalid',STUDIO_ENCRYPTION_KEY:'01'.repeat(32)},
});
process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));child.on('exit',code=>process.exit(code||0));
