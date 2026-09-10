import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';

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

const appDir =
  join(
    androidDir,
    'app',
  );

const mainDir =
  join(
    appDir,
    'src',
    'main',
  );

const resDir =
  join(
    mainDir,
    'res',
  );

const manifestPath =
  join(
    mainDir,
    'AndroidManifest.xml',
  );

const appBuildGradlePath =
  join(
    appDir,
    'build.gradle',
  );

const variablesGradlePath =
  join(
    androidDir,
    'variables.gradle',
  );

const signingGradlePath =
  join(
    androidDir,
    'meu-agro-signing.gradle',
  );

const stringsPath =
  join(
    resDir,
    'values',
    'strings.xml',
  );

const overlayRes =
  join(
    rootDir,
    'native',
    'android',
    'res',
  );

function requireAndroidProject() {
  if (
    !existsSync(
      manifestPath,
    ) ||
    !existsSync(
      appBuildGradlePath,
    )
  ) {
    throw new Error(
      'Projeto Android ainda não existe. Execute "npm run android:setup" primeiro.',
    );
  }
}

async function patchManifest() {
  let manifest =
    await readFile(
      manifestPath,
      'utf8',
    );

  manifest =
    manifest.replace(
      'android:allowBackup="true"',
      'android:allowBackup="false"',
    );


  manifest =
    manifest
      .replace(
        /android:icon="@mipmap\/[^"]+"/,
        'android:icon="@mipmap/ic_meu_agro"',
      )
      .replace(
        /android:roundIcon="@mipmap\/[^"]+"/,
        'android:roundIcon="@mipmap/ic_meu_agro_round"',
      );

  if (
    !manifest.includes(
      'android:usesCleartextTraffic=',
    )
  ) {
    manifest =
      manifest.replace(
        '<application\n',
        '<application\n        android:usesCleartextTraffic="false"\n',
      );
  }

  if (
    !manifest.includes(
      'android:windowSoftInputMode=',
    )
  ) {
    manifest =
      manifest.replace(
        'android:exported="true">',
        'android:exported="true"\n            android:windowSoftInputMode="adjustResize">',
      );
  }

  const permissions = [
    'android.permission.INTERNET',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.SCHEDULE_EXACT_ALARM',
  ];

  for (
    const permission
    of permissions
  ) {
    if (
      manifest.includes(
        permission,
      )
    ) {
      continue;
    }

    manifest =
      manifest.replace(
        '</manifest>',
        `    <uses-permission android:name="${permission}" />\n\n</manifest>`,
      );
  }

  if (
    !manifest.includes(
      'android:scheme="meuagro"',
    )
  ) {
    const launcherFilter =
`            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>`;

    const authFilter =
`${launcherFilter}

            <!-- Supabase Auth: confirmação de e-mail e recuperação de senha -->
            <intent-filter android:autoVerify="false">
                <action android:name="android.intent.action.VIEW" />

                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />

                <data
                    android:scheme="meuagro"
                    android:host="auth"
                />
            </intent-filter>`;

    if (
      manifest.includes(
        launcherFilter,
      )
    ) {
      manifest =
        manifest.replace(
          launcherFilter,
          authFilter,
        );
    } else {
      throw new Error(
        'Não foi possível localizar o intent-filter do launcher para inserir o deep link de autenticação.',
      );
    }
  }

  await writeFile(
    manifestPath,
    manifest,
    'utf8',
  );
}

async function patchAppBuildGradle() {
  let gradle =
    await readFile(
      appBuildGradlePath,
      'utf8',
    );

  gradle =
    gradle.replace(
      /namespace\s*=\s*["'][^"']+["']/,
      'namespace = "com.meuagro.app"',
    );

  gradle =
    gradle.replace(
      /applicationId\s+["'][^"']+["']/,
      'applicationId "com.meuagro.app"',
    );

  gradle =
    gradle.replace(
      /versionCode\s+\d+/,
      'versionCode 18',
    );

  gradle =
    gradle.replace(
      /versionName\s+["'][^"']+["']/,
      'versionName "0.17.4"',
    );

  await writeFile(
    appBuildGradlePath,
    gradle,
    'utf8',
  );
}

async function writeVariablesGradle() {
  const content =
`ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
    androidxActivityVersion = '1.11.0'
    androidxAppCompatVersion = '1.7.1'
    androidxCoordinatorLayoutVersion = '1.3.0'
    androidxCoreVersion = '1.17.0'
    androidxFragmentVersion = '1.8.9'
    coreSplashScreenVersion = '1.2.0'
    androidxWebkitVersion = '1.14.0'
    androidxExifInterfaceVersion = '1.4.1'
    androidxMaterialVersion = '1.13.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.3.0'
    androidxEspressoCoreVersion = '3.7.0'
    cordovaAndroidVersion = '14.0.1'
}
`;

  await writeFile(
    variablesGradlePath,
    content,
    'utf8',
  );
}

