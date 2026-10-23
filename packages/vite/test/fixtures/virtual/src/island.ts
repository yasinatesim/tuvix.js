// Both imports resolve to virtual modules from the test's plugin: one JS
// module that imports a real stylesheet, one CSS module with no file.
import { widgetClass } from 'virtual:fixture-widget';
import 'virtual:fixture-theme.css';

export function render(): string {
  return `<div class="${widgetClass} fixture-theme">Widget</div>`;
}

(globalThis as Record<string, unknown>).__fixtureVirtualIsland = render;
