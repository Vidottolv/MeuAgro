import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import plist from 'plist';
import { loadEnv } from 'vite';
import {
  iosConfigurationProblems,
  configureIosInfoPlist,
  xcodeVersionSupported,
  iosBuildEnvironmentProblems,
} from './ios-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
const project = join(root, 'ios/App/App.xcodeproj/project.pbxproj');
const infoPath = join(root, 'ios/App/App/Info.plist');
const cli = join(root, 'node_modules/@capacitor/cli/bin/capacitor');
let commandEnv = process.env;
function execute(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    env: commandEnv,
    ...(capture ? { encoding: 'utf8' } : { stdio: 'inherit' }),
  });
  if (result.error || result.status !== 0)
    throw Error(`Falha ao executar ${command}. Confira a instalação e a saída do comando.`);
  return result.stdout || '';
}
const runNode = (args) => execute(process.execPath, args);
function checkNativeTools() {
  if (process.platform !== 'darwin')
    throw Error(
      'Para preparar, abrir e compilar o iOS, use um Mac com Xcode 26 ou superior. No Windows, use npm run ios:check para conferir a configuração compartilhada.',
    );
  execute('xcode-select', ['-p'], { capture: true });
  const version = execute('xcodebuild', ['-version'], { capture: true });
  if (!xcodeVersionSupported(version))
    throw Error(
      'Capacitor 8 exige Xcode 26 ou superior. Selecione a instalação correta em xcode-select.',
    );
  execute('swift', ['--version'], { capture: true });
}
function applyConfiguration(release, capacitor) {
  if (!existsSync(project) || !existsSync(infoPath))
    throw Error(
      'O projeto iOS ainda não existe ou está incompleto. Execute npm run ios:setup no Mac; uma pasta existente não será apagada.',
    );
  const current = plist.parse(readFileSync(infoPath, 'utf8'));
  const configured = configureIosInfoPlist(current, { release, appId: capacitor.appId });
  writeFileSync(infoPath, plist.build(configured) + '\n');
}
try {
  const command = process.argv[2] || 'check';
  if (!['check', 'doctor', 'setup', 'sync', 'open', 'run', 'config'].includes(command))
    throw Error('Comando iOS desconhecido. Use check, doctor, setup, sync, open, run ou config.');
  const release = readJson('native/ios/release.json');
  const capacitor = readJson('capacitor.config.json');
  const packages = readJson('package.json');
  const problems = iosConfigurationProblems({ release, capacitor, packages });
  if (Number(process.versions.node.split('.')[0]) < 22)
    problems.push('Use Node.js 22 ou superior.');
  if (!existsSync(join(root, 'node_modules/@capacitor/ios/package.json')))
    problems.push('Execute npm install para instalar a plataforma iOS.');
  if (problems.length) throw Error(problems.join('\n'));
  console.log(
    `Configuração compartilhada iOS conferida: ${release.versionName} (${release.buildNumber}). Isso não confirma compilação nem assinatura.`,
  );
  if (command !== 'check') {
    checkNativeTools();
    if (command === 'doctor') {
      console.log(
        `Ferramentas Apple disponíveis. Projeto nativo: ${existsSync(project) ? 'encontrado' : 'execute npm run ios:setup'}. Assinatura e execução em iPhone ainda precisam de validação no Xcode.`,
      );
    } else if (command === 'config') {
      applyConfiguration(release, capacitor);
    } else {
      if (command !== 'setup' && !existsSync(project))
        throw Error('Execute npm run ios:setup antes de sincronizar ou abrir o projeto.');
      if (command === 'setup' && existsSync(join(root, 'ios')) && !existsSync(project))
        throw Error(
          'A pasta ios existe, mas não contém um projeto completo. Revise ou recupere a pasta manualmente; nenhum arquivo foi apagado.',
        );
      commandEnv = { ...process.env, ...loadEnv('production', root, '') };
      const environmentProblems = iosBuildEnvironmentProblems(commandEnv);
      if (environmentProblems.length) throw Error(environmentProblems.join('\n'));
      runNode(['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit']);
      runNode(['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'runner']);
      if (!existsSync(project)) runNode([cli, 'add', 'ios']);
      applyConfiguration(release, capacitor);
      runNode([cli, 'sync', 'ios']);
      applyConfiguration(release, capacitor);
      if (command === 'open' || command === 'run') runNode([cli, command, 'ios']);
      console.log(
        'Projeto sincronizado. Confira Team, identificador, ícones e permissões no Xcode antes de distribuir.',
      );
    }
  }
} catch (error) {
  console.error(`iOS não concluído:\n${error.message}`);
  process.exitCode = 1;
}