async function writeStrings() {
  await mkdir(
    dirname(
      stringsPath,
    ),
    {
      recursive: true,
    },
  );

  const content =
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Meu Agro</string>
    <string name="title_activity_main">Meu Agro</string>
    <string name="package_name">com.meuagro.app</string>
    <string name="custom_url_scheme">meuagro</string>
</resources>
`;

  await writeFile(
    stringsPath,
    content,
    'utf8',
  );
}


async function writeSigningGradle() {
  const content =
`def meuAgroKeystorePath = System.getenv('MEU_AGRO_KEYSTORE_PATH')
def meuAgroKeystorePassword = System.getenv('MEU_AGRO_KEYSTORE_PASSWORD')
def meuAgroKeyAlias = System.getenv('MEU_AGRO_KEY_ALIAS')
def meuAgroKeyPassword = System.getenv('MEU_AGRO_KEY_PASSWORD')

if (
    meuAgroKeystorePath &&
    meuAgroKeystorePassword &&
    meuAgroKeyAlias &&
    meuAgroKeyPassword
) {
    android {
        signingConfigs {
            meuAgroRelease {
                storeFile file(meuAgroKeystorePath)
                storePassword meuAgroKeystorePassword
                keyAlias meuAgroKeyAlias
                keyPassword meuAgroKeyPassword
            }
        }

        buildTypes {
            release {
                signingConfig signingConfigs.meuAgroRelease
            }
        }
    }

    logger.lifecycle('Meu Agro: assinatura release configurada por variáveis de ambiente.')
} else {
    logger.lifecycle('Meu Agro: assinatura release não configurada; bundleRelease será gerado sem assinatura.')
}
`;

  await writeFile(
    signingGradlePath,
    content,
    'utf8',
  );

  let appGradle =
    await readFile(
      appBuildGradlePath,
      'utf8',
    );

  const applyLine =
    "apply from: '../meu-agro-signing.gradle'";

  if (
    !appGradle.includes(
      applyLine,
    )
  ) {
    appGradle =
      `${appGradle.trim()}\n\n${applyLine}\n`;

    await writeFile(
      appBuildGradlePath,
      appGradle,
      'utf8',
    );
  }
}


async function removeCapacitorResourceConflicts() {
  /*
   * O template Android do Capacitor já cria alguns recursos com os
   * mesmos nomes que o Meu Agro personaliza.
   *
   * Android identifica recursos pelo nome lógico, não pela extensão.
   * Portanto:
   *
   *   drawable/splash.png
   *   drawable/splash.xml
   *
   * são ambos @drawable/splash e não podem coexistir no mesmo
   * conjunto de qualifiers.
   *
   * Da mesma forma, o template cria:
   *
   *   values/ic_launcher_background.xml
   *
   * e o Meu Agro define a cor ic_launcher_background em colors.xml.
   */
  const launcherBackgroundFile =
    join(
      resDir,
      'values',
      'ic_launcher_background.xml',
    );

  await rm(
    launcherBackgroundFile,
    {
      force: true,
    },
  );


  // O template do Capacitor possui um foreground do robô Android em
  // drawable-v24. Em aparelhos modernos esse qualifier tem prioridade
  // sobre drawable/ e fazia o launcher continuar exibindo o ícone padrão.
  await rm(
    join(
      resDir,
      'drawable-v24',
      'ic_launcher_foreground.xml',
    ),
    {
      force: true,
    },
  );

  async function removeLegacySplashFiles(
    directory,
  ) {
    if (
      !existsSync(
        directory,
      )
    ) {
      return;
    }

    const entries =
      await readdir(
        directory,
        {
          withFileTypes: true,
        },
      );

    for (
      const entry
      of entries
    ) {
      const fullPath =
        join(
          directory,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        await removeLegacySplashFiles(
          fullPath,
        );

        continue;
      }

      if (
        /^splash\.(png|webp|jpg|jpeg)$/i.test(
          entry.name,
        )
      ) {
        await rm(
          fullPath,
          {
            force: true,
          },
        );
      }
    }
  }

  await removeLegacySplashFiles(
    resDir,
  );

  console.log(
    '✓ Recursos padrão conflitantes do Capacitor removidos.',
  );
}

async function copyNativeResources() {
  if (
    !existsSync(
      overlayRes,
    )
  ) {
    throw new Error(
      'Pasta native/android/res não encontrada.',
    );
  }

  await mkdir(
    resDir,
    {
      recursive: true,
    },
  );

  await cp(
    overlayRes,
    resDir,
    {
      recursive: true,
      force: true,
    },
  );
}

async function main() {
  requireAndroidProject();

  await patchManifest();
  await patchAppBuildGradle();
  await writeVariablesGradle();
  await writeStrings();
  await writeSigningGradle();
  await removeCapacitorResourceConflicts();
  await copyNativeResources();

  console.log(
    '✓ Configuração nativa do Meu Agro aplicada ao projeto Android.',
  );

  console.log(
    '  - applicationId: com.meuagro.app',
  );

  console.log(
    '  - deep link: meuagro://auth/*',
  );

  console.log(
    '  - notificações locais e alarmes exatos configurados',
  );

  console.log(
    '  - ícone, splash e status icon aplicados',
  );
}

main().catch(
  (error) => {
    console.error(
      `\nErro ao aplicar configuração Android:\n${error.message}\n`,
    );

    process.exitCode = 1;
  },
);
