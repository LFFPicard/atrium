export interface ThemeVars {
  '--color-bg': string;
  '--color-surface': string;
  '--color-sidebar': string;
  '--color-navbar': string;
  '--color-accent': string;
  '--color-accent-text': string;
  '--color-sidebar-text': string;
  '--color-navbar-text': string;
  '--color-button': string;
  '--color-button-text': string;
  '--color-border': string;
  '--color-text': string;
  '--color-text-muted': string;
}

export interface Theme {
  id: string;
  label: string;
  vars: ThemeVars;
}

export const themes: Theme[] = [
  {
    id: 'atrium-dark',
    label: 'Atrium Dark',
    vars: {
      '--color-bg':           '#0a0b0e',
      '--color-surface':      '#12141a',
      '--color-sidebar':      '#0d0f14',
      '--color-navbar':       '#0d0f14',
      '--color-accent':       '#2dd4bf',
      '--color-accent-text':  '#0a0b0e',
      '--color-sidebar-text': '#8892a0',
      '--color-navbar-text':  '#e2e8f0',
      '--color-button':       '#2dd4bf',
      '--color-button-text':  '#0a0b0e',
      '--color-border':       '#1e2330',
      '--color-text':         '#e2e8f0',
      '--color-text-muted':   '#4a5568',
    },
  },
  {
    id: 'plex',
    label: 'Plex',
    vars: {
      '--color-bg':           '#1a1a1a',
      '--color-surface':      '#242424',
      '--color-sidebar':      '#1a1a1a',
      '--color-navbar':       '#1a1a1a',
      '--color-accent':       '#e5a00d',
      '--color-accent-text':  '#000000',
      '--color-sidebar-text': '#a0a0a0',
      '--color-navbar-text':  '#f0f0f0',
      '--color-button':       '#e5a00d',
      '--color-button-text':  '#000000',
      '--color-border':       '#2e2e2e',
      '--color-text':         '#f0f0f0',
      '--color-text-muted':   '#707070',
    },
  },
  {
    id: 'jellyfin',
    label: 'Jellyfin',
    vars: {
      '--color-bg':           '#0d1117',
      '--color-surface':      '#161b27',
      '--color-sidebar':      '#101520',
      '--color-navbar':       '#101520',
      '--color-accent':       '#9b59b6',
      '--color-accent-text':  '#ffffff',
      '--color-sidebar-text': '#7f8ea0',
      '--color-navbar-text':  '#dde3f0',
      '--color-button':       '#9b59b6',
      '--color-button-text':  '#ffffff',
      '--color-border':       '#1e2a40',
      '--color-text':         '#dde3f0',
      '--color-text-muted':   '#445060',
    },
  },
  {
    id: 'nord',
    label: 'Nord',
    vars: {
      '--color-bg':           '#2e3440',
      '--color-surface':      '#3b4252',
      '--color-sidebar':      '#2e3440',
      '--color-navbar':       '#3b4252',
      '--color-accent':       '#88c0d0',
      '--color-accent-text':  '#2e3440',
      '--color-sidebar-text': '#d8dee9',
      '--color-navbar-text':  '#eceff4',
      '--color-button':       '#5e81ac',
      '--color-button-text':  '#eceff4',
      '--color-border':       '#434c5e',
      '--color-text':         '#eceff4',
      '--color-text-muted':   '#7b88a0',
    },
  },
  {
    id: 'amoled',
    label: 'AMOLED',
    vars: {
      '--color-bg':           '#000000',
      '--color-surface':      '#0a0a0a',
      '--color-sidebar':      '#000000',
      '--color-navbar':       '#050505',
      '--color-accent':       '#00c9a7',
      '--color-accent-text':  '#000000',
      '--color-sidebar-text': '#737373',
      '--color-navbar-text':  '#e5e5e5',
      '--color-button':       '#00c9a7',
      '--color-button-text':  '#000000',
      '--color-border':       '#1a1a1a',
      '--color-text':         '#e5e5e5',
      '--color-text-muted':   '#525252',
    },
  },
  {
    id: 'light',
    label: 'Light',
    vars: {
      '--color-bg':           '#f4f7fb',
      '--color-surface':      '#edf0f5',
      '--color-sidebar':      '#ffffff',
      '--color-navbar':       '#ffffff',
      '--color-accent':       '#0d9488',
      '--color-accent-text':  '#ffffff',
      '--color-sidebar-text': '#475569',
      '--color-navbar-text':  '#0f172a',
      '--color-button':       '#0d9488',
      '--color-button-text':  '#ffffff',
      '--color-border':       '#e2e8f0',
      '--color-text':         '#0f172a',
      '--color-text-muted':   '#94a3b8',
    },
  },
];

export const defaultTheme = themes[0];

export function themeToCSS(vars: ThemeVars, overrides?: Partial<ThemeVars>): string {
  const merged = { ...vars, ...overrides };
  const declarations = (Object.entries(merged) as [string, string][])
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
  return `:root { ${declarations} }`;
}
