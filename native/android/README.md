# Recursos Android do Meu Agro

Esta pasta é a fonte dos recursos nativos aplicados por:

```bash
node scripts/android-apply-config.mjs
```

Não edite apenas os arquivos dentro de `android/app/src/main/res`, porque uma
recriação da plataforma pode sobrescrevê-los.

Edite os arquivos desta pasta e execute:

```bash
npm run android:sync
```

Recursos incluídos:

```text
ícone adaptativo
ícones legados
splash
ícone de notificação
cores
tema Android
```
