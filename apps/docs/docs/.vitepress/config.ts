import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'OtterSeal',
  description: '🦦 Zero-knowledge encrypted notes and secrets',
  appearance: 'dark',

  themeConfig: {
    logo: '🦦',
    siteTitle: 'OtterSeal',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Packages', link: '/packages/core/' },
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
      copyright: 'Copyright © 2026 OtterSeal',
    },

    editLink: {
      pattern: 'https://github.com/ycmjbot/otterseal/edit/main/apps/docs/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
