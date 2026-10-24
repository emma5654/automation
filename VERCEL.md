# Publicar na Vercel

**Atualização de 24/10/2026:** publicado em https://automation-studio-ai-carol-5fda.vercel.app. Código em https://github.com/emma5654/automation. Consulte [PUBLICACAO.md](PUBLICACAO.md) para os testes em produção, primeiro acesso e vínculo GitHub–Vercel ainda pendente.


Publicação executada por API, com estado READY. As instruções abaixo também servem para reproduzir a configuração. E-mail autorizado escolhido: `emarianelimafcm@gmail.com`. A conta de Auth e a senha ainda devem ser criadas diretamente no Supabase.

1. Colocar **o conteúdo desta pasta** em um repositório Git. O código já foi enviado ao repositório `emma5654/automation` pela API do GitHub; o diretório local de entrega continua sem `.git`.
2. Na Vercel, escolher **Add New > Project > Import Git Repository**. Framework: **Next.js**. Root Directory: a pasta que contém `package.json`. Se copiar somente o aplicativo para a raiz do repositório, usar a raiz. Se mantiver a estrutura de entrega inteira, usar `outputs/automation-studio-web`.
3. Usar `npm ci` como instalação e `npm run build` como build; `vercel.json` já declara ambos. Não publicar como export estático. Manter Fluid Compute habilitado; os handlers de IA/exportação declaram `maxDuration=300`. Conferir a disponibilidade desse limite na conta/plano escolhido.
4. Em **Settings > Environment Variables**, preencher os campos descritos em DEPLOY.md. Usar `STUDIO_STORAGE=supabase`, `STUDIO_ALLOWED_EMAILS=emarianelimafcm@gmail.com`, a URL e a chave publishable do Supabase, uma chave mestra aleatória e `STUDIO_APP_URL` igual à origem HTTPS final da Vercel ou domínio próprio. Nenhum segredo deve receber prefixo `NEXT_PUBLIC_`.
5. Criar a conta em **Supabase > Authentication > Users**, usando o e-mail autorizado. Configurar URL do site no Supabase. Entrar com a senha criada diretamente no painel; não enviar senha no chat.
6. Fazer deploy e acessar `/api/health`; com configuração completa, retorna `ready`. Esse endpoint verifica variáveis, não a conexão com o banco. Depois entrar, criar um projeto de teste, recarregar a página, enviar uma imagem pequena, exportar, sair e verificar que a API exige login novamente.
7. Cadastrar sua chave OpenAI em **Configurações**, já dentro da conta publicada. Realizar uma geração somente quando quiser validar a credencial e aceitar o custo do provedor.

Não usar o modo local na Vercel: filesystem efêmero e instâncias concorrentes não são adequados para os arquivos de dados locais. Não configurar OPENAI_API_KEY compartilhada para financiar usuários: no modo cloud, o aplicativo usa apenas a chave criptografada de cada conta.

## Limites desta versão

- Upload manual: 2 MB por imagem no cloud, validado antes do envio pela interface. Imagens geradas são salvas diretamente pelo servidor no Storage.
- Documentos de workspace: aproximadamente 1,8 MB no aplicativo, 2 MB no banco. Ao atingir o limite, novos salvamentos falham sem substituir o documento anterior. Organizar/exportar dados com o administrador antes de aumentar o volume.
- Imagens e ZIPs privados são entregues com links assinados de 60 segundos. Quem receber esse link pode usá-lo durante esse período; sair da conta não invalida instantaneamente um link já emitido. Não compartilhar links privados.
- Pacotes de exportação têm limite de aproximadamente 45 MB de imagens e 50 MB de ZIP. O último ZIP de cada projeto substitui o anterior no bucket privado `studio-exports`. A geração do ZIP ainda usa memória da função.
- Imagens removidas/substituídas, exportações de projetos excluídos e backups exigem política de limpeza operacional; não há expurgo agendado. O esquema e as permissões estão em `supabase/schema.sql` e `supabase/vercel.sql`.
- As páginas públicas em `/public/legal/*` continuam como rascunho até configurar dados reais revisados em `STUDIO_PUBLIC_LEGAL_JSON`. O usuário ainda não definiu os dados empresariais. O app não declara conformidade automática.
- Preview Deployments precisam de seu próprio `STUDIO_APP_URL` exato e, de preferência, projeto Supabase de teste. O servidor não aceita automaticamente qualquer domínio de preview. Reimplantar após mudar variáveis.

O projeto Vercel e seu domínio já foram publicados. O código está no GitHub; o gatilho automático GitHub–Vercel ainda exige conectar o GitHub nas Login Connections da conta Vercel. Docker permanece como alternativa, não é usado na publicação Next.js padrão da Vercel.

Referências oficiais: [limites de payload](https://vercel.com/docs/functions/limitations), [duração das funções](https://vercel.com/docs/functions/configuring-functions/duration), [configuração do projeto](https://vercel.com/docs/project-configuration).
