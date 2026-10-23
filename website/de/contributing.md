# Zu Tuvix.js beitragen

Danke für dein Interesse an einer Mitarbeit! Ob Fehlerbehebung, neues Feature, Verbesserung der Dokumentation oder Übersetzung: Alle Beiträge sind willkommen.

## Möglichkeiten beizutragen

- **Fehlerberichte**: [Issue erstellen](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Feature-Wünsche**: [Diskussion starten](https://github.com/yasinatesim/tuvix.js/issues)
- **Code**: Fehler beheben, Features hinzufügen, Tests verbessern
- **Dokumentation**: Tippfehler korrigieren, Beispiele hinzufügen, Verständlichkeit verbessern
- **Übersetzungen**: Dokumentation in anderen Sprachen hinzufügen oder verbessern

## Erste Schritte

### 1. Forken und klonen

```bash
git clone https://github.com/YOUR_USERNAME/tuvix.js.git
cd tuvix.js
```

### 2. Abhängigkeiten installieren

Wir verwenden [pnpm](https://pnpm.io) und [Node.js ≥ 18](https://nodejs.org).

```bash
pnpm install
```

### 3. Alle Pakete bauen

```bash
pnpm build
```

### 4. Tests ausführen

```bash
pnpm test
```

### 5. Dev-Server der Doku starten

```bash
cd website
pnpm install
pnpm dev
```

Öffne `http://localhost:5173` in deinem Browser, um eine Vorschau der Doku zu sehen.

## Projektstruktur

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     VitePress config and theme
    ├── guide/          English documentation
    ├── packages/       Package API docs
    ├── tr/             Turkish translations
    ├── es/             Spanish translations
    └── ...             Other languages
```

## Code-Stil

- **TypeScript**: Strict Mode, der gesamte Code muss typisiert sein
- **Prettier**: Führe `pnpm format` zum Formatieren aus
- **Keine Laufzeitabhängigkeiten**: Pakete dürfen keine Laufzeitabhängigkeiten haben
- **Benannte Exporte**: Vermeide Default-Exporte
- **Fehlermeldungen**: Mit `[Tuvix ...]` als Präfix beginnen

## Commit-Nachrichten

Wir folgen [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Ablauf für Pull Requests

1. Erstelle einen Branch von `master`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Nimm deine Änderungen vor und füge Tests hinzu

3. Führe die vollständige Testsuite aus:

   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. Wenn deine Änderung ein veröffentlichtes Paket betrifft, füge ein Changeset hinzu:

   ```bash
   pnpm changeset
   ```

5. Pushe und öffne einen PR gegen `master`

6. Ein Maintainer prüft deinen PR. Bitte reagiere innerhalb von 7 Tagen auf Feedback.

## Eine Übersetzung hinzufügen

Die gesamte Dokumentation liegt als Markdown unter `website/`. Jede Sprache hat ein eigenes Verzeichnis:

```
website/
├── index.md              ← English (root)
├── guide/                ← English guides
├── tr/                   ← Turkish
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Spanish
└── ...
```

### Schritte zum Hinzufügen oder Verbessern einer Übersetzung

1. Kopiere englische Dateien von `website/guide/` nach `website/<lang>/guide/`
2. Übersetze den Markdown-Inhalt (Code-Blöcke bleiben auf Englisch)
3. Aktualisiere die Sidebar-Konfiguration in `website/.vitepress/config/<lang>.ts`
4. Führe `cd website && pnpm dev` für eine Vorschau aus

::: tip Übersetzungstipps

- Lass alle Code-Beispiele auf Englisch
- Übersetze UI-Beschriftungen, Beschreibungen und erklärende Texte
- Verwende die übliche Fachterminologie der Sprache, wo es etablierte Übersetzungen gibt
:::

## Unterstützte Sprachen

| Sprache | Code | Status |
|----------|------|--------|
| Englisch  | `en` | Vollständig (Referenz) |
| Türkisch  | `tr` | In Arbeit |
| Spanisch  | `es` | In Arbeit |
| Deutsch   | `de` | In Arbeit |
| Französisch   | `fr` | In Arbeit |
| Japanisch | `ja` | In Arbeit |
| Chinesisch  | `zh` | In Arbeit |
| Italienisch  | `it` | In Arbeit |
| Portugiesisch | `pt` | In Arbeit |
| Hindi    | `hi` | In Arbeit |

Wenn du zu einer dieser Sprachen beitragen möchtest, sieh dir die [offenen Übersetzungs-Issues](https://github.com/yasinatesim/tuvix.js/labels/translation) an oder eröffne ein neues.

## Verhaltenskodex

Dieses Projekt folgt dem [Contributor Covenant](https://www.contributor-covenant.org/). Sei respektvoll und konstruktiv.

## Lizenz

Mit deinem Beitrag stimmst du zu, dass deine Beiträge unter der MIT-Lizenz lizenziert werden.
