export const shapes: Record<string, { tag: string; attrs: Record<string, string> }[]> = {
  home: [
    { tag: 'path', attrs: { d: 'M3 10.8 12 3l9 7.8' } },
    { tag: 'path', attrs: { d: 'M5.5 9.5V21h13V9.5' } },
    { tag: 'path', attrs: { d: 'M9 21v-7h6v7' } },
  ],
  map: [
    { tag: 'path', attrs: { d: 'm3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z' } },
    { tag: 'path', attrs: { d: 'M8 3v15' } },
    { tag: 'path', attrs: { d: 'M16 6v15' } },
  ],
  sprout: [
    { tag: 'path', attrs: { d: 'M12 22V12' } },
    { tag: 'path', attrs: { d: 'M7 12c-3.5 0-5-2-5-6 4 0 7 1.5 7 5' } },
    { tag: 'path', attrs: { d: 'M17 12c3.5 0 5-2 5-6-4 0-7 1.5-7 5' } },
  ],
  box: [
    { tag: 'path', attrs: { d: 'm21 8-9 5-9-5' } },
    { tag: 'path', attrs: { d: 'M3 8 12 3l9 5v10l-9 5-9-5Z' } },
    { tag: 'path', attrs: { d: 'M12 13v10' } },
  ],
  more: [
    { tag: 'circle', attrs: { cx: '5', cy: '12', r: '1.2' } },
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '1.2' } },
    { tag: 'circle', attrs: { cx: '19', cy: '12', r: '1.2' } },
  ],
  plus: [
    { tag: 'path', attrs: { d: 'M12 5v14' } },
    { tag: 'path', attrs: { d: 'M5 12h14' } },
  ],
  calendar: [
    { tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '16', rx: '2' } },
    { tag: 'path', attrs: { d: 'M16 3v4' } },
    { tag: 'path', attrs: { d: 'M8 3v4' } },
    { tag: 'path', attrs: { d: 'M3 10h18' } },
  ],
  leaf: [
    { tag: 'path', attrs: { d: 'M20 4c-8 0-14 4-14 10 0 3 2 5 5 5 6 0 9-7 9-15Z' } },
    { tag: 'path', attrs: { d: 'M5 21c2-5 6-8 11-11' } },
  ],
  users: [
    { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
    { tag: 'circle', attrs: { cx: '9', cy: '7', r: '4' } },
    { tag: 'path', attrs: { d: 'M22 21v-2a4 4 0 0 0-3-3.87' } },
    { tag: 'path', attrs: { d: 'M16 3.13a4 4 0 0 1 0 7.75' } },
  ],
  harvest: [
    { tag: 'path', attrs: { d: 'M8 22V8' } },
    { tag: 'path', attrs: { d: 'M16 22V8' } },
    { tag: 'path', attrs: { d: 'M8 10C5 10 3 8 3 5c3 0 5 1 5 3' } },
    { tag: 'path', attrs: { d: 'M16 10c3 0 5-2 5-5-3 0-5 1-5 3' } },
    { tag: 'path', attrs: { d: 'M8 16c-3 0-5-2-5-5 3 0 5 1 5 3' } },
    { tag: 'path', attrs: { d: 'M16 16c3 0 5-2 5-5-3 0-5 1-5 3' } },
  ],
  cart: [
    { tag: 'circle', attrs: { cx: '9', cy: '20', r: '1' } },
    { tag: 'circle', attrs: { cx: '19', cy: '20', r: '1' } },
    { tag: 'path', attrs: { d: 'M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 7H6' } },
  ],
  chart: [
    { tag: 'path', attrs: { d: 'M4 20V10' } },
    { tag: 'path', attrs: { d: 'M10 20V4' } },
    { tag: 'path', attrs: { d: 'M16 20v-7' } },
    { tag: 'path', attrs: { d: 'M22 20H2' } },
  ],
  settings: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
    {
      tag: 'path',
      attrs: {
        d: 'M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6V21H10v-.1A1.8 1.8 0 0 0 8.9 19a1.8 1.8 0 0 0-2 .4l-.1.1L4 16.7l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.5H3V10h.1A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1L7 4.1l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10.2 3V3h3.6v.1A1.8 1.8 0 0 0 15 4.7a1.8 1.8 0 0 0 2-.4l.1-.1L20 7l-.1.1a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21 10.2h.1v3.6H21A1.8 1.8 0 0 0 19.4 15Z',
      },
    },
  ],
  user: [
    { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
    { tag: 'path', attrs: { d: 'M4 21a8 8 0 0 1 16 0' } },
  ],
  chevronRight: [{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }],
  logout: [
    { tag: 'path', attrs: { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' } },
    { tag: 'path', attrs: { d: 'm16 17 5-5-5-5' } },
    { tag: 'path', attrs: { d: 'M21 12H9' } },
  ],
  arrowLeft: [
    { tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } },
    { tag: 'path', attrs: { d: 'M9 12h11' } },
  ],
  edit: [
    { tag: 'path', attrs: { d: 'M12 20h9' } },
    { tag: 'path', attrs: { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z' } },
  ],
  archive: [
    { tag: 'path', attrs: { d: 'M4 7h16' } },
    { tag: 'path', attrs: { d: 'M5 7v13h14V7' } },
    { tag: 'path', attrs: { d: 'M3 3h18v4H3Z' } },
    { tag: 'path', attrs: { d: 'M9 11h6' } },
  ],
  sun: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
    { tag: 'path', attrs: { d: 'M12 2v2' } },
    { tag: 'path', attrs: { d: 'M12 20v2' } },
    { tag: 'path', attrs: { d: 'm4.93 4.93 1.41 1.41' } },
    { tag: 'path', attrs: { d: 'm17.66 17.66 1.41 1.41' } },
    { tag: 'path', attrs: { d: 'M2 12h2' } },
    { tag: 'path', attrs: { d: 'M20 12h2' } },
    { tag: 'path', attrs: { d: 'm6.34 17.66-1.41 1.41' } },
    { tag: 'path', attrs: { d: 'm19.07 4.93-1.41 1.41' } },
  ],
  moon: [{ tag: 'path', attrs: { d: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z' } }],
  bell: [
    { tag: 'path', attrs: { d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9' } },
    { tag: 'path', attrs: { d: 'M10 21h4' } },
  ],
  clock: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
    { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
  ],
  refresh: [
    { tag: 'path', attrs: { d: 'M20 6v5h-5' } },
    { tag: 'path', attrs: { d: 'M4 18v-5h5' } },
    { tag: 'path', attrs: { d: 'M6.1 9a7 7 0 0 1 11.6-2.6L20 11' } },
    { tag: 'path', attrs: { d: 'M17.9 15a7 7 0 0 1-11.6 2.6L4 13' } },
  ],
  location: [
    { tag: 'path', attrs: { d: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z' } },
    { tag: 'circle', attrs: { cx: '12', cy: '10', r: '2.5' } },
  ],
  ruler: [
    { tag: 'path', attrs: { d: 'M4 18 18 4l2 2L6 20H4Z' } },
    { tag: 'path', attrs: { d: 'm11 11 2 2' } },
    { tag: 'path', attrs: { d: 'm14 8 2 2' } },
    { tag: 'path', attrs: { d: 'm8 14 2 2' } },
  ],
  layers: [
    { tag: 'path', attrs: { d: 'm12 2 9 5-9 5-9-5Z' } },
    { tag: 'path', attrs: { d: 'm3 12 9 5 9-5' } },
    { tag: 'path', attrs: { d: 'm3 17 9 5 9-5' } },
  ],
  search: [
    { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
    { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
  ],
  lock: [
    { tag: 'rect', attrs: { x: '5', y: '10', width: '14', height: '11', rx: '2' } },
    { tag: 'path', attrs: { d: 'M8 10V7a4 4 0 0 1 8 0v3' } },
  ],
  camera: [
    {
      tag: 'path',
      attrs: {
        d: 'M14.5 5 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2Z',
      },
    },
    { tag: 'circle', attrs: { cx: '12', cy: '13', r: '3.5' } },
  ],
  image: [
    { tag: 'rect', attrs: { x: '3', y: '4', width: '18', height: '16', rx: '2' } },
    { tag: 'circle', attrs: { cx: '8.5', cy: '9', r: '1.5' } },
    { tag: 'path', attrs: { d: 'm21 15-5-5L5 20' } },
    { tag: 'path', attrs: { d: 'm14 13 2 2' } },
  ],
  droplets: [
    { tag: 'path', attrs: { d: 'M12 3s-5 5.3-5 9a5 5 0 0 0 10 0c0-3.7-5-9-5-9Z' } },
    { tag: 'path', attrs: { d: 'M5 16c-1.7 1.7-2 3-2 4a3 3 0 0 0 6 0c0-1-2-4-2-4' } },
  ],
  flask: [
    { tag: 'path', attrs: { d: 'M9 3h6' } },
    { tag: 'path', attrs: { d: 'M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3' } },
    { tag: 'path', attrs: { d: 'M7 15h10' } },
  ],
  spray: [
    { tag: 'path', attrs: { d: 'M8 7h8' } },
    { tag: 'path', attrs: { d: 'M10 7V4h4v3' } },
    { tag: 'path', attrs: { d: 'M9 10h6l2 11H7Z' } },
    { tag: 'path', attrs: { d: 'M16 5h4' } },
    { tag: 'path', attrs: { d: 'M20 5h2' } },
  ],
  shield: [
    { tag: 'path', attrs: { d: 'M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z' } },
    { tag: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
  ],
  scissors: [
    { tag: 'circle', attrs: { cx: '6', cy: '7', r: '3' } },
    { tag: 'circle', attrs: { cx: '6', cy: '17', r: '3' } },
    { tag: 'path', attrs: { d: 'm8.5 8.5 12 8.5' } },
    { tag: 'path', attrs: { d: 'm8.5 15.5 12-8.5' } },
  ],
  bug: [
    { tag: 'path', attrs: { d: 'M8 8h8' } },
    { tag: 'path', attrs: { d: 'M9 4l1.5 3' } },
    { tag: 'path', attrs: { d: 'M15 4l-1.5 3' } },
    { tag: 'rect', attrs: { x: '7', y: '7', width: '10', height: '12', rx: '5' } },
    { tag: 'path', attrs: { d: 'M4 10h3' } },
    { tag: 'path', attrs: { d: 'M17 10h3' } },
    { tag: 'path', attrs: { d: 'M4 15h3' } },
    { tag: 'path', attrs: { d: 'M17 15h3' } },
    { tag: 'path', attrs: { d: 'M12 7v12' } },
  ],
  alertTriangle: [
    { tag: 'path', attrs: { d: 'M12 3 2.5 20h19Z' } },
    { tag: 'path', attrs: { d: 'M12 9v5' } },
    { tag: 'path', attrs: { d: 'M12 18h.01' } },
  ],
  trash: [
    { tag: 'path', attrs: { d: 'M4 7h16' } },
    { tag: 'path', attrs: { d: 'M9 7V4h6v3' } },
    { tag: 'path', attrs: { d: 'M7 7l1 14h8l1-14' } },
    { tag: 'path', attrs: { d: 'M10 11v6' } },
    { tag: 'path', attrs: { d: 'M14 11v6' } },
  ],
  info: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
    { tag: 'path', attrs: { d: 'M12 11v6' } },
    { tag: 'path', attrs: { d: 'M12 7h.01' } },
  ],
  history: [
    { tag: 'path', attrs: { d: 'M3 12a9 9 0 1 0 3-6.7' } },
    { tag: 'path', attrs: { d: 'M3 4v5h5' } },
    { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
  ],
  arrowUp: [
    { tag: 'path', attrs: { d: 'M12 20V5' } },
    { tag: 'path', attrs: { d: 'm6 11 6-6 6 6' } },
  ],
  arrowDown: [
    { tag: 'path', attrs: { d: 'M12 4v15' } },
    { tag: 'path', attrs: { d: 'm18 13-6 6-6-6' } },
  ],
  receipt: [
    { tag: 'path', attrs: { d: 'M6 3h12v18l-3-2-3 2-3-2-3 2Z' } },
    { tag: 'path', attrs: { d: 'M9 8h6' } },
    { tag: 'path', attrs: { d: 'M9 12h6' } },
  ],
  phone: [
    {
      tag: 'path',
      attrs: {
        d: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z',
      },
    },
  ],
  mail: [
    { tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '14', rx: '2' } },
    { tag: 'path', attrs: { d: 'm3 7 9 6 9-6' } },
  ],
  messageCircle: [
    {
      tag: 'path',
      attrs: {
        d: 'M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.9L3 21l1.7-4.8A8.5 8.5 0 1 1 21 11.5Z',
      },
    },
  ],
  briefcase: [
    { tag: 'rect', attrs: { x: '3', y: '7', width: '18', height: '13', rx: '2' } },
    { tag: 'path', attrs: { d: 'M8 7V4h8v3' } },
    { tag: 'path', attrs: { d: 'M3 12h18' } },
  ],
  clipboard: [
    { tag: 'rect', attrs: { x: '5', y: '4', width: '14', height: '17', rx: '2' } },
    { tag: 'path', attrs: { d: 'M9 4.5V3h6v1.5' } },
    { tag: 'path', attrs: { d: 'M9 9h6' } },
    { tag: 'path', attrs: { d: 'M9 13h6' } },
  ],
};
