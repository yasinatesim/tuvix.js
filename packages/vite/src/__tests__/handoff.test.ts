// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { devStylesheetHandoff, devStylesheetHref } from '../dev';

interface FakeSheet {
  disabled: boolean;
}

function addLink(href: string, sheet: FakeSheet | null): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  // jsdom does not fetch stylesheets, so stand in for the loaded CSSStyleSheet.
  let current = sheet;
  Object.defineProperty(link, 'sheet', {
    get: () => current,
    configurable: true,
  });
  link.addEventListener('load', () => {
    current ??= { disabled: false };
  });
  document.head.append(link);
  return link;
}

const runHandoff = (href: string): void => {
  new Function(devStylesheetHandoff(href))();
};

describe('dev stylesheet handoff', () => {
  beforeEach(() => {
    document.head.replaceChildren();
  });

  it('disables the matching loaded stylesheet and keeps the element', () => {
    const sheet = { disabled: false };
    const link = addLink('/src/card.module.css?direct', sheet);
    const other = { disabled: false };
    addLink('/src/other.css?direct', other);

    runHandoff('/src/card.module.css?direct');

    expect(sheet.disabled).toBe(true);
    expect(other.disabled).toBe(false);
    expect(link.isConnected).toBe(true);
  });

  it('matches an absolute href against a root-relative one', () => {
    const sheet = { disabled: false };
    addLink(`${location.origin}/app/src/a.css?direct`, sheet);

    runHandoff('/app/src/a.css?direct');

    expect(sheet.disabled).toBe(true);
  });

  it('waits for a stylesheet that has not loaded yet', () => {
    const link = addLink('/src/late.css?direct', null);

    runHandoff('/src/late.css?direct');
    link.dispatchEvent(new Event('load'));

    expect((link.sheet as unknown as FakeSheet).disabled).toBe(true);
  });
});

describe('devStylesheetHref', () => {
  it('puts ?direct first so the URL keeps its CSS extension at the end', () => {
    expect(devStylesheetHref('/src/a.module.css', '/')).toBe(
      '/src/a.module.css?direct'
    );
    expect(
      devStylesheetHref('/src/App.vue?vue&type=style&index=0&lang.css', '/app/')
    ).toBe('/app/src/App.vue?direct&vue&type=style&index=0&lang.css');
  });
});
