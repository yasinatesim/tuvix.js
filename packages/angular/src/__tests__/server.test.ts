// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Component } from '@angular/core';
import { renderAngularToString } from '../server';

const StyledComponent = Component({
  selector: 'app-styled',
  standalone: true,
  inputs: [],
  template: '<h1 class="title">Server {{ word }}</h1>',
  styles: ['.title { color: rgb(1, 2, 3); }'],
})(
  class StyledComponent {
    word = 'rendered';
  }
);

const OtherComponent = Component({
  selector: 'app-other',
  standalone: true,
  template: '<span>other</span>',
})(class OtherComponent {});

const AttributeComponent = Component({
  selector: '[tuvix-attr]',
  standalone: true,
  template: '<b>attribute host</b>',
})(class AttributeComponent {});

const InputComponent = Component({
  selector: 'app-input',
  standalone: true,
  inputs: ['name', 'count: total'],
  template: '<p>{{ name }} {{ upper }} {{ count }}</p>',
})(
  class InputComponent {
    name = 'default';
    count = 0;
    upper = '';
    ngOnInit(): void {
      this.upper = this.name.toUpperCase();
    }
  }
);

describe('renderAngularToString', () => {
  it('renders the component and keeps its styles in the returned HTML', async () => {
    const html = await renderAngularToString(StyledComponent);

    expect(html).toMatch(/^<style[^>]*>[^<]*color: ?rgb\(1, ?2, ?3\)/);
    expect(html).toMatch(
      /<app-styled[^>]*><h1[^>]*class="title"[^>]*>Server rendered<\/h1><\/app-styled>/
    );
    expect(html).not.toMatch(/<\/?(html|head|body)\b/);
  });

  it('sets props on component inputs before ngOnInit', async () => {
    const html = await renderAngularToString(InputComponent, {
      props: { name: 'ada', total: 3, notAnInput: 'skip' },
    });

    expect(html).toMatch(/<app-input[^>]*><p>ada ADA 3<\/p><\/app-input>$/);
  });

  it('keeps input defaults without props', async () => {
    const html = await renderAngularToString(InputComponent);
    expect(html).toMatch(/<p>default DEFAULT 0<\/p>/);
  });

  it('runs without zone.js and leaves the global Promise alone', async () => {
    const OriginalPromise = globalThis.Promise;

    await renderAngularToString(OtherComponent);

    expect(globalThis.Promise).toBe(OriginalPromise);
    expect('Zone' in globalThis).toBe(false);
  });

  it('uses the element selector for the default document', async () => {
    const html = await renderAngularToString(OtherComponent);
    expect(html).toMatch(/<app-other[^>]*><span>other<\/span><\/app-other>$/);
  });

  it('renders an attribute-selector component into a matching host from `document`', async () => {
    const html = await renderAngularToString(AttributeComponent, {
      document:
        '<!DOCTYPE html><html><head></head><body><section tuvix-attr></section></body></html>',
    });
    expect(html).toMatch(
      /<section tuvix-attr=""[^>]*><b>attribute host<\/b><\/section>$/
    );
  });

  it('rejects an attribute-selector component without a matching host', async () => {
    await expect(renderAngularToString(AttributeComponent)).rejects.toThrow(
      /tuvix-attr/
    );
  });

  it('applies appId to the style tags', async () => {
    const html = await renderAngularToString(StyledComponent, {
      appId: 'about',
    });
    expect(html).toMatch(/<style[^>]*ng-app-id="about"/);
  });
});
