/* Optional: requires Playwright and Chromium, or STUDIO_BROWSER_EXECUTABLE. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const loadModule = createRequire(import.meta.url);
const { chromium } = loadModule(process.env.STUDIO_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:3000';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.STUDIO_BROWSER_EXECUTABLE || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let projectId;
  const checks = [];
  const apiSave = async (name) => {
    const response = page.waitForResponse(r => r.url().endsWith('/api/mutate') && r.request().method() === 'POST');
    await page.getByRole('button', { name, exact: true }).click();
    const result = await response;
    assert.equal(result.status(), 200, await result.text());
    return result.json();
  };
  const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Unexpected horizontal overflow');
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /Seu próximo fluxo começa aqui/ }).waitFor();
    await page.getByRole('button',{name:'Somente necessários',exact:true}).click();
    checks.push('Dashboard desktop rendered');
    await page.keyboard.press('Tab');
    await page.goto(base+'/settings');
    await page.getByLabel('OpenAI API key',{exact:true}).fill('sk-qa-not-a-real-key-00000000000000');
    const configure=page.waitForResponse(r=>r.url().endsWith('/api/provider')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'Configurar API',exact:true}).click();
    assert.equal((await configure).status(),200);
    await page.getByRole('button',{name:'Remover chave',exact:true}).waitFor();
    assert.equal(await page.getByLabel('OpenAI API key',{exact:true}).inputValue(),'');
    const remove=page.waitForResponse(r=>r.url().endsWith('/api/provider')&&r.request().method()==='DELETE');
    await page.getByRole('button',{name:'Remover chave',exact:true}).click();
    assert.equal((await remove).status(),200);
    checks.push('API key configured and removed through UI without echoing secret');
    await page.goto(base + '/projects/new');
    await page.getByLabel('Nome do projeto', { exact: true }).fill('QA navegador · descartável');
    await apiSave('Criar projeto');
    await page.waitForURL(/\/diagnosis$/);
    projectId = new URL(page.url()).pathname.split('/')[2];
    await page.getByLabel('Problema comercial', { exact: true }).fill('Organizar o atendimento');
    await page.getByLabel('Canal de entrada', { exact: true }).fill('Instagram');
    await apiSave('Salvar diagnóstico');
    await page.reload();
    assert.equal(await page.getByLabel('Problema comercial', { exact: true }).inputValue(), 'Organizar o atendimento');
    checks.push('Create, save and reopen diagnosis');

    await page.goto(`${base}/projects/${projectId}/architecture`);
    await page.getByRole('button', { name: 'Adicionar nó', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill('Entrada QA');
    await page.getByLabel('Tipo', { exact: true }).selectOption('Gatilho');
    await page.getByRole('button', { name: 'Adicionar nó', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill('Equipe QA');
    await page.getByLabel('Tipo', { exact: true }).selectOption('Humano');
    await page.getByLabel('Origem', { exact: true }).selectOption({ label: '1 · Entrada QA' });
    await page.getByLabel('Destino', { exact: true }).selectOption({ label: '2 · Equipe QA' });
    await page.getByRole('button', { name: 'Conectar', exact: true }).click();
    await apiSave('Salvar arquitetura');
    await page.reload();
    await page.getByLabel('Selecionar nó').waitFor();
    assert.equal(await page.getByLabel('Selecionar nó').locator('option').count(), 3);
    const stored = await (await page.request.get(base + '/api/state')).json();
    const savedVersion = stored.db.projects.find(p => p.id === projectId).automation.version;
    const unchanged = await apiSave('Salvar arquitetura');
    assert.equal(unchanged.db.projects.find(p => p.id === projectId).automation.version, savedVersion);
    checks.push('Add and connect nodes; saved architecture reopens');

    await page.goto(`${base}/projects/${projectId}/guided-images`);
    await page.getByText('Uma imagem para ensinar esta etapa', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Gerar imagem', exact: true }).isDisabled(), true);
    checks.push('Missing credentials shown as pending; no fake generation');
    await page.getByRole('button',{name:'Ampliar',exact:true}).click();
    await page.getByRole('dialog',{name:'Apresentação da imagem'}).waitFor();
    for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.ok(await page.getByRole('dialog').evaluate(dialog=>dialog.contains(document.activeElement)));}
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state:'hidden'});
    checks.push('Presentation keyboard focus stays in dialog and Escape closes it');

    await page.goto(`${base}/projects/${projectId}/tutorial`);
    await page.getByLabel(/Etapa concluída manualmente/).check();
    await page.getByRole('button', { name: 'Próxima', exact: true }).click();
    await apiSave('Salvar progresso');
    await page.reload();
    await page.getByRole('heading', { name: 'Um passo de cada vez.' }).waitFor();
    assert.ok((await page.locator('.sequence-item.selected').innerText()).includes('Preparar contas'));
    checks.push('Tutorial completion and position persist');

    await page.goto(`${base}/projects/${projectId}/tests`);
    await page.getByRole('button', { name: 'Cenário', exact: true }).click();
    await page.getByLabel('Cenário', { exact: true }).fill('Encaminhar para a equipe');
    await page.getByLabel('Resultado esperado', { exact: true }).fill('Pessoa responsável recebe o contato');
    await apiSave('Salvar testes');
    await page.reload();
    await page.locator('summary').getByText('Encaminhar para a equipe', { exact: true }).waitFor();
    checks.push('Test scenario saved and reopened');

    await page.goto(`${base}/projects/${projectId}/pricing`);
    await page.getByLabel('Preço de implantação (R$)', { exact: true }).fill('850');
    await apiSave('Salvar estimativa');
    await page.reload();
    assert.equal(await page.getByLabel('Preço de implantação (R$)', { exact: true }).inputValue(), '850');
    checks.push('Pricing edits persist');
    await page.goto(`${base}/projects/${projectId}/security`);
    await page.getByLabel('Escopo autorizado',{exact:true}).fill('Revisão do projeto de teste, sem execução externa');
    await page.getByLabel('Responsável e referência da autorização',{exact:true}).fill('QA automatizado — ambiente de teste');
    await page.getByLabel('Credenciais fora de nós, imagens e logs',{exact:true}).check();
    await apiSave('Salvar revisão manual');
    await page.reload();
    assert.equal(await page.getByLabel('Credenciais fora de nós, imagens e logs',{exact:true}).isChecked(),true);
    checks.push('Security agent profiles and manual review persist without fake AI result');
    for(const route of ['privacy','terms','refund','cookies','accessibility','rights']){await page.goto(`${base}/legal/${route}`);await page.getByText('Rascunho para revisão',{exact:true}).waitFor();}
    checks.push('Privacy, terms, refund, cookies, accessibility and subject-rights pages render');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/dashboard');
    await page.getByRole('heading', { name: /Seu próximo fluxo começa aqui/ }).waitFor();
    await noOverflow();
    await page.getByRole('button', { name: 'Abrir navegação' }).click();
    await page.getByRole('link', { name: /^Projetos/ }).first().click();
    await page.waitForURL('**/projects');
    await noOverflow();
    checks.push('390px mobile dashboard and navigation');
    for (const route of ['architecture', 'guided-images', 'tutorial']) {
      await page.goto(`${base}/projects/${projectId}/${route}`, { waitUntil: 'networkidle' });
      await noOverflow();
      checks.push('Mobile ' + route + ' without horizontal overflow');
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: checks, pageErrors: errors }, null, 2));
    if (process.env.STUDIO_SCREENSHOT_DIR) {
      await fs.mkdir(process.env.STUDIO_SCREENSHOT_DIR, { recursive: true });
      await page.goto(base + '/dashboard', { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(process.env.STUDIO_SCREENSHOT_DIR, 'mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: path.join(process.env.STUDIO_SCREENSHOT_DIR, 'desktop.png'), fullPage: true });
    }
  } catch (error) {
    console.error('Browser URL:',page.url());
    console.error('Page content:',(await page.locator('body').innerText()).slice(0,14000));
    console.error('Page errors:',errors);
    if(process.env.STUDIO_SCREENSHOT_DIR){await fs.mkdir(process.env.STUDIO_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.STUDIO_SCREENSHOT_DIR,'failure.png'),fullPage:true});}
    throw error;
  } finally {
    if (projectId) {
      const db = await (await page.request.get(base + '/api/state')).json();
      await page.request.post(base + '/api/mutate', { data: { revision: db.db.revision, command: { type: 'deleteProject', projectId } } });
    }
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
