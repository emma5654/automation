# Preparação para publicação

**Atualização de 24/10/2026:** publicado em https://automation-studio-ai-carol-5fda.vercel.app. Código em https://github.com/emma5654/automation. Consulte [PUBLICACAO.md](PUBLICACAO.md) para os testes em produção, primeiro acesso e vínculo GitHub–Vercel ainda pendente.


Hospedagem escolhida: **Vercel**. Conta autorizada definida: **emarianelimafcm@gmail.com**. O aplicativo foi publicado; as instruções abaixo documentam sua configuração. O modo local permanece disponível para desenvolvimento. O backend cloud está implementado, e a estrutura foi aplicada ao projeto Supabase `sqtsnecaxcvwgqkljyca`.

## O que foi preparado

- Login por e-mail/senha usando Supabase Auth. Cadastro fechado na interface; o servidor também exige uma lista explícita de e-mails autorizados.
- Cookies de sessão HttpOnly, SameSite=Lax e Secure em produção. Acesso autenticado é validado no servidor com `getUser`, nunca apenas lendo a sessão do cookie. O SDK atualiza os cookies nos Route Handlers; não há acesso ao Supabase em Server Components nem cliente de autenticação no navegador.
- Um documento de workspace por usuário, com revisão otimista no Postgres. RLS restringe leituras e gravações ao proprietário. Não usamos service_role no aplicativo.
- Imagens em bucket privado `studio-images`, com pastas por UUID e RLS. Geração, leitura e exportação passam pelo usuário autenticado.
- Chaves OpenAI criptografadas com AES-256-GCM e autenticadas com o UUID da conta. A chave mestra fica apenas no ambiente do servidor, fora do Supabase e do repositório. Não há fallback para uma chave OpenAI compartilhada no modo cloud.
- Limites persistentes por usuário: 10 tentativas de imagem e 20 revisões por hora no banco. Quotas não são garantia de teto financeiro: configure também limites no provedor.
- Verificação de Origin nas alterações, respostas de API sem cache e cabeçalhos básicos de proteção.
- Dockerfile com servidor Node e usuário sem privilégios administrativos. Nenhum arquivo de dados ou `.env` é copiado para a imagem.

## Configuração necessária

1. Importar o projeto Next.js na Vercel e definir o endereço HTTPS definitivo. Este pacote não foi publicado em uma conta de hospedagem.
2. No Supabase, em **Authentication > Users**, criar a conta do administrador com o e-mail escolhido e uma senha forte, digitada diretamente no painel. Não enviar senha no chat. O aplicativo não cria usuários nem implementa recuperação de senha por e-mail nesta etapa; a administração da conta permanece no Supabase.
3. Definir as variáveis no painel de segredos da hospedagem:

| Variável | Valor |
|---|---|
| `STUDIO_STORAGE` | `supabase` |
| `SUPABASE_URL` | `https://sqtsnecaxcvwgqkljyca.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Chave **publishable** do projeto, em Settings > API Keys |
| `STUDIO_APP_URL` | Origem exata da aplicação, por exemplo `https://studio.seudominio.com`, sem caminhos |
| `STUDIO_ALLOWED_EMAILS` | emarianelimafcm@gmail.com; separar outras contas autorizadas por vírgula |
| `STUDIO_ENCRYPTION_KEY` | 64 caracteres hexadecimais aleatórios; guardar cópia em cofre seguro |
| `STUDIO_PUBLIC_LEGAL_JSON` | Opcional durante testes privados; antes da abertura pública, JSON de políticas reais revisadas |

Para gerar a chave de criptografia em seu terminal:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guardar o resultado diretamente no gerenciador de segredos. Perdê-lo impede recuperar as chaves de IA salvas. A rotação requer recriptografar os registros ou pedir que cada usuário configure novamente sua API key; não há rotação automática.

4. Ajustar **Authentication > URL Configuration** para o domínio e desabilitar cadastro público/anonymous sign-ins no painel se não forem usados por outro aplicativo do projeto. Essa alteração não foi feita automaticamente. A lista de e-mails é aplicada pelo servidor do Studio; usuários cadastrados fora dele só podem acessar seus próprios registros via RLS.
5. Após entrar no Studio publicado, abrir **Configurações**, cadastrar a API key OpenAI da conta e selecionar os modelos. A chave é validada no primeiro uso real. Cada solicitação de IA pode ter custo. Não gravar OPENAI_API_KEY no repositório ou em variáveis NEXT_PUBLIC.

## Executar em Docker

