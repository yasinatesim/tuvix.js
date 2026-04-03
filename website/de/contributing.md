# Zu Tuvix.js beitragen

Vielen Dank für dein Interesse an einer Mitarbeit! Ob Fehlerbehebung, neues Feature, Dokumentationsverbesserung oder Übersetzung - alle Beiträge sind willkommen.

## Möglichkeiten beizutragen

- **Fehlerberichte** - [Issue erstellen](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Feature-Anfragen** - [Diskussion starten](https://github.com/yasinatesim/tuvix.js/discussions)
- **Code** - Fehler beheben, Features hinzufügen, Tests verbessern
- **Dokumentation** - Tippfehler korrigieren, Beispiele hinzufügen, Klarheit verbessern
- **Übersetzungen** - Dokumentation in anderen Sprachen hinzufügen oder verbessern

## Erste Schritte

### 1. Fork und Clone

```bash
git clone https://github.com/DEIN_BENUTZERNAME/tuvix.js.git
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

### 5. Docs-Entwicklungsserver starten

```bash
cd website
pnpm install
pnpm dev
```

Öffne `http://localhost:5173` in deinem Browser, um die Dokumentation anzuzeigen.

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
    ├── .vitepress/     VitePress-Konfiguration und Theme
    ├── guide/          Englische Dokumentation
    ├── packages/       Paket-API-Dokumentation
    ├── tr/             Türkische Übersetzungen
    ├── es/             Spanische Übersetzungen
    └── ...             Andere Sprachen
```

## Code-Stil

- **TypeScript** - strikter Modus, der gesamte Code muss typisiert sein
- **Prettier** - führe `pnpm format` zum Formatieren aus
- **Keine Laufzeitabhängigkeiten** - Pakete dürfen keine Laufzeitabhängigkeiten haben
- **Benannte Exporte** - vermeide Default-Exporte
- **Fehlermeldungen** - mit `[Tuvix ...]` voranstellen

## Commit-Nachrichten

Wir folgen [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Pull-Request-Prozess

1. Erstelle einen Branch von `master`:
   ```bash
   git checkout -b feat/mein-feature
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

5. Pushe und erstelle einen PR gegen `master`

6. Ein Maintainer wird deinen PR überprüfen. Bitte antworte innerhalb von 7 Tagen auf Feedback.

## Eine Übersetzung hinzufügen

Die gesamte Dokumentation befindet sich in Markdown unter `website/`. Jede Sprache hat ihr eigenes Verzeichnis:

```
website/
├── index.md              ← Englisch (Stammverzeichnis)
├── guide/                ← Englische Anleitungen
├── tr/                   ← Türkisch
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Spanisch
└── ...
```

### Schritte zum Hinzufügen oder Verbessern einer Übersetzung

1. Kopiere englische Dateien von `website/guide/` nach `website/<lang>/guide/`
2. Übersetze den Markdown-Inhalt (Code-Blöcke auf Englisch lassen)
3. Aktualisiere die Sidebar-Konfiguration in `website/.vitepress/config/<lang>.ts`
4. Führe `cd website && pnpm dev` zur Vorschau aus

::: tip Übersetzungstipps
- Alle Code-Beispiele auf Englisch lassen
- UI-Labels, Beschreibungen und erklärende Texte übersetzen
- Einheimische Terminologie verwenden, wo Standardübersetzungen existieren
:::

## Unterstützte Sprachen

| Sprache | Code | Status |
|---------|------|--------|
| Englisch | `en` | Vollständig (Referenz) |
| Türkisch | `tr` | In Bearbeitung |
| Spanisch | `es` | In Bearbeitung |
| Deutsch | `de` | In Bearbeitung |
| Französisch | `fr` | In Bearbeitung |
| Japanisch | `ja` | In Bearbeitung |
| Chinesisch | `zh` | In Bearbeitung |
| Italienisch | `it` | In Bearbeitung |
| Portugiesisch | `pt` | In Bearbeitung |
| Hindi | `hi` | In Bearbeitung |

Wenn du zu einer dieser Sprachen beitragen möchtest, prüfe die [offenen Übersetzungs-Issues](https://github.com/yasinatesim/tuvix.js/labels/translation) oder erstelle ein neues.

## Verhaltenskodex

Dieses Projekt folgt dem [Contributor Covenant](https://www.contributor-covenant.org/). Sei respektvoll und konstruktiv.

## Lizenz

Mit deinem Beitrag erklärst du dich damit einverstanden, dass deine Beiträge unter der MIT-Lizenz lizenziert werden.
