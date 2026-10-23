/**
 * Normalises home page frontmatter into the view model the Orbit home renders.
 *
 * Every visible string comes from frontmatter so locales translate the page
 * without touching components. Locales that still use the VitePress default
 * `hero` / `features` fields keep working: `hero.name` becomes the headline,
 * `hero.text` the gradient accent, and the feature list maps one to one.
 * Sections without a legacy equivalent (frameworks, packages, footer columns)
 * render only when their frontmatter block exists. `markdownContent: false`
 * hides the markdown body below the frontmatter.
 */

export interface HomeLink {
  text: string;
  link: string;
}

export interface HomeAction extends HomeLink {
  theme: 'brand' | 'alt';
}

export interface HomeHero {
  badge?: string;
  title: string;
  accent?: string;
  tagline?: string;
  logo: { src: string; alt: string };
  actions: HomeAction[];
  install: { command: string; copyLabel: string; copiedLabel: string };
}

export interface HomeShowcase {
  file: string;
  copyLabel: string;
  copiedLabel: string;
  shellTitle: string;
  routeLabel: string;
  mountedLabel: string;
  busLabel: string;
}

export interface HomeFeature {
  icon?: string;
  title: string;
  details: string;
  link?: string;
  linkText?: string;
}

export interface HomeSection<T> {
  eyebrow?: string;
  title?: string;
  lead?: string;
  items: T[];
}

export interface HomeFramework {
  name: string;
  details: string;
  install: string;
  /** Short monogram shown in the tile; defaults to the first letter of `name`. */
  mark: string;
  /** Palette key for the accent colour (`react`, `vue`, `svelte`, `angular`); other values use the brand accent. */
  color: string;
  link?: string;
}

export interface HomePackage {
  name: string;
  details: string;
  link?: string;
}

export interface HomeFooter {
  tagline?: string;
  columns: { title: string; links: HomeLink[] }[];
  copyright?: string;
}

export interface HomeModel {
  hero: HomeHero;
  showcase: HomeShowcase;
  features: HomeSection<HomeFeature>;
  frameworks?: HomeSection<HomeFramework> & {
    copyLabel: string;
    copiedLabel: string;
  };
  packages?: HomeSection<HomePackage>;
  footer: HomeFooter;
  /** False when frontmatter sets `markdownContent: false`; the page body is then not rendered. */
  showMarkdown: boolean;
}

export interface HomeDefaults {
  /** Theme logo path, used when the hero has no image of its own. */
  logo?: string;
  siteTitle?: string;
}

