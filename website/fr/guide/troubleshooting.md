# Dépannage

Chaque entrée commence par ce que vous observez, puis la cause et la correction.

## Svelte : onMount ne s'exécute jamais, ou mount() lève lifecycle_function_unavailable {#svelte-onmount-never-runs-or-mount-throws-lifecycle-function-unavailable}

**Symptôme.** Un îlot Svelte se rend, mais les callbacks `onMount` ne se déclenchent jamais, ou `mount()` de Svelte 5 lève `lifecycle_function_unavailable`.

**Cause.** `svelte` fournit un runtime navigateur et un runtime serveur sous le même import. Votre bundle client a choisi celui du serveur. Certaines configurations SSR (Vinxi, environnements Vite personnalisés, Vitest dans jsdom) résolvent le client sans la condition d'export `browser`, et l'optimiseur de dépendances de Vite pré-empaquette alors le runtime serveur. Dans les devtools du navigateur, vous voyez `svelte/src/index-server.js` (Svelte 5) ou `svelte/src/runtime/ssr.js` (Svelte 4) au lieu du fichier client.

**Correction.** Remettez `browser` dans les conditions de résolution du client, puis redémarrez Vite avec `--force` pour qu'il reconstruise les dépendances optimisées :

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

Pour Vitest avec jsdom, ajoutez la condition et mettez Svelte en inline pour que Vite le résolve :

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

N'excluez pas `svelte` de `optimizeDeps` ; esbuild échoue alors avec « The entry point "svelte" cannot be marked as external ».

## Vue : l'alias ~ échoue dans les fichiers .vue {#vue-the-alias-fails-in-vue-files}

**Symptôme.** Le build de production échoue avec `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."`, alors que le même import fonctionne dans les fichiers `.ts` et que `import type` depuis `~/` fonctionne dans les fichiers `.vue`.

**Cause.** `vite-tsconfig-paths` applique les alias uniquement aux fichiers inclus par l'`include` de son tsconfig. Un tsconfig qui inclut `**/*.ts` et `**/*.tsx` laisse de côté les fichiers `.vue`. Les imports de type seul sont effacés avant la résolution, donc ils n'échouent jamais.

**Correction.** Incluez les fichiers `.vue` dans ce tsconfig :

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

ou déclarez l'alias dans Vite lui-même :

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Utilisez l'extension d'éditeur Vue - Official (Volar). Vetur ne comprend pas les macros de `<script setup>` ni `moduleResolution: "Bundler"`.

## Angular 15-17 : les clics ne mettent pas à jour la vue {#angular-15-17-clicks-do-not-update-the-view}

**Symptôme.** Un îlot Angular se rend, mais un handler de bouton modifie un champ et le template ne se met pas à jour.

**Cause.** L'adaptateur exécute Angular sans zone.js. Angular 18+ planifie la détection de changements lui-même en mode sans zone ; sous 15-17, l'adaptateur remplace `NgZone` par une zone sans effet, et rien ne lance la détection de changements après les événements DOM.

**Correction.** Appelez `detectChanges()` après la modification :

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

Ou importez `zone.js` en haut de votre entrée client et passez `zone: true` à `createAngularMicroApp`. Gardez zone.js hors du serveur : il modifie le `Promise` global et casse le `fetch` côté serveur.

## Incohérence d'hydratation due aux dates {#hydration-mismatch-from-dates}

**Symptôme.** React signale l'erreur #418 (ou Vue et Svelte journalisent une incohérence d'hydratation) uniquement pour certains utilisateurs ou uniquement vers minuit. Le diff montre une date décalée d'un jour, par exemple `21 Mart 2026` contre `22 Mart 2026`.

**Cause.** Le serveur formate les dates dans son fuseau horaire (généralement UTC) et le navigateur les formate dans le fuseau de l'utilisateur. `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` sans `timeZone` produit un texte différent de chaque côté.

**Correction.** Passez un `timeZone` explicite partout où vous formatez des dates rendues par le serveur :

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

Il en va de même pour `toLocaleString`, les temps relatifs (« il y a 3 heures ») et tout ce qui utilise `Date.now()` pendant le rendu.

## Les données d'une requête apparaissent dans une autre {#data-from-one-request-shows-up-in-another}

**Symptôme.** Un îlot rendu côté serveur affiche des données périmées, ou les données de la requête d'un autre utilisateur, puis le client se rend à nouveau avec un contenu différent.

**Cause.** Un cache au niveau du module, par exemple `export const queryClient = new QueryClient()` importé par plusieurs micro apps, vit aussi longtemps que le processus serveur. Chaque requête lit et écrit la même instance.

**Correction.** Créez le cache par requête sur le serveur et transmettez à l'îlot ce dont il a besoin sous forme de props. Ne gardez un client unique au niveau du module que dans le code navigateur.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

Voir [État par requête](/fr/guide/ssr-islands#per-request-state).

## Une app en script module ne se charge plus après un déchargement {#a-module-script-app-does-not-load-after-unload}

**Symptôme.** Après `orchestrator.unregister(name)` ou `loader.unload(name)`, enregistrer et monter à nouveau la même app échoue avec `Module "<name>" loaded but no exports found`.

**Cause.** Les navigateurs n'exécutent un script module qu'une fois par URL. Le second `<script type="module" src="...">` pour la même URL ne fait rien, donc l'app n'appelle plus jamais `registerModule`.

**Correction.** Utilisez une entrée sous forme de fonction loader, qui garde le module dans le cache de modules du bundler, ou changez l'URL (par exemple avec une query string de version) :

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## « loaded but no exports found » {#loaded-but-no-exports-found}

**Symptôme.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Cause et correction**, dans l'ordre de vérification :

1. Le nom enregistré par le bundle diffère du nom enregistré dans l'orchestrateur. `createReactMicroApp({ name: 'Dashboard' })` et `register({ name: 'dashboard' })` ne correspondent pas. Utilisez une seule chaîne.
2. Un bundle ES module chargé comme script classique. La sortie ES de Vite se termine par `.js` ; ajoutez `type: 'module'` à l'entrée.
3. Le bundle exporte le module mais ne l'enregistre jamais. Utilisez un adaptateur ou `defineMicroApp`, ou appelez `registerModule(name, module)` vous-même.

## Conteneur introuvable {#container-not-found}

**Symptôme.** `[Tuvix] Container "#app" not found in DOM.`

**Cause.** L'orchestrateur recherche le conteneur au moment où il monte l'app. Un composant de route d'un routeur externe ne l'a peut-être pas encore rendu.

**Correction.** Placez les conteneurs dans un layout qui existe avant la navigation, ou hébergez cette app avec `TuvixIsland` dans le composant de route. Voir [Routeur externe](/fr/guide/external-router#containers-rendered-by-routes).

## Premier affichage sans style {#unstyled-first-paint}

**Symptôme.** Avec JavaScript désactivé, ou pendant un instant sur les connexions lentes, les îlots rendus côté serveur s'affichent sans leur CSS.

**Cause.** Vite injecte les CSS Modules, les `<style>` de Vue et les styles Svelte depuis JavaScript. Le HTML serveur ne lie aucun d'eux.

**Correction.** Ajoutez `tuvix()` depuis `@tuvix.js/vite` à votre configuration Vite et écrivez `renderAssetTags(await getAssets([...]))` dans `<head>`. Voir [Îlots SSR](/fr/guide/ssr-islands).
