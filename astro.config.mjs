import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

const DEFAULT_LANG = 'en';
const LANGUAGES = ['en', 'zh'];

export default defineConfig({
  site: 'https://cooking.actfont.top',
  integrations: [tailwind(), mdx(), sitemap()],
  i18n: {
    defaultLocale: DEFAULT_LANG,
    locales: LANGUAGES,
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
