export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const THEME_OPTIONS = [
  {
    value: THEMES.LIGHT,
    label: 'Claro',
    description:
      'Visual padrão do Meu Agro, com fundo claro.',
    iconName: 'sun',
  },
  {
    value: THEMES.DARK,
    label: 'Escuro',
    description:
      'Fundo escuro e menor luminosidade para uso noturno.',
    iconName: 'moon',
  },
];

const STORAGE_KEY =
  'meu-agro:appearance-theme';

const THEME_COLORS = {
  [THEMES.LIGHT]: '#1f5d3a',
  [THEMES.DARK]: '#0f1511',
};

export function normalizeTheme(
  value,
) {
  return value === THEMES.DARK
    ? THEMES.DARK
    : THEMES.LIGHT;
}

export function getStoredTheme() {
  try {
    return normalizeTheme(
      window.localStorage.getItem(
        STORAGE_KEY,
      ),
    );
  } catch {
    return THEMES.LIGHT;
  }
}

export function getCurrentTheme() {
  return normalizeTheme(
    document.documentElement
      .dataset.theme ||
    getStoredTheme(),
  );
}

export function applyTheme(
  theme,
  {
    persist = false,
  } = {},
) {
  const normalized =
    normalizeTheme(theme);

  document.documentElement
    .dataset.theme =
    normalized;

  document.documentElement
    .style.colorScheme =
    normalized;

  const themeColor =
    document.querySelector(
      'meta[name="theme-color"]',
    );

  if (themeColor) {
    themeColor.setAttribute(
      'content',
      THEME_COLORS[
        normalized
      ],
    );
  }

  if (persist) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        normalized,
      );
    } catch {
      // O tema ainda é aplicado na sessão atual.
    }
  }

  window.dispatchEvent(
    new CustomEvent(
      'meu-agro:theme-change',
      {
        detail: {
          theme:
            normalized,
        },
      },
    ),
  );

  return normalized;
}

export function setTheme(
  theme,
) {
  return applyTheme(
    theme,
    {
      persist: true,
    },
  );
}

export function initializeTheme() {
  return applyTheme(
    getStoredTheme(),
    {
      persist: false,
    },
  );
}
