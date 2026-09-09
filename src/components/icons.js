const icons = {
  home: `
    <path d="M3 10.8 12 3l9 7.8" />
    <path d="M5.5 9.5V21h13V9.5" />
    <path d="M9 21v-7h6v7" />
  `,
  map: `
    <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z" />
    <path d="M8 3v15" />
    <path d="M16 6v15" />
  `,
  sprout: `
    <path d="M12 22V12" />
    <path d="M7 12c-3.5 0-5-2-5-6 4 0 7 1.5 7 5" />
    <path d="M17 12c3.5 0 5-2 5-6-4 0-7 1.5-7 5" />
  `,
  box: `
    <path d="m21 8-9 5-9-5" />
    <path d="M3 8 12 3l9 5v10l-9 5-9-5Z" />
    <path d="M12 13v10" />
  `,
  more: `
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  `,
  plus: `
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  `,
  calendar: `
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M3 10h18" />
  `,
  leaf: `
    <path d="M20 4c-8 0-14 4-14 10 0 3 2 5 5 5 6 0 9-7 9-15Z" />
    <path d="M5 21c2-5 6-8 11-11" />
  `,
  users: `
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  `,
  harvest: `
    <path d="M8 22V8" />
    <path d="M16 22V8" />
    <path d="M8 10C5 10 3 8 3 5c3 0 5 1 5 3" />
    <path d="M16 10c3 0 5-2 5-5-3 0-5 1-5 3" />
    <path d="M8 16c-3 0-5-2-5-5 3 0 5 1 5 3" />
    <path d="M16 16c3 0 5-2 5-5-3 0-5 1-5 3" />
  `,
  cart: `
    <circle cx="9" cy="20" r="1" />
    <circle cx="19" cy="20" r="1" />
    <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 7H6" />
  `,
  chart: `
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  `,
  settings: `
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6V21H10v-.1A1.8 1.8 0 0 0 8.9 19a1.8 1.8 0 0 0-2 .4l-.1.1L4 16.7l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.5H3V10h.1A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1L7 4.1l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10.2 3V3h3.6v.1A1.8 1.8 0 0 0 15 4.7a1.8 1.8 0 0 0 2-.4l.1-.1L20 7l-.1.1a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21 10.2h.1v3.6H21A1.8 1.8 0 0 0 19.4 15Z" />
  `,
  user: `
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  `,
  chevronRight: `
    <path d="m9 18 6-6-6-6" />
  `,
  logout: `
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  `,

  arrowLeft: `
    <path d="m15 18-6-6 6-6" />
    <path d="M9 12h11" />
  `,
  edit: `
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  `,
  archive: `
    <path d="M4 7h16" />
    <path d="M5 7v13h14V7" />
    <path d="M3 3h18v4H3Z" />
    <path d="M9 11h6" />
  `,
  refresh: `
    <path d="M20 6v5h-5" />
    <path d="M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 11" />
    <path d="M17.9 15a7 7 0 0 1-11.6 2.6L4 13" />
  `,
  location: `
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  `,
  ruler: `
    <path d="M4 18 18 4l2 2L6 20H4Z" />
    <path d="m11 11 2 2" />
    <path d="m14 8 2 2" />
    <path d="m8 14 2 2" />
  `,

  layers: `
    <path d="m12 2 9 5-9 5-9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  `,
  search: `
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  `,
  lock: `
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  `,
  clipboard: `
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="M9 9h6" />
    <path d="M9 13h6" />
  `,
};

export function icon(name, className = '') {
  const content = icons[name] || icons.more;

  return `
    <svg
      class="icon ${className}"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      ${content}
    </svg>
  `;
}
