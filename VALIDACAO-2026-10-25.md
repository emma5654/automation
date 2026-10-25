# Verificação de produção — 25/10/2026

Publicados: cofre de múltiplas chaves, agente de entendimento/fluxos por cliente, tabela editável com implantação e manutenção mensal e dois indicadores por cliente.

Validação real no endereço principal:
- Login e cookies HttpOnly: aprovados.
- Estado autenticado e tabela de preços: aprovados.
- Dois registros fictícios de API key salvos no cofre; nenhuma chave retornada na listagem; acesso anônimo recusado com 401.
- Estimativa mensal e horas de suporte gravadas em projeto fictício.
- Token exclusivo de monitor criado; GET de configuração não devolveu token.
- Evento degraded enviado ao receptor Supabase e semáforo de saúde retornou amarelo, separado do indicador de projeto.
- Aplicar proposta inexistente retorna 409.
- Rotas Configurações, Preços, Clientes e Diagnóstico: HTTP 200.
- Fixtures de projeto, cliente, credenciais e monitor removidas ao terminar.
- 24 testes unitários, três testes de integração HTTP e teste do adaptador de IA com transporte simulado aprovados.
- Build de produção aprovado.

Não foi feita geração paga de um plano com a chave real. A geração real usa o modelo habilitado na conta do provedor e deve ser conferida pelo responsável. O webhook foi testado com evento fictício; uma automação real só terá sua saúde acompanhada após conectar a fonte do cliente.

Supabase Security Advisors apontou a configuração preexistente de proteção contra senhas vazadas desativada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Nenhum alerta de RLS das tabelas novas foi retornado.

O registro histórico PUBLICACAO.md descreve a primeira publicação em 24/10. A conta autorizada já foi criada e o login real foi validado; as instruções antigas de primeiro cadastro não são mais uma pendência. O vínculo automático GitHub–Vercel continua dependendo da conexão GitHub na conta Vercel. Esta atualização foi publicada por API com o commit correspondente.

