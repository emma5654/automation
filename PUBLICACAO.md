# Publicação — 24/10/2026

O Automation Studio AI foi publicado em produção na Vercel.

- Endereço principal: https://automation-studio-ai-carol-5fda.vercel.app
- Código: https://github.com/emma5654/automation
- Branch: `main`
- Commit de código publicado: `34628efcc177a035175977a36d8b9d601332738b`
- Projeto Vercel: `prj_6GI8njGTtOAjckOAcuv8EJIX30Yl`
- Deployment: `dpl_CmCKPyQv7Nf1kKbkuPo2GpJTafUT`, estado `READY`, target `production`
- Supabase: `sqtsnecaxcvwgqkljyca`, região `us-west-2`, estrutura e buckets privados já aplicados.

As variáveis de produção foram configuradas diretamente no ambiente criptografado da Vercel: `STUDIO_STORAGE`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `STUDIO_APP_URL`, `STUDIO_ALLOWED_EMAILS` e `STUDIO_ENCRYPTION_KEY`. Nenhuma credencial real, banco local ou pasta de imagens foi enviada ao GitHub. A chave mestra não deve ser substituída sem um plano de rotação: isso impediria abrir chaves de IA já salvas.

## Verificação da publicação

- `GET /api/health`: 200, `status: ready`, `storage: supabase`.
- `GET /api/state` e `/api/auth` sem sessão: 401.
- Política pública de privacidade: 200.
- Alteração com Origin externo: 403.
- Configuração de provedor sem login: 401.
- Tela de login abriu em navegador limpo, com campo de senha protegido e sem erros JavaScript.
- Security Advisors do Supabase: nenhum alerta na consulta final.

O health confirma a configuração do servidor; não substitui login real ou uma transação autenticada. Não foi usada uma chave OpenAI real, nem feita chamada paga à IA.

## Primeiro acesso e pendências

1. No Supabase, abrir Authentication > Users e criar `emarianelimafcm@gmail.com`, definindo a senha diretamente no painel. A conta ainda não existia na última verificação. A lista de e-mails autorizados na Vercel já contém esse endereço. Não enviar senha pelo chat.
2. Entrar no endereço principal acima, cadastrar a API key da IA em Configurações e realizar o teste real desejado. Os dados locais não foram migrados automaticamente.
3. Para ativar deploy automático por commits, conectar o GitHub nas Login Connections da conta Vercel e vincular `emma5654/automation` ao projeto. A Vercel recusou o vínculo automático por ausência dessa conexão. A publicação atual foi feita pela API com o mesmo código do commit indicado; o repositório não está configurado como gatilho automático de deploy.
4. Usar o endereço principal configurado em `STUDIO_APP_URL`. Outros aliases não são automaticamente aceitos como Origin nas alterações autenticadas.
5. Definir os dados empresariais e revisar as políticas antes da abertura comercial. As páginas jurídicas permanecem rascunhos; não há certificação automática LGPD. Retenção, limpeza de arquivos antigos e backups exigem operação definida pelo responsável.

O ajuste necessário ao build foi fazer o Next.js usar `.next` na Vercel e preservar `.studio-build` no ambiente local. O primeiro build falhou por esse diretório; a versão corrigida foi publicada e verificada.
