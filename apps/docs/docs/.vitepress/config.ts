import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'OtterSeal Docs',
  description: '🦦 Zero-knowledge encrypted notes and secrets',

  themeConfig: {
    logo: '🦦',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Packages', link: '/packages/' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [{ text: 'Overview', link: '/' }],
      },
      {
        text: '@otterseal/core',
        items: [
          { text: 'Overview', link: '/packages/core/' },
          { text: 'Installation', link: '/packages/core/installation' },
          { text: 'API Reference', link: '/packages/core/api' },
        ],
      },
      {
        text: '@otterseal/cli',
        items: [{ text: 'Overview', link: '/packages/cli/' }],
      },
      {
        text: '@otterseal/rest-api',
        items: [{ text: 'Overview', link: '/packages/rest-api/' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/ycmjbot/otterseal' }],

    footer: {
      message: 'Released under the MIT License',
      copyright: 'Copyright © 2026 OtterSeal',
    },
  },
});
