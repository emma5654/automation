# Automation Studio AI — local e preparação para deploy

**Deploy na Vercel:** consulte [VERCEL.md](VERCEL.md) e [DEPLOY.md](DEPLOY.md). O backend Supabase foi implementado e sua estrutura foi aplicada ao projeto indicado. A aplicação ainda não foi publicada; conta administradora, ambiente de hospedagem e validação de login real estão pendentes.

Aplicação Next.js/React/TypeScript para criar projetos comerciais, desenhar arquiteturas e ensinar a implementação com sequências visuais. Interface em português, responsiva, com modo local de usuário único explicitamente identificado.

## Requisitos e execução

Usar Node.js 24 LTS na Vercel, npm e navegador moderno.

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:3000. O servidor escuta apenas no loopback. Se a porta estiver ocupada, use `npm run dev -- --port 3001` e abra a porta indicada.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm start` executa a versão de produção e requer configuração cloud. Para continuar no modo local, use `npm run dev`. O teste de produção local exige `STUDIO_ALLOW_LOCAL_PRODUCTION=true` e permanece limitado a localhost.

No modo local, após instalar dependências, os dados não dependem de conexão com serviços externos. No modo cloud, Supabase e autenticação exigem rede. São usadas fontes locais do sistema; não há carregamento de Google Fonts.

## O que funciona

- Dashboard com indicadores derivados dos registros salvos, sem métricas de vendas inventadas.
- Projetos: criar rascunho, editar, pesquisar, filtrar, duplicar com novos IDs, arquivar/restaurar e excluir com confirmação.
- Diagnóstico persistente com recomendação local por regras explícitas e texto revisável.
- Editor React Flow: arrastar, zoom, pan, conectar, editar campos, excluir nós/conexões; formulário alternativo para conexões e propriedades.
- Versionamento com snapshots anteriores, IDs e números de nós estáveis; imagens antigas desatualizadas; testes voltam a pendentes após mudança.
- Sequência com visão geral, preparação, montagem e configuração de cada nó e validação. Prompt individual, revisão técnica, upload, geração opcional no servidor, regeneração individual e estados de erro.
- Tutorial com instruções editáveis, configurações copiáveis, checklist, navegação e posição retomável ao salvar.
- Cenários de teste com evidência, responsável e histórico de resultados; verificação de estrutura local explicitamente simulada.
- Orçamento com custo, reserva, equilíbrio, preço-alvo, margem sobre receita, licenças separadas e proposta copiável.
- Bibliotecas editáveis de clientes, mensagens e skills; exportação local, inclusive conteúdo SKILL.md.
- Manutenção com fichas e alertas internos para datas próximas/atrasadas ao abrir o painel.
- ZIP por projeto: registro completo, arquitetura atual e versões, imagens existentes, índice de imagens pendentes, tutorial, testes e proposta.

## Persistência e banco

O modo local continua disponível no desenvolvimento. Com STUDIO_STORAGE=supabase, o backend usa Supabase Auth, banco com RLS por usuário e Storage privado; consulte DEPLOY.md. O modo local usa: documento JSON validado com Zod, versão de esquema 1 em `data/studio.json`; imagens binárias em `data/images`. Escritas são serializadas no processo, com arquivo temporário e rename atômico. Revisão otimista impede sobrescrita silenciosa entre abas.

O primeiro acesso cria um projeto **Agenda no Direct** com cliente fictício, seis nós, caminhos alternativos, quinze etapas visuais, mensagens de exemplo e testes pendentes. Nenhuma integração externa está conectada. Os dados demonstrativos podem ser excluídos pela interface.

O modelo contém User, Client, Project, Diagnosis, Automation, AutomationNode, AutomationConnection, AutomationVersion, GuidedImage, TutorialStep, MessageTemplate, TestScenario, TestRun, PricingEstimate, MaintenanceRecord, Skill e ActivityLog. Entidades filhas são documentos aninhados com IDs e datas. As relações de nós, conexões, imagens e tutorial são validadas antes da persistência.

`schemaVersion` é validada: versões desconhecidas falham sem sobrescrever o arquivo. O esquema cloud está em supabase/schema.sql; as duas migrations aplicadas estão registradas no histórico remoto do Supabase. Antes de alterar o esquema local, faça backup e implemente a migração correspondente. Não execute múltiplas instâncias apontando para a mesma pasta.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`; reinicie o servidor após alterar.

| Variável | Necessidade |
|---|---|
| `STUDIO_DATA_DIR` | Opcional, pasta de dados; padrão `./data` |
| `OPENAI_API_KEY` | Apenas para geração real de imagens; chave exclusivamente no servidor |
| `OPENAI_IMAGE_MODEL` | Modelo GPT Image compatível com a Image API, habilitado na conta |
| `IMAGE_HOURLY_LIMIT` | Limite local por processo; padrão 10 tentativas reais/hora |

Sem chave/modelo, o aplicativo continua funcionando. Mostra geração pendente, permite copiar prompts e enviar PNG/JPEG/WebP de até 10 MB. Os arquivos são servidos por rota local com nomes controlados e validação de assinatura/MIME. Imagens não ficam em pasta pública.

## Provedor de imagens

O contrato `ImageProvider` está desacoplado em `lib/providers.ts`. O adaptador OpenAI chama `POST https://api.openai.com/v1/images/generations`, com modelo configurável e resultado base64 PNG. A chave é digitada em campo protegido e enviada ao servidor; não é devolvida ao cliente, gravada nos projetos ou exportada. No modo local fica na memória; no cloud é criptografada por conta com AES-256-GCM. Timeout de 180 segundos, exclusão de chamadas simultâneas para a mesma imagem e limite local de uso.

