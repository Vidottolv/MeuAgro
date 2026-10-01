import { createApp, h } from 'vue';
import AppShell from './AppShell.vue';
// The existing router owns URLs and guards; Vue owns the complete mounted interface.
export function withShell({ content, ...shell }) {
  const id = /id="([a-z0-9-]+)"/.exec(content || '')?.[1] || 'vue-page-root';
  return (Page, props = {}) =>
    createApp({
      render: () => h(AppShell, shell, { default: () => h('div', { id }, [h(Page, props)]) }),
    });
}
