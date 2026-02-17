import { sveltekit } from '@sveltejs/kit/vite';
import { llmSiteKit } from 'llm-site-kit';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    llmSiteKit({
      docsDir: 'src/docs',
      basePath: '/docs',
      generatedModulePath: 'src/lib/llm-site-kit/generated.js',
      sitemapOutputDir: 'static',
      enableSearchIndex: true,
    }),
  ],
};

export default config;