Fluxo: revisar texto técnico → marcar revisão → salvar → gerar uma imagem → conferir visualmente → marcar revisão visual. Uma imagem é vinculada à versão e aos nós; alterar arquitetura não apaga imagens anteriores. A geração ou upload cria um novo arquivo. Arquivos substituídos/excluídos podem permanecer na pasta de dados até limpeza manual; mantenha política de retenção antes de uso com clientes reais.

Referência consultada em 22/10/2026: [OpenAI — Create image](https://developers.openai.com/api/reference/resources/images/methods/generate). O modelo padrão no exemplo é configurável e não implica disponibilidade na conta. Não foi feita chamada paga durante a implementação por ausência de credencial configurada.

O conteúdo técnico fica separado e copiável. A composição visual de IA não garante textos exatos; imagens são representações ilustrativas e exigem revisão. O editor estruturado complementa as imagens, sem fingir substituí-las. O projeto de demonstração começa com geração pendente, sem capturas oficiais inventadas.

## Como usar

1. Abra Projetos e crie um rascunho, ou explore o demonstrativo.
2. Salve o diagnóstico e revise a recomendação por regras.
3. Monte a arquitetura e preencha configurações verificadas na documentação da plataforma; salve.
4. Em Imagens guiadas, revise instruções e prompt por etapa. Configure o provedor ou envie imagens manuais.
5. No Tutorial, marque etapas concluídas e salve para retomar.
6. Registre testes manuais com resultado observado e responsável. Simulado não equivale a teste em plataforma.
7. Ajuste horas, custo, margem, escopo e condições na Precificação.
8. Exporte o pacote de documentação dos dados salvos. O arquivo reflete o último salvamento, não rascunhos ainda abertos.

Salve antes de trocar de aba ou rota. As ações exibem confirmação ou erro. Em conflito de revisão, recarregue e reaplique o rascunho. Não há salvamento automático de campos ainda não confirmados.

## Segurança e diferenças para produção

O modo local é de usuário único e só aceita localhost. O modo Supabase oferece login e isolamento por UUID externo no banco; os rótulos local-user internos do documento não concedem acesso. O servidor verifica a sessão e a lista de e-mails autorizados. Não há cadastro público no aplicativo. Produção falha com 503 se usar arquivos locais sem a opção explícita de desenvolvimento. Veja DEPLOY.md para configuração.

Para produção permanecem necessários: autenticação, autorização por usuário/organização, banco transacional com migrations, políticas de acesso aos arquivos, armazenamento privado, gestão de segredos, quotas duráveis, fila de geração, backup/retencão e auditoria operacional. Credenciais de terceiros não são coletadas. Não alegamos isolamento multiusuário nesta versão.

Chamadas ao provedor só ocorrem por ação explícita, com dados técnicos do projeto enviado à API. Não coloque segredos nos campos, prompts ou imagens. A configuração não valida saldo, permissão ou modelo até uma chamada real.

## Limitações conhecidas

- Não executa automações ManyChat, Instagram, n8n ou agendas. Estado “Implantado” é um registro manual, não uma conexão.
- Diagnóstico funciona por regras. Os dois agentes de segurança usam a Responses API quando solicitados e configurados; outros contratos de IA textual ainda não foram implementados. Não há pesquisa automática em documentação de plataformas.
- Instruções iniciais são modelos editáveis; menus e campos específicos precisam ser confirmados antes da implementação real.
- Sem geração de lote/fila persistente; cada imagem é gerada separadamente. Reinício do processo limpa limites de uso em memória.
- Sem alertas fora do aplicativo; manutenção não é monitoramento de serviços externos.
- Sem sincronização ou instalação de skills no GitHub/Codex; a biblioteca é local.
- Galeria oferece ampliação/apresentação básica. Auditoria formal de acessibilidade e testes reais em dispositivos físicos permanecem recomendados.
- Backups são manuais da pasta `data`; exportar projeto não exporta todas as bibliotecas globais, que possuem exportação própria.

## Verificação

Os testes de domínio cobrem consistência de referências, números duplicados, versões, preservação/invalidação de materiais, cálculo de preço, evidência para aprovação, sequência idempotente e exportação. Testes HTTP e browser, quando executados, são registrados em `VALIDACAO.md` com seus limites. Nenhum teste local comprova funcionamento de contas externas.

Com o servidor ativo, execute `npm run test:integration` para validar HTTP. Use `STUDIO_TEST_URL` para escolher outra porta. Os testes criam registros temporários identificados como QA e os removem ao terminar; use uma instância de teste com `STUDIO_DATA_DIR` separado.

O teste opcional `node tests/browser.integration.mjs` requer Playwright e um navegador. Instale-os em um ambiente de testes (`npm install --no-save playwright` e `npx playwright install chromium`) ou informe `STUDIO_PLAYWRIGHT_MODULE` com o caminho de um módulo Playwright existente e `STUDIO_BROWSER_EXECUTABLE` com um Chrome/Edge instalado. Ele usa perfil temporário, verifica desktop e viewport de 390 px, e não acessa o perfil pessoal do navegador. `STUDIO_SCREENSHOT_DIR` ativa capturas de QA.

Os scripts de desenvolvimento e build usam Webpack para evitar a criação de junctions exigida pelo Turbopack em alguns ambientes Windows restritos.

