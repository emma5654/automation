# Validação da preparação para Vercel

**Atualização de 24/10/2026:** publicado em https://automation-studio-ai-carol-5fda.vercel.app. Código em https://github.com/emma5654/automation. Consulte [PUBLICACAO.md](PUBLICACAO.md) para os testes em produção, primeiro acesso e vínculo GitHub–Vercel ainda pendente.


Verificações feitas na preparação de 22–23/10/2026. O deploy público foi realizado posteriormente em 24/10/2026 e está documentado em PUBLICACAO.md.

## Resultados confirmados

- Build de produção: `npm run build`, Webpack, Next.js 16.4.2 — concluído, incluindo a rota pública `/public/legal/[kind]` e APIs de Auth, dados, imagens, exportação, IA e health.
- TypeScript estrito: verificação separada e verificação durante o build, sem erros.
- ESLint completo: aprovado. Depois da correção do modal, verificação específica dos dois arquivos alterados também aprovada.
- Testes unitários: suíte completa com 18 testes aprovada; após acrescentar a proteção de produção, os três testes de `deployment.test.ts` também passaram. Cobrem esquema, arquitetura/versionamento, preço, evidência, LGPD, consentimento, tracking, referências dos agentes, criptografia e proteção de Origin. O novo caso confirma que arquivos locais são bloqueados em produção por padrão.
- HTTP local contra build de produção: teste integrado aprovado, cobrindo CRUD, recarga, arquitetura/conexões, progresso, upload válido e inválido, ZIP, bibliotecas, revisão otimista e recebimento/remoção de API key fictícia sem ecoá-la nos dados.
- HTTP no modo cloud com configuração de QA fictícia: aprovado. APIs de dados, imagens, exportação, configurações e revisão exigem autenticação; alterações sem Origin correto falham; seis políticas públicas são acessíveis sem login. Esse teste não autentica um usuário real e não usa chave real de IA.
- Rota pública inválida `/public/legal/constructor`: devolve 404.
- Supabase remoto: três migrations aplicadas e verificadas no histórico. Dois buckets privados configurados.
- Teste SQL remoto com dois usuários sintéticos: isolamento de documento/cofre/imagens/ZIP, bloqueio de escrita entre contas e troca de proprietário, revisão otimista e quotas separadas aprovados. Tudo em transação com rollback; confirmado que não restaram contas de teste.
- Supabase Security Advisors: resultado final sem alertas (`lints: []`). Isso não equivale a auditoria completa ou certificação de segurança.
- `npm audit --omit=dev`: zero vulnerabilidades reportadas nas dependências de produção na consulta feita. A instalação reportou cinco avisos de alta severidade nas dependências de desenvolvimento; não foi aplicada atualização forçada com alterações potencialmente incompatíveis.

## Navegação e acessibilidade

O teste encontrou e levou à correção de uma saída de foco no modal de imagens. A implementação agora mantém Tab/Shift+Tab nos controles visíveis do modal, fecha com Escape e restaura o foco ao fechar. Um seletor ambíguo do próprio teste também foi corrigido.

A execução final do teste de navegação passou em 15 verificações: dashboard desktop; configuração/remoção de chave fictícia; diagnóstico salvo/reaberto; criação/conexão de nós; geração pendente sem credenciais; foco e Escape no modal; progresso/posição do tutorial; cenários e preços persistentes; revisão manual dos agentes; seis páginas legais; menu mobile e arquitetura/galeria/tutorial em 390 px sem overflow horizontal. Nenhum erro JavaScript foi registrado (`pageErrors: []`). Capturas desktop e mobile foram produzidas para revisão visual. Não há declaração de auditoria WCAG completa; tecnologia assistiva e revisão humana continuam necessárias.

## O que ainda depende da configuração real

- A conta `emarianelimafcm@gmail.com` ainda não existia no Supabase na última consulta. O e-mail foi colocado na configuração de exemplo de acesso autorizado. Senha deve ser criada diretamente no painel.
- Login real, renovação de sessão, uso de imagens/ZIP assinados com conta real e chamadas pagas à OpenAI precisam do teste final após configurar a conta. As políticas de isolamento foram verificadas diretamente no banco, mas isso não substitui esse teste de ponta a ponta.
- Nenhuma chave real foi usada nos testes automatizados. O aplicativo não comprova validade de API key ao salvar.
- Projeto, domínio, variáveis e build de produção na Vercel foram configurados posteriormente. A verificação de produção está em PUBLICACAO.md.
- Dockerfile foi preparado, mas a imagem Docker não foi construída ou executada neste ambiente.
- Dados locais não foram migrados. Identificação empresarial, canais públicos, revisão jurídica, retenção/expurgo, backups e consentimento durável continuam pendentes conforme DEPLOY.md.

Os servidores e dados de QA são separados dos dados normais. O aplicativo de uso local é restaurado em `http://127.0.0.1:3001` ao concluir a preparação.