export const DEFAULT_INSTALL_COMMAND = 'npx create-tuvix-app';

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function dict(value: unknown): Dict {
  return isDict(value) ? value : {};
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function list(value: unknown): Dict[] {
  return Array.isArray(value) ? value.filter(isDict) : [];
}

function link(value: unknown): HomeLink | undefined {
  const d = dict(value);
  const text = str(d.text);
  const href = str(d.link);
  return text && href ? { text, link: href } : undefined;
}

function section<T>(
  value: unknown,
  mapItem: (item: Dict) => T | undefined
): HomeSection<T> {
  const d = dict(value);
  return {
    eyebrow: str(d.eyebrow),
    title: str(d.title),
    lead: str(d.lead),
    items: list(d.items)
      .map(mapItem)
      .filter((item): item is T => item !== undefined),
  };
}

function resolveHero(fm: Dict, defaults: HomeDefaults): HomeHero {
  const hero = dict(fm.hero);
  const image = isDict(hero.image) ? hero.image : {};
  const install = dict(hero.install);
  const siteTitle = defaults.siteTitle ?? 'Tuvix.js';
  const title = str(hero.title) ?? str(hero.name) ?? siteTitle;
  // Legacy frontmatter: `name` is the headline and `text` the accent line.
  const accent = str(hero.title)
    ? str(hero.accent)
    : (str(hero.accent) ?? str(hero.text));

  const actions = list(hero.actions)
    .map((action): HomeAction | undefined => {
      const base = link(action);
      if (!base) return undefined;
      return { ...base, theme: action.theme === 'brand' ? 'brand' : 'alt' };
    })
    .filter((action): action is HomeAction => action !== undefined);

  return {
    badge: str(hero.badge),
    title,
    accent,
    tagline: str(hero.tagline),
    logo: {
      src: str(image.src) ?? defaults.logo ?? '/logo.svg',
      alt: str(image.alt) ?? siteTitle,
    },
    actions,
    install: {
      command: str(install.command) ?? DEFAULT_INSTALL_COMMAND,
      copyLabel: str(install.copyLabel) ?? 'Copy command',
      copiedLabel: str(install.copiedLabel) ?? 'Copied',
    },
  };
}

function resolveShowcase(fm: Dict): HomeShowcase {
  const s = dict(fm.showcase);
  return {
    file: str(s.file) ?? 'src/orchestrator.ts',
    copyLabel: str(s.copyLabel) ?? 'Copy',
    copiedLabel: str(s.copiedLabel) ?? 'Copied',
    shellTitle: str(s.shellTitle) ?? 'Host shell',
    routeLabel: str(s.routeLabel) ?? 'URL',
    mountedLabel: str(s.mountedLabel) ?? 'mounted',
    busLabel: str(s.busLabel) ?? 'Shared event bus',
  };
}

function resolveFeatures(fm: Dict): HomeSection<HomeFeature> {
  const heading = dict(fm.featuresSection);
  const mapFeature = (item: Dict): HomeFeature | undefined => {
    const title = str(item.title);
    const details = str(item.details);
    if (!title || !details) return undefined;
    return {
      icon: str(item.icon),
      title,
      details,
      link: str(item.link),
      linkText: str(item.linkText),
    };
  };
  return {
    eyebrow: str(heading.eyebrow),
    title: str(heading.title),
    lead: str(heading.lead),
    items: list(fm.features)
      .map(mapFeature)
      .filter((item): item is HomeFeature => item !== undefined),
  };
}

function resolveFrameworks(fm: Dict): HomeModel['frameworks'] {
  if (!isDict(fm.frameworks)) return undefined;
  const result = section(fm.frameworks, (item): HomeFramework | undefined => {
    const name = str(item.name);
    const details = str(item.details);
    const install = str(item.install);
    if (!name || !details || !install) return undefined;
    return {
      name,
      details,
      install,
      link: str(item.link),
      mark: str(item.mark) ?? name.charAt(0).toUpperCase(),
      color: str(item.color) ?? name.toLowerCase(),
    };
  });
  if (result.items.length === 0) return undefined;
  const d = fm.frameworks;
  return {
    ...result,
    copyLabel: str(d.copyLabel) ?? 'Copy install command',
    copiedLabel: str(d.copiedLabel) ?? 'Copied',
  };
}

function resolvePackages(fm: Dict): HomeModel['packages'] {
  if (!isDict(fm.packages)) return undefined;
  const result = section(fm.packages, (item): HomePackage | undefined => {
    const name = str(item.name);
    const details = str(item.details);
    if (!name || !details) return undefined;
    return { name, details, link: str(item.link) };
  });
  return result.items.length > 0 ? result : undefined;
}

function resolveFooter(fm: Dict): HomeFooter {
  const f = dict(fm.footer);
  return {
    tagline: str(f.tagline),
    copyright: str(f.copyright),
    columns: list(f.columns)
      .map((column) => {
        const title = str(column.title);
        const links = list(column.links)
          .map(link)
          .filter((l): l is HomeLink => l !== undefined);
        return title && links.length > 0 ? { title, links } : undefined;
      })
      .filter((c): c is HomeFooter['columns'][number] => c !== undefined),
  };
}

/** Builds the Orbit home view model from page frontmatter. */
export function resolveHome(
  frontmatter: unknown,
  defaults: HomeDefaults = {}
): HomeModel {
  const fm = dict(frontmatter);
  return {
    hero: resolveHero(fm, defaults),
    showcase: resolveShowcase(fm),
    features: resolveFeatures(fm),
    frameworks: resolveFrameworks(fm),
    packages: resolvePackages(fm),
    footer: resolveFooter(fm),
    showMarkdown: fm.markdownContent !== false,
  };
}

/** True for links that leave the docs site (rendered with `target="_blank"`). */
export function isExternal(href: string): boolean {
  return (
    /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(href) || href.startsWith('mailto:')
  );
}
