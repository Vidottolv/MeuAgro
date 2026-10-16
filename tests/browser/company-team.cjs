// Browser smoke test with a simulated backend. No real accounts or emails are used.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const assert = require('node:assert/strict');
const root = resolve(process.env.TEAM_TEST_DIST || 'dist');
const company = { id: '22222222-2222-4222-8222-222222222222', name: 'Agro Horizonte' };
const ownerId = '11111111-1111-4111-8111-111111111111';
const managerId = '33333333-3333-4333-8333-333333333333';
const representativeId = '44444444-4444-4444-8444-444444444444';
const server = createServer(async (req, res) => {
  try {
    let path = new URL(req.url, 'http://localhost').pathname;
    if (!extname(path)) path = '/index.html';
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const content = await readFile(file);
    res.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] || 'application/octet-stream' }); res.end(content);
  } catch { res.writeHead(404); res.end(); }
});
async function main() {
  await new Promise(done => server.listen(4182, '127.0.0.1', done));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE || undefined, headless: true });
  async function openAs(id) {
    const owner = id === ownerId, manager = id === managerId;
    const user = { id, aud: 'authenticated', role: 'authenticated', email: 'test@example.test', user_metadata: { full_name: owner ? 'Dono Teste' : 'Gerente Teste' } };
    const token = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: id, role: 'authenticated', exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url') + '.test';
    const session = { user, access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now()/1000) + 3600 };
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const members = [
      { id: 'member-1', user_id: representativeId, name: 'Ana Representante', active: true, role: 'representative', finance: owner ? false : null, customers: 3, joined_at: new Date().toISOString() },
      { id: 'member-2', user_id: managerId, name: 'Bruno Gerente', active: true, role: 'manager', finance: owner ? false : null, customers: 0, joined_at: new Date().toISOString() },
    ];
    const invitations = [], commands = [], errors = [];
    await context.route('http://127.0.0.1:54321/**', async route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 200, headers, body: '{}' });
      let result = [];
      if (path === '/auth/v1/user') result = user;
      else if (path.endsWith('/rpc/management_companies')) result = owner || manager ? [company] : [];
      else if (path.endsWith('/rpc/management_team')) result = { seller_id: company.id, owner, finance: owner, members, invitations };
      else if (path.endsWith('/rpc/management_team_command')) {
        const { p_action: action, p_data: data } = request.postDataJSON(); commands.push({ action, data });
        if (action === 'invite') invitations.push({ id: 'invitation-' + commands.length, email: data.email, role: data.role || 'representative', status: 'pending', token: 'TEST1234', expires_at: new Date(Date.now()+86400000).toISOString() });
        if (action === 'set_role') { const member = members.find(m => m.id === data.membership_id); member.role = data.role; member.finance = data.finance === 'true'; }
        if (action === 'remove_member') { const member = members.find(m => m.id === data.membership_id); member.active = false; member.ended_at = new Date().toISOString(); }
        result = { id: 'saved', seller_id: company.id };
      }
      await route.fulfill({ status: 200, headers, body: JSON.stringify(result) });
    });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(session => localStorage.setItem('sb-127-auth-token', JSON.stringify(session)), session);
    await page.goto('http://127.0.0.1:4182/consultor/equipe');
    return { page, context, commands, errors };
  }
  try {
    const owner = await openAs(ownerId), page = owner.page;
    await page.getByRole('heading', { name: 'Agro Horizonte', exact: true }).waitFor();
    await page.getByLabel('E-mail do convidado', { exact: true }).fill('novo-gerente@example.test');
    await page.getByLabel('Papel na empresa', { exact: true }).selectOption('manager');
    await page.getByLabel('Gerente pode consultar custos e comissões?', { exact: true }).selectOption('true');
    await page.getByRole('button', { name: 'Gerar convite', exact: true }).click();
    await page.getByRole('heading', { name: 'novo-gerente@example.test' }).waitFor();
    assert.equal(owner.commands[0].data.finance, 'true');
    const member = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Ana Representante', exact: true }) });
    await member.getByLabel('Papel de Ana Representante', { exact: true }).selectOption('manager');
    await member.getByLabel('Acesso a custos e comissões de Ana Representante', { exact: true }).selectOption('true');
    await member.getByRole('button', { name: 'Alterar permissões' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await member.getByText('Custos e comissões: Autorizados.', { exact: true }).waitFor();
    assert.equal(owner.commands[1].data.expected_role, 'representative');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: process.env.TEAM_TEST_SCREENSHOT || '../work/manager-team.png', fullPage: true });
    assert.deepEqual(owner.errors, []); await owner.context.close();
    console.log('PASS: owner invites managers and explicitly grants finance with confirmation');
    const manager = await openAs(managerId);
    await manager.page.getByRole('heading', { name: 'Convidar representante', exact: true }).waitFor();
    assert.equal(await manager.page.getByLabel('Papel na empresa', { exact: true }).count(), 0);
    assert.equal(await manager.page.getByRole('button', { name: 'Alterar permissões' }).count(), 0);
    assert.equal(await manager.page.getByRole('button', { name: 'Encerrar vínculo de Bruno Gerente', exact: true }).count(), 0);
    await manager.page.getByRole('button', { name: 'Encerrar vínculo de Ana Representante', exact: true }).click();
    await manager.page.getByRole('dialog').getByText(/redistribua-os pelo painel/).waitFor();
    await manager.page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await manager.page.getByText('Nenhum gerente ou representante vinculado.', { exact: false }).count();
    await manager.page.getByRole('button', { name: 'Encerrar vínculo de Ana Representante', exact: true }).waitFor({ state: 'detached' });
    assert.deepEqual(manager.errors, []); await manager.context.close();
    console.log('PASS: manager manages representatives and cannot change manager permissions');
    const representative = await openAs(representativeId);
    await representative.page.getByRole('heading', { name: 'Nenhuma empresa para administrar', exact: true }).waitFor();
    assert.equal(await representative.page.getByRole('button', { name: 'Gerar convite', exact: true }).count(), 0);
    assert.deepEqual(representative.errors, []); await representative.context.close();
    console.log('PASS: ordinary representative has no team administration screen');
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
