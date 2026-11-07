import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadEnv } from 'vite';
import { pwaBuildProblems } from './pwa-policy.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const command = process.argv[2];
  if (!['check', 'build'].includes(command)) throw Error('Use check ou build.');
  const env = { ...process.env, ...loadEnv('production', root, '') };
  const capacitor = JSON.parse(readFileSync(resolve(root, 'capacitor.config.json'), 'utf8'));
  const problems = pwaBuildProblems(env, capacitor);
  if (problems.length) throw Error(problems.join('\n'));
  console.log(
    'Ambiente público do PWA conferido. Isso não confirma publicação nem funcionamento no iPhone.',
  );
  if (command === 'build') {
    for (const args of [
      ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'],
      ['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'runner'],
    ]) {
      const result = spawnSync(process.execPath, args, {
        cwd: root,
        env,
        stdio: 'inherit',
        shell: false,
      });
      if (result.error || result.status !== 0)
        throw Error('Build interrompido. Confira a saída acima.');
    }
    console.log(
      'PWA gerado em dist/. Publique a pasta inteira na origem HTTPS configurada, com fallback de rotas SPA.',
    );
  }
} catch (error) {
  console.error('PWA não concluído:\n' + error.message);
  process.exitCode = 1;
}
