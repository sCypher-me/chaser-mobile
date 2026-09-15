# Chaser Mobile

Companion comunitário não oficial para Grand Chase Mobile. A mesma aplicação React/Vite funciona como web, PWA e aplicativo Android via Capacitor. A planilha original é somente fonte de importação e não é alterada.

## Requisitos

- Node.js 22+
- pnpm 10+ (ou Corepack)
- Para Android: JDK 21 e Android Studio/SDK. Os scripts procuram automaticamente o JDK em `.jdks` e no Android Studio.

## Desenvolvimento (Windows)

```powershell
pnpm install
pnpm import:data
pnpm validate:data
pnpm dev
```

Abra `http://localhost:5173`. Para atualizar o conteúdo, substitua **sem renomear** `GCDC Meta Spreadsheet.xlsx`, execute novamente `pnpm import:data` e revise `reports/import-report.md`. A importação também recria os ícones oficiais incorporados à planilha e a camada de tradução pt-BR.

## Qualidade e build web

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

O build estático fica em `dist/`. O projeto inclui fallback SPA para Vercel; em outros hosts, direcione rotas desconhecidas para `index.html`. Para publicar a base separadamente, hospede `public/data` e configure `VITE_CONTENT_BASE_URL` conforme `.env.example`.

## Android / APK debug

```powershell
pnpm build
pnpm android:sync
pnpm android:apk
```

Saída: `android\app\build\outputs\apk\debug\app-debug.apk`.

## AAB e release assinado

Crie um keystore fora do repositório e configure a assinatura no Gradle usando variáveis de ambiente/`gradle.properties` local. Nunca versione senha ou keystore. Depois:

```powershell
pnpm android:aab
```

Saída esperada: `android\app\build\outputs\bundle\release\app-release.aab`.

## Dados pessoais e offline

Meu Box e preferências usam IndexedDB. O app inclui os JSONs gerados no bundle, cache de PWA e exportação local dos dados pessoais. O aplicativo é não oficial; GrandChase e suas propriedades pertencem aos respectivos detentores de direitos.
