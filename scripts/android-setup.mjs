import {
  existsSync,
  rmSync,
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

const androidProjectFile =
  join(
    androidDir,
    'app',
    'build.gradle',
  );

const capacitorAndroid =
  join(
    rootDir,
    'node_modules',
    '@capacitor',
    'android',
  );

const capacitorCli =
  join(
    rootDir,
    'node_modules',
    '@capacitor',
    'cli',
  );

function windowsCommandLine(
  command,
  args,
) {
  return [
    command,
    ...args,
  ].join(' ');
}

function run(
  command,
  args,
) {
  console.log(
    `\n> ${command} ${args.join(' ')}\n`,
  );

  let executable =
    command;

  let commandArgs =
    args;

  if (
    process.platform ===
      'win32' &&
    [
      'npm',
      'npx',
    ].includes(command)
  ) {
    executable =
      process.env.ComSpec ||
      'C:\\Windows\\System32\\cmd.exe';

    commandArgs = [
      '/d',
      '/s',
      '/c',
      windowsCommandLine(
        command,
        args,
      ),
    ];
  } else if (
    command === 'node'
  ) {
    executable =
      process.execPath;
  }

  const result =
    spawnSync(
      executable,
      commandArgs,
      {
        cwd:
          rootDir,
        stdio:
          'inherit',
        env:
          process.env,
        shell:
          false,
      },
    );

  if (result.error) {
    throw new Error(
      `Não foi possível iniciar "${command}". ${result.error.message}`,
    );
  }

  if (
    result.status !== 0
  ) {
    throw new Error(
      `O comando "${command} ${args.join(' ')}" terminou com código ${result.status}.`,
    );
  }
}

function checkDependencies() {
  if (
    !existsSync(
      capacitorAndroid,
    ) ||
    !existsSync(
      capacitorCli,
    )
  ) {
    throw new Error(
      'Dependências do Capacitor ainda não estão instaladas. Execute "npm install" e rode este comando novamente.',
    );
  }
}

function main() {
  checkDependencies();

  run(
    'npm',
    [
      'run',
      'build',
    ],
  );

  if (
    !existsSync(
      androidProjectFile,
    )
  ) {
    if (
      existsSync(
        androidDir,
      )
    ) {
      console.log(
        '\n! Foi encontrada uma pasta android/ incompleta. Ela será recriada pelo Capacitor.\n',
      );

      rmSync(
        androidDir,
        {
          recursive: true,
          force: true,
        },
      );
    }

    run(
      'npx',
      [
        'cap',
        'add',
        'android',
      ],
    );
  } else {
    console.log(
      '\n✓ A plataforma Android já existe. O "cap add android" foi ignorado.\n',
    );
  }

  run(
    'npx',
    [
      'cap',
      'sync',
      'android',
    ],
  );

  run(
    'node',
    [
      'scripts/android-apply-config.mjs',
    ],
  );

  console.log(
    '\n✓ Etapa 24 configurada. Você já pode executar "npm run android:open".\n',
  );
}

try {
  main();
} catch (error) {
  console.error(
    `\nFalha ao preparar Android:\n${error.message}\n`,
  );

  process.exitCode = 1;
}
