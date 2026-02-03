import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'OtterSeal',
  description: '🦦 Zero-knowledge encrypted notes and secrets',
  appearance: 'dark',

  markdown: {
    config(md) {
      const defaultFence = md.renderer.rules.fence;
      md.renderer.rules.fence = (tokens, idx, _options, env, self) => {
        const token = tokens[idx];
        if (token.info === 'mermaid') {
          return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>\n`;
        }
        return defaultFence?.(tokens, idx, _options, env, self) || '';
      };
    },
  },

  themeConfig: {
    logo: '🦦',
    siteTitle: 'OtterSeal',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Packages', link: '/packages/core/' },
      { text: 'Open App', link: process.env.VITE_APP_URL || 'https://otterseal.ycmj.bot' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [{ text: 'Overview', link: '/' }],
      },
      {
        text: '@otterseal/core',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/packages/core/' },
          { text: 'Installation', link: '/packages/core/installation' },
          { text: 'API Reference', link: '/packages/core/api' },
        ],
      },
      {
        text: '@otterseal/cli',
        collapsed: false,
        items: [{ text: 'Overview', link: '/packages/cli/' }],
      },
      {
        text: '@otterseal/rest-api',
        collapsed: false,
        items: [{ text: 'Overview', link: '/packages/rest-api/' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/ycmjbot/otterseal' }],

    footer: {
      message: 'Released under the MIT License',
      copyright: 'Copyright © 2026 OtterSeal by JBot',
    },

    editLink: {
      pattern: 'https://github.com/ycmjbot/otterseal/edit/main/apps/docs/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
