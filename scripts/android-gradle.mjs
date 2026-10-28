import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const android = join(root, 'android');
const task = process.argv[2],
  flags = process.argv.slice(3);
if (
  !['assembleDebug', 'assembleRelease', 'bundleRelease', 'clean', 'signingReport'].includes(task) ||
  flags.some((f) => f !== '--rerun-tasks')
) {
  console.error(
    'Use assembleDebug, assembleRelease, bundleRelease, clean ou signingReport; a única opção adicional aceita é --rerun-tasks.',
  );
  process.exit(1);
}
const windows = process.platform === 'win32';
if (!existsSync(join(android, windows ? 'gradlew.bat' : 'gradlew'))) {
  console.error('Gradle Wrapper não encontrado. Execute npm run android:setup.');
  process.exit(1);
}
// Somente tarefas e opções da lista acima entram na linha de comando do Windows.
const command = windows ? process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe' : './gradlew';
const args = windows
  ? ['/d', '/s', '/c', ['gradlew.bat', task, ...flags].join(' ')]
  : [task, ...flags];
const result = spawnSync(command, args, { cwd: android, stdio: 'inherit', shell: false });
if (result.error) console.error('Não foi possível iniciar o Gradle. Confira o Wrapper e o JDK.');
process.exit(result.status ?? 1);
