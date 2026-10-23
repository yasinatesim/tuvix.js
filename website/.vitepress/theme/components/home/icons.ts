/**
 * Stroke icons (24×24 viewBox) for the Orbit home. Frontmatter `icon` values
 * that match a key here render as SVG; anything else (emoji in older locale
 * files) renders as text.
 */
export const ICONS: Record<string, string[]> = {
  layers: ['M12 3 2 8l10 5 10-5-10-5Z', 'm2 13 10 5 10-5', 'm2 18 10 5 10-5'],
  box: ['M21 8 12 3 3 8v8l9 5 9-5V8Z', 'm3 8 9 5 9-5', 'M12 13v8'],
  route: [
    'M6 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    'M18 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    'M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5',
  ],
  broadcast: [
    'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    'M7.8 7.8a6 6 0 0 0 0 8.4',
    'M16.2 16.2a6 6 0 0 0 0-8.4',
    'M4.9 4.9a10 10 0 0 0 0 14.2',
    'M19.1 19.1a10 10 0 0 0 0-14.2',
  ],
  shield: [
    'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z',
    'm9 12 2 2 4-4',
  ],
  bolt: ['M13 2 4 14h7l-1 8 9-12h-7l1-8Z'],
  terminal: [
    'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z',
    'm7 9 3 3-3 3',
    'M13 15h4',
  ],
  server: [
    'M5 3h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
    'M5 14h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z',
    'M8 6.5h.01',
    'M8 17.5h.01',
  ],
  'arrow-right': ['M5 12h14', 'm13 6 6 6-6 6'],
  external: [
    'M14 4h6v6',
    'M20 4 10 14',
    'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  ],
  copy: [
    'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1Z',
    'M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  ],
  check: ['m5 12 5 5L20 7'],
  code: ['m8 7-5 5 5 5', 'm16 7 5 5-5 5'],
  sync: ['M4 8h14', 'm14 4 4 4-4 4', 'M20 16H6', 'm10 12-4 4 4 4'],
};
