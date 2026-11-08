import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { helpArticles, helpCategories, searchHelp } from '../src/modules/help/helpContent.js';

test('manual tem temas válidos, tópicos únicos e instruções com limites explícitos', () => {
  assert.equal(new Set(helpArticles.map((a) => a.id)).size, helpArticles.length);
  assert.ok(helpArticles.length >= 70);
  for (const category of helpCategories)
    assert.ok(helpArticles.some((a) => a.category === category.id));
  for (const article of helpArticles) {
    assert.ok(helpCategories.some((c) => c.id === article.category));
    assert.ok(article.steps.length >= 3 && article.notes.length >= 1, article.id);
    assert.match(article.route, /^\/(?!\/)/);
    assert.ok(!article.route.includes('javascript:'));
    assert.ok(['online', 'mixed'].includes(article.mode));
  }
});
test('busca ignora acentos, combina palavras e inclui notas, sem consultar a conta', () => {
  assert.ok(searchHelp('sincronizacao').some((a) => a.id === 'pendencias'));
  assert.ok(searchHelp('INTELIGÊNCIA artificial').some((a) => a.id === 'ia-visita'));
  assert.ok(searchHelp('HEIC').some((a) => a.id === 'fotos-safra'));
  assert.equal(
    searchHelp('NDVI', 'satelite').some((a) => a.id === 'ndvi'),
    true,
  );
  assert.equal(searchHelp('XYZsemresultado').length, 0);
  assert.equal(
    searchHelp('', 'visitas').every((a) => a.category === 'visitas'),
    true,
  );
});
test('atalhos do menu Mais têm documentação de uso', () => {
  const menu = readFileSync(
    new URL('../src/modules/account/MorePage.vue', import.meta.url),
    'utf8',
  );
  const routes = [...menu.matchAll(/href:\s*'([^']+)'/g)]
    .map((m) => m[1])
    .filter((r) => r !== '/more/help');
  const documented = new Set(helpArticles.map((a) => a.route.split(/[?#]/)[0]));
  for (const route of routes) assert.ok(documented.has(route), 'Sem ajuda: ' + route);
});
test('manifesto oferece máscara e dimensões reais, mantendo a identidade de instalação', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../native/pwa/manifest.webmanifest', import.meta.url)),
  );
  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/dashboard');
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL('../native/pwa' + icon.src, import.meta.url));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const icon = readFileSync(new URL('../native/assets/meu-agro-icon-512.png', import.meta.url));
  assert.deepEqual(
    icon,
    readFileSync(new URL('../native/pwa/icons/icon-512.png', import.meta.url)),
  );
});
test('Android tem recursos de todos os tamanhos e o novo foreground colorido', () => {
  for (const [density, size] of [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ]) {
    for (const name of ['ic_meu_agro', 'ic_meu_agro_round', 'ic_launcher', 'ic_launcher_round']) {
      const png = readFileSync(
        new URL(`../native/android/res/mipmap-${density}/${name}.png`, import.meta.url),
      );
      assert.equal(png.readUInt32BE(16), size);
      assert.equal(png.readUInt32BE(20), size);
    }
  }
  const vector = readFileSync(
    new URL('../native/android/res/drawable/ic_meu_agro_foreground.xml', import.meta.url),
    'utf8',
  );
  assert.match(vector, /#a5e448/);
  assert.match(vector, /#c98c63/);
});
