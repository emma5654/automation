# Gemini nos agentes — 25/10/2026
O cofre permite ativar OpenAI ou Gemini para os agentes de texto. Diagnóstico e segurança usam o provedor selecionado, com respostas estruturadas validadas pelo aplicativo.
A chave já cadastrada permanece criptografada e não precisa ser reenviada. Registros Gemini antigos com modelo OpenAI padrão usam gemini-3.5-flash-lite como modelo de texto compatível. O modelo pode ser definido no formulário ao cadastrar ou substituir uma chave.
A geração de imagens permanece OpenAI. Selecionar Gemini não habilita imagens nem envia a chave Google à OpenAI.
A interface identifica o provedor antes do envio do diagnóstico. Aplicam-se quotas, cobrança, disponibilidade e condições de dados do Google conforme o plano da conta; não há promessa de uso gratuito ilimitado.
Referências: https://ai.google.dev/gemini-api/docs/models e https://ai.google.dev/gemini-api/docs/generate-content/structured-output?hl=en .
Validação: TypeScript e testes simulados de OpenAI/Gemini, isolamento da chave por provedor e tratamento de quota/autorização/serviço desativado.