```sh
docker build -t automation-studio .
docker run --rm --env-file .env.production -p 3000:3000 automation-studio
```

`.env.production` é um arquivo local privado com as variáveis da tabela. Para teste via HTTP em localhost, usar `next dev` em vez da imagem de produção: os cookies de produção exigem HTTPS. Em hospedagem, o proxy TLS termina HTTPS e encaminha para `PORT` (padrão 3000). O comando do container escuta em `0.0.0.0`; não requer disco persistente para projetos ou imagens no modo Supabase.

Sem Docker: `npm ci`, `npm run build`, e `node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port 3000`, com as variáveis de produção e proxy HTTPS.

`GET /api/health` retorna prontidão **de configuração**, sem expor segredos. Não substitui um teste de conexão nem monitora disponibilidade do Supabase. O modo de arquivos local em produção é bloqueado por padrão. `STUDIO_ALLOW_LOCAL_PRODUCTION=true` existe exclusivamente para QA local, continua limitado a localhost e não deve ser usado na hospedagem.

## Banco e validação

`supabase/schema.sql` e `supabase/vercel.sql` documentam as migrations remotas `studio_cloud_foundation`, `studio_permission_hardening` e `studio_vercel_storage`. Não executar novamente no mesmo projeto: nomes de tabelas e políticas já existem. Em outro projeto, aplicar como migrations após inspecionar o esquema existente. Não é necessário executar SQL manual para publicar este projeto já preparado.

Os identificadores `local-user` dentro do documento legado são rótulos internos, não a fonte de autorização. O limite de acesso é `studio_workspaces.user_id = auth.uid()`; imagens e cofre têm a mesma separação. Esta primeira versão não oferece workspace compartilhado, convites de equipe ou colaboração simultânea em tempo real. Cada conta tem dados próprios.

O workspace usa JSONB para preservar as funcionalidades atuais; isso não equivale a um esquema relacional otimizado para grande escala. Nesta versão para Vercel, o documento é limitado a aproximadamente 1,8 MB no aplicativo e 2 MB no banco para permanecer abaixo dos limites de payload. Conflitos devolvem 409 em vez de sobrescrever alterações. Reservar revisão de modelo e índices antes de aumentar muito o volume.

`tests/cloud-isolation.sql` testa dois usuários sintéticos em transação e faz rollback: isolamento de dados/cofre/imagens, mudança indevida de proprietário, revisão otimista e quota persistente. Não cria contas reais nem envia e-mails. Veja VALIDACAO.md para o que foi de fato executado.

## Dados e operação antes da abertura pública

- Projetos locais **não foram migrados**. Fazer backup de `data/studio.json` e `data/images` antes de uma migração explícita; não enviar dados reais apenas para testar.
- A região atual do projeto é `us-west-2`. Avaliar operadores, transferências internacionais e bases legais antes de colocar dados de clientes.
- Definir retenção e backups. A exclusão do projeto remove a referência no documento, mas arquivos de imagens antigos/substituídos e backups exigem procedimento de limpeza; não existe rotina automática de expurgo nesta etapa.
- Os contadores de quota devem receber retenção operacional; não há agendamento de limpeza configurado. O bucket tem limite de arquivo de 20 MB; upload manual fica limitado a 2 MB no cloud e 10 MB no modo local.
- Preencher dados empresariais e revisão jurídica, que o responsável ainda não definiu. As páginas são rascunhos e não representam certificação LGPD.
- As políticas salvas na conta atendem ao workspace. Para exibir informações do **serviço publicado antes do login**, exportar as políticas revisadas e configurar `STUDIO_PUBLIC_LEGAL_JSON`. As páginas públicas estão em `/public/legal/privacy`, `/terms`, `/cookies`, `/refund`, `/accessibility`, `/rights` (todas sob `/public/legal`). O contato público recebe pedidos sem exigir conta; não há envio de e-mail automático pelo Studio.
- Tracking continua opcional e desativado sem consentimento e revisão. O recibo de consentimento fica no navegador; ainda não há livro durável central de consentimento.
- Realizar teste com a conta real: entrar, criar projeto, recarregar, configurar/remover chave, enviar imagem, exportar ZIP e sair. O login real e chamadas pagas à IA não foram validados sem credenciais do usuário.
- Docker não foi executado se o ambiente não disponibilizar Docker; o build Next e os testes locais são verificações separadas da imagem em produção.

Referências: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [controle de acesso no Storage](https://supabase.com/docs/guides/storage/security/access-control), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
