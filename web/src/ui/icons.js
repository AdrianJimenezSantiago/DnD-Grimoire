const P = {
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="m11 7 1.5 3 1.5-3"/>',
  quill: '<path d="M20 3c-6 1-11 6-13 13l-1 5 5-1c7-2 12-7 13-13"/><path d="M7 16c3-1 6-3 8-6"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 3-2 4-4 5"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  star: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.3-5 6.5-5s5.7 1.6 6.5 5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.5 5"/>',
  print: '<path d="M7 9V3h10v6M7 18H4v-7h16v7h-3"/><path d="M7 14h10v7H7Z"/>',
  save: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.5-5.8L4 8.5M4 4v4.5h4.5"/>',
  candle: '<path d="M9 21h6V11H9Z"/><path d="M12 11V9"/><path d="M12 3c1.6 2 2 3.2 0 5-2-1.8-1.6-3 0-5Z"/>',
  sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7Z"/>',
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

export const ASTROLABE = `<svg class="astrolabe" viewBox="0 0 340 340" aria-hidden="true"><g fill="none" stroke="currentColor">
  <circle cx="170" cy="170" r="164" stroke-width="1"/><circle cx="170" cy="170" r="150" stroke-width=".6" stroke-dasharray="2 6"/>
  <g class="spin"><circle cx="170" cy="170" r="118" stroke-width="1"/><ellipse cx="170" cy="170" rx="118" ry="46" stroke-width=".8"/>
  <ellipse cx="170" cy="170" rx="46" ry="118" stroke-width=".8"/><path d="M170 30v280M30 170h280" stroke-width=".5"/>
  <circle cx="288" cy="170" r="5" fill="currentColor"/><circle cx="170" cy="52" r="3" fill="currentColor"/></g>
  <circle cx="170" cy="170" r="70" stroke-width="1"/><circle cx="170" cy="170" r="10" stroke-width="1"/></g></svg>`;
