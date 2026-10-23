# Fehlerbehebung

Jeder Eintrag beginnt mit dem, was du siehst, gefolgt von Ursache und Lösung.

## Svelte: onMount läuft nie, oder mount() wirft lifecycle_function_unavailable

**Symptom.** Eine Svelte-Island rendert, aber `onMount`-Callbacks werden nie ausgelöst, oder `mount()` von Svelte 5 wirft `lifecycle_function_unavailable`.

**Ursache.** `svelte` liefert unter demselben Import eine Browser-Runtime und eine Server-Runtime aus. Dein Client-Bundle hat die Server-Runtime gewählt. Manche SSR-Setups (Vinxi, eigene Vite-Environments, Vitest in jsdom) lösen den Client ohne die Export-Condition `browser` auf, und der Dependency-Optimizer von Vite bündelt dann die Server-Runtime vor. In den Devtools des Browsers siehst du `svelte/src/index-server.js` (Svelte 5) oder `svelte/src/runtime/ssr.js` (Svelte 4) statt der Client-Datei.

**Lösung.** Nimm `browser` wieder in die Resolve-Conditions des Clients auf und starte Vite dann mit `--force` neu, damit es die optimierten Abhängigkeiten neu baut:

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

Für Vitest mit jsdom fügst du die Condition hinzu und bindest Svelte inline ein, damit Vite es auflöst:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

Schließe `svelte` nicht aus `optimizeDeps` aus; esbuild schlägt dann mit „The entry point "svelte" cannot be marked as external“ fehl.

## Vue: der Alias ~ schlägt in .vue-Dateien fehl

**Symptom.** Der Production-Build schlägt mit `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."` fehl, während derselbe Import in `.ts`-Dateien funktioniert und `import type` aus `~/` in `.vue`-Dateien klappt.

**Ursache.** `vite-tsconfig-paths` wendet Aliase nur auf Dateien an, die seine tsconfig per `include` erfasst. Eine tsconfig, die `**/*.ts` und `**/*.tsx` einschließt, lässt `.vue`-Dateien außen vor. Reine Typ-Imports werden vor der Auflösung entfernt, deshalb schlagen sie nie fehl.

**Lösung.** Nimm `.vue`-Dateien in diese tsconfig auf:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

oder deklariere den Alias direkt in Vite:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Verwende die Editor-Erweiterung „Vue - Official“ (Volar). Vetur versteht weder `<script setup>`-Makros noch `moduleResolution: "Bundler"`.

## Angular 15-17: Klicks aktualisieren die Ansicht nicht

**Symptom.** Eine Angular-Island rendert, aber ein Button-Handler ändert ein Feld, und das Template aktualisiert sich nicht.

**Ursache.** Der Adapter führt Angular ohne zone.js aus. Angular 18+ plant die Change Detection im zonenlosen Modus selbst; unter 15-17 ersetzt der Adapter `NgZone` durch eine No-op-Zone, und nach DOM-Events führt nichts die Change Detection aus.

**Lösung.** Rufe nach der Änderung `detectChanges()` auf:

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

Oder importiere `zone.js` am Anfang deines Client-Entrys und übergib `zone: true` an `createAngularMicroApp`. Halte zone.js vom Server fern: Es patcht das globale `Promise` und bricht serverseitiges `fetch`.

## Hydration-Mismatch durch Datumsangaben

**Symptom.** React meldet Fehler #418 (oder Vue und Svelte loggen einen Hydration-Mismatch) nur bei manchen Nutzern oder nur kurz vor Mitternacht. Der Diff zeigt ein um einen Tag abweichendes Datum, etwa `21 Mart 2026` gegenüber `22 Mart 2026`.

**Ursache.** Der Server formatiert Datumsangaben in seiner Zeitzone (meist UTC) und der Browser in der Zeitzone des Nutzers. `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` ohne `timeZone` liefert auf beiden Seiten unterschiedlichen Text.

**Lösung.** Übergib überall eine explizite `timeZone`, wo du Datumsangaben formatierst, die der Server rendert:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

Dasselbe gilt für `toLocaleString`, relative Zeitangaben („vor 3 Stunden“) und alles, was während des Renderns `Date.now()` verwendet.

## Daten aus einer Anfrage tauchen in einer anderen auf

**Symptom.** Eine serverseitig gerenderte Island zeigt veraltete Daten oder Daten aus der Anfrage eines anderen Nutzers, und der Client rendert danach mit anderem Inhalt neu.

**Ursache.** Ein Cache auf Modulebene, zum Beispiel `export const queryClient = new QueryClient()`, den mehrere Micro Apps importieren, lebt so lange wie der Server-Prozess. Jede Anfrage liest und schreibt dieselbe Instanz.

**Lösung.** Erzeuge den Cache auf dem Server pro Anfrage und übergib, was die Island braucht, als Props. Behalte einen Client auf Modulebene nur in Browser-Code.

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

Siehe [State pro Anfrage](/de/guide/ssr-islands#per-request-state).

## Eine Modul-Skript-App lädt nach dem Entladen nicht mehr

**Symptom.** Nach `orchestrator.unregister(name)` oder `loader.unload(name)` schlägt erneutes Registrieren und Mounten derselben App mit `Module "<name>" loaded but no exports found` fehl.

**Ursache.** Browser führen ein Modul-Skript einmal pro URL aus. Das zweite `<script type="module" src="...">` für dieselbe URL tut nichts, also ruft die App `registerModule` nie erneut auf.

**Lösung.** Nutze einen Entry als Loader-Funktion, der das Modul im Modul-Cache des Bundlers hält, oder ändere die URL (zum Beispiel mit einem Versions-Query-String):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## „loaded but no exports found“

**Symptom.** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**Ursache und Lösung**, in der Reihenfolge, in der du sie prüfst:

1. Der Name, den das Bundle registriert, weicht vom registrierten Namen ab. `createReactMicroApp({ name: 'Dashboard' })` und `register({ name: 'dashboard' })` passen nicht zusammen. Verwende einen einzigen String.
2. Ein ES-Modul-Bundle wurde als klassisches Skript geladen. Die ES-Ausgabe von Vite endet auf `.js`; füge dem Entry `type: 'module'` hinzu.
3. Das Bundle exportiert das Modul, registriert es aber nie. Nutze einen Adapter oder `defineMicroApp`, oder rufe `registerModule(name, module)` selbst auf.

## Container nicht gefunden

**Symptom.** `[Tuvix] Container "#app" not found in DOM.`

**Ursache.** Der Orchestrator sucht den Container, wenn er die App mountet. Eine Routen-Komponente eines externen Routers hat ihn möglicherweise noch nicht gerendert.

**Lösung.** Halte Container in einem Layout, das vor der Navigation existiert, oder hoste diese App mit `TuvixIsland` innerhalb der Routen-Komponente. Siehe [Externer Router](/de/guide/external-router#containers-rendered-by-routes).

## Ungestylter erster Paint

**Symptom.** Bei deaktiviertem JavaScript oder auf langsamen Verbindungen für einen Moment erscheinen serverseitig gerenderte Islands ohne ihr CSS.

**Ursache.** Vite injiziert CSS Modules, `<style>` von Vue und Svelte-Styles per JavaScript. Das Server-HTML verlinkt keines davon.

**Lösung.** Füge `tuvix()` aus `@tuvix.js/vite` zu deiner Vite-Konfiguration hinzu und gib `renderAssetTags(await getAssets([...]))` im `<head>` aus. Siehe [SSR-Islands](/de/guide/ssr-islands).
