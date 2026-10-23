# Universal Code Quality Standards

> Sources: [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) (MIT) via the yasinatesim agent bootstrap gist, plus the architecture and complexity sections of the former `wtf-code-reviewer` skill. Project rules in `CONTRIBUTING.md` and `CLAUDE.md` win over anything here.
>
> Rule: NEVER flag or remove commented-out code. The author may keep it on purpose.

## Function design

- One function does one coherent thing. Length matters less than cohesion: a 100-line function with one clear job beats five 20-line fragments you have to jump between.
- New internal functions with 3 or more parameters take an options object. Do not flag existing public signatures (`createReactMicroApp(config)`, `renderVueToString(App, props, plugins)`): changing them breaks consumers.
- No boolean flag parameters on new APIs (`doThing(true)`); use an options field or two functions.
- Guard clauses and early returns over a function body wrapped in one `if`.
- Cyclomatic complexity under 10; nesting at most 4 levels.
- No magic numbers or strings inline; name them.

## Architecture

- Dependencies flow one way. Adapters (react, vue, svelte, angular) import from `@tuvix.js/loader` and `@tuvix.js/event-bus` public entries, never from another package's `src/` internals.
- A module with an explicit interface beats one whose internals other packages reach into.
- No god module that owns registration, rendering, routing and events at once.
- Abstraction fits the need: two copies of a concept is a finding, and so is a generic layer with one caller.

## Side effects and state

- Pure where possible: same input, same output.
- Never mutate arguments you do not own; clone and return.
- Global writes (`window.*`) go through the one helper that owns them (`registerModule`, `emitLifecycle`). A second writer is a finding.
- Every subscription, listener, timer and observer created in `mount` is released in `unmount`.

## Limits and edge cases

- Handle null, empty and missing values; never assume the container, the module or the props exist.
- Handle the second call: mount twice, unmount twice, unmount before mount resolves.
- Validate input at the public boundary and fail fast with an error that says what failed and why (`[Tuvix <Package>] ...`, see `CONTRIBUTING.md`).
- No silent catch. A caught error is rethrown, reported through `emitLifecycle('error', ...)`, or logged with a reason.

## Naming

- Same word for the same concept across packages: `mount`/`unmount`/`update`, `container`, `props`.
- Searchable, pronounceable names. No `data`, `info`, `handler`, `manager` without a qualifier.
- No redundant context: inside `VueAdapter` the field is `app`, not `vueAdapterApp`.

## Performance

- No O(n²) work over route tables or registries that grow with app count.
- Measure before optimising; do not add caches nobody profiled.

## Testing

- See `.claude/skills/test-driven-development/SKILL.md` (Test Quality section). The reviewer hands changed tests to the `test-verifier` agent.

## Comments

- Comment why, never what. Good names remove most comments.
- Exported symbols carry JSDoc: one-line summary and an `@example` that compiles.
- No journal comments (history lives in git), no `=====` separators, no naked `TODO` without an issue link.
