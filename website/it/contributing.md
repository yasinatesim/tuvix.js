# Contribuire a Tuvix.js

Grazie per il tuo interesse nel contribuire! Che si tratti di una correzione di bug, una nuova funzionalità, un miglioramento della documentazione o una traduzione, tutti i contributi sono benvenuti.

## Modi per Contribuire

- **Segnalazioni di bug** - [Apri un issue](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Richieste di funzionalità** - [Avvia una discussione](https://github.com/yasinatesim/tuvix.js/issues)
- **Codice** - Correggi bug, aggiungi funzionalità, migliora i test
- **Documentazione** - Correggi errori di battitura, aggiungi esempi, migliora la chiarezza
- **Traduzioni** - Aggiungi o migliora la documentazione in altre lingue

## Per Iniziare

### 1. Fork e Clone

```bash
git clone https://github.com/TUO_NOME_UTENTE/tuvix.js.git
cd tuvix.js
```

### 2. Installare le Dipendenze

Utilizziamo [pnpm](https://pnpm.io) e [Node.js ≥ 18](https://nodejs.org).

```bash
pnpm install
```

### 3. Compilare Tutti i Pacchetti

```bash
pnpm build
```

### 4. Eseguire i Test

```bash
pnpm test
```

### 5. Avviare il Server di Sviluppo della Documentazione

```bash
cd website
pnpm install
pnpm dev
```

Apri `http://localhost:5173` nel tuo browser per visualizzare l'anteprima della documentazione.

## Struttura del Progetto

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
    ├── .vitepress/     Configurazione e tema VitePress
    ├── guide/          Documentazione in inglese
    ├── packages/       Documentazione API dei pacchetti
    ├── tr/             Traduzioni in turco
    ├── es/             Traduzioni in spagnolo
    └── ...             Altre lingue
```

## Stile del Codice

- **TypeScript** - modalità strict, tutto il codice deve essere tipizzato
- **Prettier** - esegui `pnpm format` per formattare
- **Nessuna dipendenza runtime** - i pacchetti devono avere zero dipendenze runtime
- **Export nominati** - evita gli export di default
- **Messaggi di errore** - prefissare con `[Tuvix ...]`

## Messaggi di Commit

Seguiamo [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Processo di Pull Request

1. Crea un branch da `master`:

   ```bash
   git checkout -b feat/la-mia-funzionalita
   ```

2. Apporta le modifiche e aggiungi i test

3. Esegui la suite di test completa:

   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. Se la tua modifica riguarda un pacchetto pubblicato, aggiungi un changeset:

   ```bash
   pnpm changeset
   ```

5. Fai push e apri un PR contro `master`

6. Un maintainer esaminerà il tuo PR. Per favore rispondi ai feedback entro 7 giorni.

## Aggiungere una Traduzione

Tutta la documentazione è in Markdown sotto `website/`. Ogni lingua ha la propria directory:

```
website/
├── index.md              ← Inglese (radice)
├── guide/                ← Guide in inglese
├── tr/                   ← Turco
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Spagnolo
└── ...
```

### Passaggi per aggiungere o migliorare una traduzione

1. Copia i file inglesi da `website/guide/` a `website/<lang>/guide/`
2. Traduci il contenuto Markdown (mantieni i blocchi di codice in inglese)
3. Aggiorna la configurazione della sidebar in `website/.vitepress/config/<lang>.ts`
4. Esegui `cd website && pnpm dev` per l'anteprima

::: tip Suggerimenti per la Traduzione

- Mantieni tutti gli esempi di codice in inglese
- Traduci le etichette dell'interfaccia, le descrizioni e il testo esplicativo
- Usa la terminologia nativa dove esistono traduzioni standard
:::

## Lingue Supportate

| Lingua | Codice | Stato |
|--------|--------|-------|
| Inglese | `en` | Completo (riferimento) |
| Turco | `tr` | In corso |
| Spagnolo | `es` | In corso |
| Tedesco | `de` | In corso |
| Francese | `fr` | In corso |
| Giapponese | `ja` | In corso |
| Cinese | `zh` | In corso |
| Italiano | `it` | In corso |
| Portoghese | `pt` | In corso |
| Hindi | `hi` | In corso |

Se desideri contribuire a una di queste lingue, controlla gli [issue di traduzione aperti](https://github.com/yasinatesim/tuvix.js/labels/translation) o aprine uno nuovo.

## Codice di Condotta

Questo progetto segue il [Contributor Covenant](https://www.contributor-covenant.org/). Sii rispettoso e costruttivo.

## Licenza

Contribuendo, accetti che i tuoi contributi saranno licenziati sotto la Licenza MIT.
