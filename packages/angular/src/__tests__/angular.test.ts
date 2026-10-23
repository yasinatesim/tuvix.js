import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Component,
  Injectable,
  destroyPlatform,
  NgModule,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { getRegisteredModule, type LifecycleDetail } from '@tuvix.js/loader';
import { createAngularMicroApp, createSsrAngularMicroApp } from '../index';
import { renderAngularToString } from '../server';

// Components are JIT-compiled from metadata. Calling the decorator factory
// directly avoids depending on the test transformer's decorator support.

const GreetingComponent = Component({
  selector: 'app-greeting',
  standalone: true,
  inputs: ['name'],
  template: '<p class="greeting">Hello {{ name }}</p>',
})(
  class GreetingComponent {
    name = 'nobody';
  }
);

const OtherRootComponent = Component({
  selector: 'app-greeting',
  standalone: true,
  template: '<p class="other">Other app</p>',
})(class OtherRootComponent {});

const seenOnInit: unknown[] = [];
const destroyed: string[] = [];

const LifecycleComponent = Component({
  selector: 'app-lifecycle',
  standalone: true,
  inputs: ['label'],
  template: '<span class="label">{{ label }}</span>',
})(
  class LifecycleComponent implements OnInit, OnDestroy {
    label: string | undefined;
    ngOnInit(): void {
      seenOnInit.push(this.label);
    }
    ngOnDestroy(): void {
      destroyed.push(this.label ?? '');
    }
  }
);

const AttributeSelectorComponent = Component({
  selector: '[tuvix-attr]',
  standalone: true,
  template: '<b>attribute host</b>',
})(class AttributeSelectorComponent {});

const created: string[] = [];
const SpyComponent = Component({
  selector: 'app-spy',
  standalone: true,
  template: 'spy',
})(
  class SpyComponent {
    constructor() {
      created.push('spy');
    }
  }
);

const GreetingService = Injectable()(
  class GreetingService {
    text = 'from NgModule';
  }
);

const ModuleComponent = Component({
  selector: 'app-module-root',
  template: '<i>{{ text }}</i>',
})(
  class ModuleComponent {
    text = inject(GreetingService).text;
  }
);

const GreetingModule = NgModule({
  declarations: [ModuleComponent],
  providers: [GreetingService],
})(class GreetingModule {});

// ─── Helpers ──────────────────────────────────────────

const containers: HTMLElement[] = [];

function makeContainer(html = ''): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  containers.push(el);
  return el;
}

function record(container: HTMLElement): Array<[string, LifecycleDetail]> {
  const events: Array<[string, LifecycleDetail]> = [];
  for (const type of ['mounted', 'unmounted', 'error']) {
    container.addEventListener(`tuvix:${type}`, (event) => {
      events.push([type, (event as CustomEvent<LifecycleDetail>).detail]);
    });
  }
  return events;
}

let uid = 0;
const appName = (base: string) => `${base}-${++uid}`;

afterEach(() => {
  for (const el of containers.splice(0)) el.remove();
  seenOnInit.length = 0;
  destroyed.length = 0;
  created.length = 0;
});

// ─── createAngularMicroApp ───────────────────────────

