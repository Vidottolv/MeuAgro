import {
  existsSync,
  readFileSync,
} from 'node:fs';

import {
  dirname,
  join,
  resolve,
} from 'node:path';

import {
  fileURLToPath,
} from 'node:url';

import {
  spawnSync,
} from 'node:child_process';

const scriptDir =
  dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const rootDir =
  resolve(
    scriptDir,
    '..',
  );

const checks = [];

function add(
  ok,
  title,
  detail,
  {
    warning = false,
  } = {},
) {
  checks.push({
    ok,
    title,
    detail,
    warning,
  });
}

function commandOutput(
  command,
  args = [],
) {
  const result =
    spawnSync(
      command,
      args,
      {
        encoding:
          'utf8',
        shell:
          false,
      },
    );

  return {
    ok:
      result.status === 0,
    output:
      (
        result.stdout ||
        result.stderr ||
        ''
      ).trim(),
  };
}

function firstExisting(
  candidates,
) {
  return candidates.find(
    (candidate) =>
      candidate &&
      existsSync(candidate),
  ) || null;
}

const packageJson =
  JSON.parse(
    readFileSync(
      join(
        rootDir,
        'package.json',
      ),
      'utf8',
    ),
  );

const nodeMajor =
  Number(
    process.versions.node
      .split('.')[0],
  );

add(
  nodeMajor >= 22,
  'Node.js',
  process.version,
);

/* ------------------------------------------------------------
   Java / JDK
   ------------------------------------------------------------ */

const javaCandidates = [];

if (
  process.env.JAVA_HOME
) {
  javaCandidates.push(
    join(
      process.env.JAVA_HOME,
      'bin',
      process.platform ===
        'win32'
        ? 'java.exe'
        : 'java',
    ),
  );
}

if (
  process.platform ===
    'win32'
) {
  javaCandidates.push(
    'C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java.exe',
    'C:\\Program Files\\Android\\Android Studio\\jre\\bin\\java.exe',
  );
}

const bundledJava =
  firstExisting(
    javaCandidates,
  );

const java =
  bundledJava
    ? commandOutput(
        bundledJava,
        [
          '-version',
        ],
      )
    : commandOutput(
        'java',
        [
          '-version',
        ],
      );

const javaText =
  (
    java.output ||
    'Java não encontrado no PATH, JAVA_HOME ou JBR padrão do Android Studio.'
  ).replace(
    /\r/g,
    '',
  );

const javaMatch =
  javaText.match(
    /version\s+"(\d+)/,
  );

const javaMajor =
  javaMatch
    ? Number(
        javaMatch[1],
      )
    : null;

const javaOk =
  Boolean(
    java.ok &&
    javaMajor &&
    javaMajor >= 21
  );

add(
  javaOk,
  'Java / JDK',
  javaOk
    ? `${
        javaText.split('\n')[0]
      }${
        bundledJava
          ? ` — ${bundledJava}`
          : ''
      }`
    : `${javaText.split('\n')[0]} — o Android Studio instala um JDK próprio; para builds pelo terminal, configure JAVA_HOME para a pasta jbr.`,
  {
    warning:
      !javaOk,
  },
);

/* ------------------------------------------------------------
   Arquivo .env
   ------------------------------------------------------------ */

const envExists =
  existsSync(
    join(
      rootDir,
      '.env',
    ),
  );

add(
  envExists,
  '.env',
  envExists
    ? 'Arquivo encontrado'
    : 'Copie .env.example para .env e informe as credenciais do Supabase.',
);

/* ------------------------------------------------------------
   Dependências npm
   ------------------------------------------------------------ */

const modulesExist =
  existsSync(
    join(
      rootDir,
      'node_modules',
      '@capacitor',
      'android',
    ),
  );

const cameraModuleExists =
  existsSync(
    join(
      rootDir,
      'node_modules',
      '@capacitor',
      'camera',
    ),
  );

add(
  modulesExist &&
  cameraModuleExists,
  'Dependências npm',
  modulesExist &&
  cameraModuleExists
    ? 'Capacitor Android e Camera encontrados'
    : 'Execute npm install para instalar também @capacitor/camera',
);

/* ------------------------------------------------------------
   Config Capacitor
   ------------------------------------------------------------ */

const capacitorJson =
  join(
    rootDir,
    'capacitor.config.json',
  );

const legacyJsConfig =
  join(
    rootDir,
    'capacitor.config.js',
  );

const configOk =
  existsSync(
    capacitorJson,
  ) &&
  !existsSync(
    legacyJsConfig,
  );

add(
  configOk,
  'Configuração Capacitor',
  configOk
    ? 'capacitor.config.json encontrado; compatível com package.json type=module'
    : 'Use capacitor.config.json e remova capacitor.config.js para evitar ERR_REQUIRE_ESM.',
);

/* ------------------------------------------------------------
   Projeto Android
   ------------------------------------------------------------ */

const androidExists =
  existsSync(
    join(
      rootDir,
      'android',
      'app',
      'src',
      'main',
      'AndroidManifest.xml',
    ),
  );

add(
  androidExists,
  'Projeto Android',
  androidExists
    ? 'android/ está configurado'
    : 'Execute npm run android:setup',
  {
    warning: true,
  },
);

/* ------------------------------------------------------------
   Android SDK
   ------------------------------------------------------------ */

const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
];

if (
  process.platform ===
    'win32' &&
  process.env.LOCALAPPDATA
) {
  sdkCandidates.push(
    join(
      process.env.LOCALAPPDATA,
      'Android',
      'Sdk',
    ),
  );
}

if (
  process.platform ===
    'darwin' &&
  process.env.HOME
) {
  sdkCandidates.push(
    join(
      process.env.HOME,
      'Library',
      'Android',
      'sdk',
    ),
  );
}

if (
  process.platform ===
    'linux' &&
  process.env.HOME
) {
  sdkCandidates.push(
    join(
      process.env.HOME,
      'Android',
      'Sdk',
    ),
  );
}

const androidSdk =
  firstExisting(
    sdkCandidates,
  );

add(
  Boolean(
    androidSdk,
  ),
  'Android SDK',
  androidSdk
    ? androidSdk
    : 'SDK não detectado. Abra Android Studio → Tools → SDK Manager e instale Android 16 / API 36.',
  {
    warning:
      !androidSdk,
  },
);

/* ------------------------------------------------------------
   Versões Capacitor
   ------------------------------------------------------------ */

add(
  packageJson.dependencies
    ?.['@capacitor/core'] ===
    '8.5.1' &&
  packageJson.dependencies
    ?.['@capacitor/android'] ===
    '8.5.1' &&
  packageJson.devDependencies
    ?.['@capacitor/cli'] ===
    '8.5.1',
  'Versões Capacitor',
  `core=${packageJson.dependencies?.['@capacitor/core']} android=${packageJson.dependencies?.['@capacitor/android']} cli=${packageJson.devDependencies?.['@capacitor/cli']}`,
);

console.log(
  '\nMeu Agro — Android Doctor\n',
);

let hasCriticalFailure =
  false;

for (
  const check
  of checks
) {
  const marker =
    check.ok
      ? '✓'
      : check.warning
        ? '!'
        : '✗';

  console.log(
    `${marker} ${check.title}: ${check.detail}`,
  );

  if (
    !check.ok &&
    !check.warning
  ) {
    hasCriticalFailure =
      true;
  }
}

console.log('');

if (hasCriticalFailure) {
  process.exitCode = 1;
}
