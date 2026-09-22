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
  sun: `
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  `,
  moon: `
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  `,
  bell: `
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  `,
  clock: `
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
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
  camera: `
    <path d="M14.5 5 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2Z" />
    <circle cx="12" cy="13" r="3.5" />
  `,
  image: `
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m21 15-5-5L5 20" />
    <path d="m14 13 2 2" />
  `,
  droplets: `
    <path d="M12 3s-5 5.3-5 9a5 5 0 0 0 10 0c0-3.7-5-9-5-9Z" />
    <path d="M5 16c-1.7 1.7-2 3-2 4a3 3 0 0 0 6 0c0-1-2-4-2-4" />
  `,
  flask: `
    <path d="M9 3h6" />
    <path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
    <path d="M7 15h10" />
  `,
  spray: `
    <path d="M8 7h8" />
    <path d="M10 7V4h4v3" />
    <path d="M9 10h6l2 11H7Z" />
    <path d="M16 5h4" />
    <path d="M20 5h2" />
  `,
  shield: `
    <path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z" />
    <path d="m9 12 2 2 4-4" />
  `,
  scissors: `
    <circle cx="6" cy="7" r="3" />
    <circle cx="6" cy="17" r="3" />
    <path d="m8.5 8.5 12 8.5" />
    <path d="m8.5 15.5 12-8.5" />
  `,
  bug: `
    <path d="M8 8h8" />
    <path d="M9 4l1.5 3" />
    <path d="M15 4l-1.5 3" />
    <rect x="7" y="7" width="10" height="12" rx="5" />
    <path d="M4 10h3" />
    <path d="M17 10h3" />
    <path d="M4 15h3" />
    <path d="M17 15h3" />
    <path d="M12 7v12" />
  `,
  alertTriangle: `
    <path d="M12 3 2.5 20h19Z" />
    <path d="M12 9v5" />
    <path d="M12 18h.01" />
  `,
  trash: `
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M7 7l1 14h8l1-14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  `,
  info: `
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <path d="M12 7h.01" />
  `,
  history: `
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  `,
  arrowUp: `
    <path d="M12 20V5" />
    <path d="m6 11 6-6 6 6" />
  `,
  arrowDown: `
    <path d="M12 4v15" />
    <path d="m18 13-6 6-6-6" />
  `,
  receipt: `
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
  `,
  phone: `
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
  `,
  mail: `
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  `,
  messageCircle: `
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.9L3 21l1.7-4.8A8.5 8.5 0 1 1 21 11.5Z" />
  `,
  briefcase: `
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V4h8v3" />
    <path d="M3 12h18" />
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