describe('createAngularMicroApp', () => {
  it('registers the module under its name', () => {
    const name = appName('registry');
    const app = createAngularMicroApp({ name, component: GreetingComponent });
    expect(getRegisteredModule(name)).toBe(app);
  });

  it('runs config.bootstrap once per bootstrap call', async () => {
    const onBootstrap = vi.fn();
    const app = createAngularMicroApp({
      name: appName('bootstrap'),
      component: GreetingComponent,
      bootstrap: onBootstrap,
    });
    await app.bootstrap?.();
    expect(onBootstrap).toHaveBeenCalledOnce();
  });

  it('renders the component into a host element inside the container', async () => {
    const app = createAngularMicroApp({
      name: appName('render'),
      component: GreetingComponent,
    });
    const container = makeContainer();

    await app.mount({ container, props: { name: 'Ada' } });

    const host = container.firstElementChild as HTMLElement;
    expect(host.localName).toBe('app-greeting');
    expect(container.querySelector('.greeting')?.textContent).toBe('Hello Ada');
    await app.unmount({ container });
  });

  it('sets props as inputs before the first change detection', async () => {
    const app = createAngularMicroApp({
      name: appName('oninit'),
      component: LifecycleComponent,
    });
    const container = makeContainer();

    await app.mount({ container, props: { label: 'first', notAnInput: 1 } });

    expect(seenOnInit).toEqual(['first']);
    expect(container.textContent).toBe('first');
    await app.unmount({ container });
  });

  it('keeps two Angular apps with the same selector in their own containers', async () => {
    const first = createAngularMicroApp({
      name: appName('first'),
      component: GreetingComponent,
    });
    const second = createAngularMicroApp({
      name: appName('second'),
      component: OtherRootComponent,
    });
    const a = makeContainer();
    const b = makeContainer();

    await first.mount({ container: a, props: { name: 'A' } });
    await second.mount({ container: b });

    expect(a.textContent).toBe('Hello A');
    expect(b.textContent).toBe('Other app');
    expect(document.querySelectorAll('app-greeting')).toHaveLength(2);

    await first.unmount({ container: a });
    expect(a.childNodes).toHaveLength(0);
    expect(b.textContent).toBe('Other app');
    await second.unmount({ container: b });
  });

  it('mounts one module into several containers', async () => {
    const app = createAngularMicroApp({
      name: appName('multi'),
      component: GreetingComponent,
    });
    const a = makeContainer();
    const b = makeContainer();

    await app.mount({ container: a, props: { name: 'one' } });
    await app.mount({ container: b, props: { name: 'two' } });
    expect(a.textContent).toBe('Hello one');
    expect(b.textContent).toBe('Hello two');

    await app.unmount({ container: a });
    expect(a.childNodes).toHaveLength(0);
    expect(b.textContent).toBe('Hello two');
    await app.unmount({ container: b });
  });

  it('update() writes new props through setInput and re-renders', async () => {
    const app = createAngularMicroApp({
      name: appName('update'),
      component: GreetingComponent,
    });
    const container = makeContainer();
    await app.mount({ container, props: { name: 'before' } });

    await app.update?.({ props: { name: 'after' } });

    expect(container.textContent).toBe('Hello after');
    await app.unmount({ container });
  });

  it('update() with a container touches only that mount', async () => {
    const app = createAngularMicroApp({
      name: appName('update-one'),
      component: GreetingComponent,
    });
    const a = makeContainer();
    const b = makeContainer();
    await app.mount({ container: a, props: { name: 'a' } });
    await app.mount({ container: b, props: { name: 'b' } });

    await app.update?.({ props: { name: 'b2' }, container: b });

    expect(a.textContent).toBe('Hello a');
    expect(b.textContent).toBe('Hello b2');
    await app.unmount({ container: a });
    await app.unmount({ container: b });
  });

  it('update() resets an input that the new props leave out', async () => {
    const app = createAngularMicroApp({
      name: appName('update-reset'),
      component: LifecycleComponent,
    });
    const container = makeContainer();
    await app.mount({ container, props: { label: 'set' } });

    await app.update?.({ props: {} });

    expect(container.querySelector('.label')?.textContent).toBe('');
    await app.unmount({ container });
  });

  it('update() before mount resolves without throwing', async () => {
    const app = createAngularMicroApp({
      name: appName('early-update'),
      component: GreetingComponent,
    });
    await expect(
      app.update?.({ props: { name: 'x' } })
    ).resolves.toBeUndefined();
  });

  it('unmount() destroys the component, empties the container and emits unmounted', async () => {
    const name = appName('unmount');
    const app = createAngularMicroApp({ name, component: LifecycleComponent });
    const container = makeContainer();
    const events = record(container);

    await app.mount({ container, props: { label: 'bye' } });
    await app.unmount({ container });

    expect(destroyed).toEqual(['bye']);
    expect(container.childNodes).toHaveLength(0);
    expect(events.map(([type]) => type)).toEqual(['mounted', 'unmounted']);
    expect(events[0]?.[1]).toMatchObject({ name, container, hydrated: false });
  });

  it('unmount() while mount is pending leaves no app behind', async () => {
    const app = createAngularMicroApp({
      name: appName('race'),
      component: SpyComponent,
    });
    const container = makeContainer();
    const events = record(container);

    const mounting = app.mount({ container });
    await app.unmount({ container });
    await mounting;

    expect(container.childNodes).toHaveLength(0);
    expect(created).toEqual([]);
    expect(events).toEqual([]);
  });

  it('a second mount on the same container replaces the first app', async () => {
    const app = createAngularMicroApp({
      name: appName('remount'),
      component: LifecycleComponent,
    });
    const container = makeContainer();

    await app.mount({ container, props: { label: 'one' } });
    await app.mount({ container, props: { label: 'two' } });

    expect(destroyed).toEqual(['one']);
    expect(container.querySelectorAll('app-lifecycle')).toHaveLength(1);
    expect(container.textContent).toBe('two');
    await app.unmount({ container });
  });

  it('runs without zone.js and leaves the global Promise alone', async () => {
    const OriginalPromise = globalThis.Promise;
    const app = createAngularMicroApp({
      name: appName('zoneless'),
      component: GreetingComponent,
    });
    const container = makeContainer();

    await app.mount({ container, props: { name: 'zoneless' } });

    expect(globalThis.Promise).toBe(OriginalPromise);
    expect('Zone' in globalThis).toBe(false);
    expect(container.textContent).toBe('Hello zoneless');
    await app.unmount({ container });
  });

  it('zone: true without zone.js rejects and emits an error event', async () => {
    const name = appName('zone-missing');
    const app = createAngularMicroApp({
      name,
      component: GreetingComponent,
      zone: true,
    });
    const container = makeContainer();
    const events = record(container);

    await expect(app.mount({ container })).rejects.toThrow(/zone\.js/);
    expect(events.map(([type]) => type)).toEqual(['error']);
    expect(events[0]?.[1].error).toBeInstanceOf(Error);
  });

  it('uses a div host for components with an attribute selector', async () => {
    const app = createAngularMicroApp({
      name: appName('attr'),
      component: AttributeSelectorComponent,
    });
    const container = makeContainer();

    await app.mount({ container });

    expect(container.firstElementChild?.localName).toBe('div');
    expect(container.textContent).toBe('attribute host');
    await app.unmount({ container });
  });

  it('bootstraps a component declared in an NgModule with the module providers', async () => {
    const app = createAngularMicroApp({
      name: appName('ngmodule'),
      component: ModuleComponent,
      module: GreetingModule,
    });
    const container = makeContainer();

    await app.mount({ container });

    expect(container.querySelector('i')?.textContent).toBe('from NgModule');
    await app.unmount({ container });
  });

  it('replaces server markup when ssr is off', async () => {
    const app = createAngularMicroApp({
      name: appName('no-ssr'),
      component: GreetingComponent,
    });
    const container = makeContainer(
      '<app-greeting><p>server</p></app-greeting>'
    );
    const serverHost = container.firstElementChild;
    const events = record(container);

    await app.mount({ container, props: { name: 'client' } });

    expect(container.firstElementChild).not.toBe(serverHost);
    expect(container.textContent).toBe('Hello client');
    expect(events[0]?.[1].hydrated).toBe(false);
    await app.unmount({ container });
  });
});

