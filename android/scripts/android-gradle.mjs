import {
  existsSync,
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

const androidDir =
  join(
    rootDir,
    'android',
  );

const task =
  process.argv[2];

if (!task) {
  console.error(
    'Informe uma tarefa Gradle, por exemplo: assembleDebug ou bundleRelease.',
  );

  process.exit(1);
}

const executable =
  process.platform ===
    'win32'
    ? 'gradlew.bat'
    : './gradlew';

const absoluteExecutable =
  join(
    androidDir,
    process.platform ===
      'win32'
      ? 'gradlew.bat'
      : 'gradlew',
  );

if (
  !existsSync(
    absoluteExecutable,
  )
) {
  console.error(
    'Gradle Wrapper não encontrado. Execute "npm run android:setup" primeiro.',
  );

  process.exit(1);
}

let command =
  executable;

let args = [
  task,
];

if (
  process.platform ===
    'win32'
) {
  command =
    process.env.ComSpec ||
    'C:\\Windows\\System32\\cmd.exe';

  args = [
    '/d',
    '/s',
    '/c',
    `gradlew.bat ${task}`,
  ];
}

const result =
  spawnSync(
    command,
    args,
    {
      cwd:
        androidDir,
      stdio:
        'inherit',
      shell:
        false,
    },
  );

if (result.error) {
  console.error(
    `Não foi possível iniciar o Gradle: ${result.error.message}`,
  );

  process.exit(1);
}

process.exit(
  result.status ?? 1,
);
