// Génère les tokens Kadro depuis la source unique : design/maquette/src/lib.mjs (THEMES).
// Sorties : dist/tokens.css (variables CSS, clair + sombre), dist/index.mjs + index.d.ts (objet TS
// pour le mobile), dist/tokens.json. Relancer après toute retouche de la maquette.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../../design/maquette/src/lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'dist');
mkdirSync(out, { recursive: true });

// Constantes du système visuel qui ne vivent pas dans THEMES (voir CLAUDE.md).
const radius = { card: 14, control: 10 };
const font = {
  family: 'Geist, "Helvetica Neue", Arial, system-ui, sans-serif',
  features: '"tnum" 1, "cv11" 1',
};
const iconStrokeWidth = 1.75;

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Variables CSS d'un thème — couleurs scalaires uniquement (ni `mode`, ni `av`). */
function cssVars(theme, indent) {
  return Object.entries(theme)
    .filter(([k, v]) => typeof v === 'string' && k !== 'mode')
    .map(([k, v]) => `${indent}--${kebab(k)}: ${v};`)
    .join('\n');
}

const staticVars = (indent) =>
  [
    `${indent}--radius-card: ${radius.card}px;`,
    `${indent}--radius-control: ${radius.control}px;`,
    `${indent}--font-family: ${font.family};`,
  ].join('\n');

const css = `/* Généré par @kadro/tokens — source : design/maquette/src/lib.mjs. Ne pas éditer. */
:root {
  color-scheme: light dark;
${cssVars(THEMES.light, '  ')}
${staticVars('  ')}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${cssVars(THEMES.dark, '    ')}
  }
}
:root[data-theme="dark"] {
${cssVars(THEMES.dark, '  ')}
}
`;

const tokens = { themes: THEMES, radius, font, iconStrokeWidth };

const mjs = `// Généré par @kadro/tokens — source : design/maquette/src/lib.mjs. Ne pas éditer.
export const themes = ${JSON.stringify(THEMES, null, 2)};
export const radius = ${JSON.stringify(radius)};
export const font = ${JSON.stringify(font)};
export const iconStrokeWidth = ${iconStrokeWidth};
`;

const dts = `// Généré par @kadro/tokens. Ne pas éditer.
export interface ThemeColors {
  mode: 'light' | 'dark';
  bg: string; surface: string; surface2: string; line: string; lineStrong: string;
  ink: string; ink2: string; ink3: string;
  accent: string; accentSoft: string; accentInk: string;
  good: string; goodSoft: string; warn: string; warnSoft: string; bad: string; badSoft: string;
  neutralSoft: string; darkCard: string; darkCardBar: string; darkCardInk2: string;
  btnPrimaryBg: string; btnPrimaryInk: string; navActive: string;
  av: Record<string, [string, string]>;
}
export declare const themes: { light: ThemeColors; dark: ThemeColors };
export declare const radius: { card: number; control: number };
export declare const font: { family: string; features: string };
export declare const iconStrokeWidth: number;
`;

writeFileSync(join(out, 'tokens.css'), css);
writeFileSync(join(out, 'tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
writeFileSync(join(out, 'index.mjs'), mjs);
writeFileSync(join(out, 'index.d.ts'), dts);
console.log('@kadro/tokens → dist/tokens.css · tokens.json · index.mjs · index.d.ts');