// ─── createSsrAngularMicroApp ────────────────────────

describe('createSsrAngularMicroApp', () => {
  it('adopts the server host element and drops the inlined server styles', async () => {
    const app = createSsrAngularMicroApp({
      name: appName('ssr'),
      component: GreetingComponent,
    });
    const container = makeContainer(
      '<style ng-app-id="ng">.greeting{color:red}</style>' +
        '<app-greeting ng-server-context="ssr"><p class="greeting">Hello server</p></app-greeting>'
    );
    const serverHost = container.querySelector('app-greeting');
    const events = record(container);

    await app.mount({ container, props: { name: 'client' } });

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(serverHost);
    expect(container.textContent).toBe('Hello client');
    expect(events.map(([type, detail]) => [type, detail.hydrated])).toEqual([
      ['mounted', true],
    ]);
    await app.unmount({ container });
    expect(container.childNodes).toHaveLength(0);
  });

  it('renders fresh into an empty container', async () => {
    const app = createSsrAngularMicroApp({
      name: appName('ssr-empty'),
      component: GreetingComponent,
    });
    const container = makeContainer('  ');
    const events = record(container);

    await app.mount({ container, props: { name: 'fresh' } });

    expect(container.textContent).toBe('Hello fresh');
    expect(events[0]?.[1].hydrated).toBe(false);
    await app.unmount({ container });
  });
});

// ─── renderAngularToString ───────────────────────────

describe('renderAngularToString', () => {
  it('returns an empty string in a browser environment', async () => {
    await expect(renderAngularToString(GreetingComponent)).resolves.toBe('');
  });

  it('server and client render the same markup from the same props', async () => {
    const ParityComponent = Component({
      selector: 'app-parity',
      standalone: true,
      inputs: ['name'],
      template: '<p class="parity">{{ name }} / {{ shout }}</p>',
      styles: ['.parity { color: rgb(4, 5, 6); }'],
    })(
      class ParityComponent implements OnInit {
        name = 'default';
        shout = '';
        ngOnInit(): void {
          this.shout = this.name.toUpperCase();
        }
      }
    );
    const props = { name: 'ada', notAnInput: true };

    // `renderAngularToString` returns '' while `window` exists, and a server
    // platform cannot start while this process holds the browser platform
    // from earlier tests. Angular 16's platform-server also copies Domino's
    // DOM classes onto the global object, so the jsdom ones are put back
    // afterwards. A real page never runs both in one process.
    destroyPlatform();
    // Domino only writes DOM classes (`Event`, `Node`, ...), all capitalised.
    const jsdomGlobals = new Map<string, unknown>(
      Object.getOwnPropertyNames(globalThis)
        .filter((key) => /^[A-Z]/.test(key))
        .map((key) => [key, Reflect.get(globalThis, key)])
    );
    vi.stubGlobal('window', undefined);
    let serverHtml: string;
    try {
      serverHtml = await renderAngularToString(ParityComponent, { props });
    } finally {
      vi.unstubAllGlobals();
      for (const [key, value] of jsdomGlobals) {
        if (Reflect.get(globalThis, key) !== value) {
          Reflect.set(globalThis, key, value);
        }
      }
    }

    const container = makeContainer(serverHtml);
    const serverHost = container.querySelector('app-parity');
    const serverInner = serverHost?.innerHTML;
    expect(container.querySelector('style')?.textContent).toContain(
      'rgb(4, 5, 6)'
    );
    expect(serverHost?.textContent).toBe('ada / ADA');

    const app = createSsrAngularMicroApp({
      name: appName('parity'),
      component: ParityComponent,
    });
    await app.mount({ container, props });

    const clientHost = container.querySelector('app-parity');
    expect(clientHost).toBe(serverHost);
    expect(clientHost?.innerHTML).toBe(serverInner);
    await app.unmount({ container });
  });
});
