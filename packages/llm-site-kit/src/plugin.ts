/**
 * Vite plugin: .vllm resolution, agent middleware, llm-sitemap.json generation.
 */

import type { Plugin } from 'vite';
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { parseVLLMSource } from './parse-vllm.js';
import { isAgentRequest } from './agent.js';
import type { VLLMCompiled } from './vllm.js';
import { generateLLMSitemap } from './sitemap.js';
import { estimateTokenCost } from './tokens.js';
import { buildSearchIndex } from './search-index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const warnedDeps = new Set<string>();

/**
 * Validate that every `requires` target exists in the built doc set.
 * Logs a warning once per (entry, required) pair per process so agents are not sent to missing routes.
 */
function validateDependencyGraph(entries: VLLMCompiled[]): void {
  const paths = new Set(entries.map((e) => e.path));
  for (const entry of entries) {
    const requires = entry.meta.requires ?? [];
    for (const req of requires) {
      const normalized = req.replace(/\/$/, '') || req;
      if (!paths.has(normalized)) {
        const key = `${entry.path} -> ${req}`;
        if (!warnedDeps.has(key)) {
          warnedDeps.add(key);
          console.warn(
            `[llm-site-kit] Dependency warning: "${entry.path}" requires "${req}", but no .vllm file resolves to that path. Agents may hit a broken link.`
          );
        }
      }
    }
  }
}

export interface LLMSiteKitOptions {
  /** Root directory for .vllm files (relative to project root). Default "src/docs" */
  docsDir?: string;
  /** URL path prefix for doc routes (e.g. /docs). Default "/docs" */
  basePath?: string;
  /** Custom agent User-Agent patterns */
  agentPatterns?: string[];
  /**
   * Path (relative to project root) to write the agent-docs payload module for production.
   * Used by SvelteKit hooks.server.ts to serve agent JSON. Default "src/lib/llm-site-kit/generated.js"
   */
  generatedModulePath?: string;
  /**
   * Directory to emit llm-sitemap.json (relative to project root). Default "static" if path exists, else "dist"
   */
  sitemapOutputDir?: string;
  /**
   * Build a static BM25 search index from .vllm docs and write search-index.json next to generated.js.
   * Enables the MCP tool search_documentation. Default false (opt-in) to avoid longer builds on large doc sets.
   */
  enableSearchIndex?: boolean;
}

const DEFAULT_DOCS_DIR = 'src/docs';
const DEFAULT_BASE_PATH = '/docs';
const DEFAULT_GENERATED_MODULE = 'src/lib/llm-site-kit/generated.js';

export function llmSiteKit(options: LLMSiteKitOptions = {}): Plugin {
  const docsDir = options.docsDir ?? DEFAULT_DOCS_DIR;
  const basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/$/, '');
  const generatedModulePath = options.generatedModulePath ?? DEFAULT_GENERATED_MODULE;
  const root = process.cwd();
  const docsFullPath = resolve(root, docsDir);

  let resolvedRoot: string;

  function collectEntries(): VLLMCompiled[] {
    const entries: VLLMCompiled[] = [];
    const docsPath = resolve(resolvedRoot ?? root, docsDir);
    if (!existsSync(docsPath)) return entries;
    function walk(dir: string, prefix: string) {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, name.name);
        if (name.isDirectory()) walk(full, `${prefix}${name.name}/`);
        else if (name.name.endsWith('.vllm')) {
          const source = readFileSync(full, 'utf-8');
          const { content, meta } = parseVLLMSource(source);
          const pathName = (prefix + name.name.replace(/\.vllm$/, '')).replace(/\/$/, '') || 'index';
          const routePath = `${basePath}/${pathName}`.replace(/\/+/g, '/');
          entries.push({ content, meta, path: routePath });
        }
      }
    }
    walk(docsPath, '');
    return entries;
  }

  function writeGeneratedFiles(projectRoot: string) {
    const entries: VLLMCompiled[] = [];
    const docsPath = resolve(projectRoot, docsDir);
    if (!existsSync(docsPath)) return;
    function walk(dir: string, prefix: string) {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, name.name);
        if (name.isDirectory()) walk(full, `${prefix}${name.name}/`);
        else if (name.name.endsWith('.vllm')) {
          const source = readFileSync(full, 'utf-8');
          const { content, meta } = parseVLLMSource(source);
          const pathName = (prefix + name.name.replace(/\.vllm$/, '')).replace(/\/$/, '') || 'index';
          const routePath = `${basePath}/${pathName}`.replace(/\/+/g, '/');
          entries.push({ content, meta, path: routePath });
        }
      }
    }
    walk(docsPath, '');
    if (entries.length === 0) return;

    validateDependencyGraph(entries);
    const sitemap = generateLLMSitemap(entries, { baseUrl: '' });
    const outSitemapDir =
      options.sitemapOutputDir ??
      (existsSync(resolve(projectRoot, 'static')) ? 'static' : 'dist');
    const sitemapDir = resolve(projectRoot, outSitemapDir);
    mkdirSync(sitemapDir, { recursive: true });
    writeFileSync(
      resolve(sitemapDir, 'llm-sitemap.json'),
      JSON.stringify(sitemap, null, 2),
      'utf-8'
    );

    const payload: Record<string, { content: string; meta: VLLMCompiled['meta'] & { path: string }; data_llm_require?: string[] }> = {};
    for (const e of entries) {
      const token_cost = e.meta.token_cost != null && e.meta.token_cost >= 0 ? e.meta.token_cost : estimateTokenCost(e.content);
      payload[e.path] = {
        content: e.content,
        meta: { ...e.meta, path: e.path, token_cost },
        data_llm_require: e.meta.requires?.length ? e.meta.requires : undefined,
      };
    }
    const genPath = resolve(projectRoot, generatedModulePath);
    const genDir = resolve(genPath, '..');
    mkdirSync(genDir, { recursive: true });
    writeFileSync(
      genPath,
      `/** Generated by llm-site-kit at build time. Do not edit. */\nexport const agentDocs = ${JSON.stringify(payload)};\n`,
      'utf-8'
    );

    if (options.enableSearchIndex && entries.length > 0) {
      const indexInput = entries.map((e) => ({
        path: e.path,
        content: e.content,
        summary:
          e.content.trimStart().split('\n')[0]?.trim().replace(/^#+\s*/, '').slice(0, 120) ?? '',
      }));
      const searchIndex = buildSearchIndex(indexInput);
      writeFileSync(
        resolve(genDir, 'search-index.json'),
        JSON.stringify(searchIndex),
        'utf-8'
      );
    }
  }

  return {
    name: 'llm-site-kit',
    enforce: 'pre',

    config(config, env) {
      const projectRoot = config.root ?? root;
      writeGeneratedFiles(projectRoot);
    },

    configResolved(config) {
      resolvedRoot = config.root;
    },

    buildStart() {
      resolvedRoot = resolvedRoot ?? root;
      writeGeneratedFiles(resolvedRoot);
    },

    resolveId(id: string) {
      if (id.endsWith('.vllm')) return id;
      return null;
    },

    load(id: string) {
      if (!id.endsWith('.vllm')) return null;
      const root = resolvedRoot ?? process.cwd();
      const fsPath = id.startsWith(root) ? id : resolve(root, id.replace(/^\//, ''));
      try {
        const source = readFileSync(fsPath, 'utf-8');
        const { content, meta } = parseVLLMSource(source);
        const docsFull = resolve(root, docsDir);
        const relativePath = relative(docsFull, fsPath).replace(/\\/g, '/');
        const pathName = relativePath.replace(/\.vllm$/, '').replace(/\/index$/, '') || 'index';
        const routePath = `${basePath}/${pathName}`.replace(/\/+/g, '/');
        const out: VLLMCompiled = { content, meta, path: routePath };
        return `export default ${JSON.stringify(out)};`;
      } catch {
        return null;
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req: { url?: string; method?: string; headers: Record<string, string | string[] | undefined> }, res, next) => {
        if (!req.url || req.method !== 'GET') return next();

        const request = new Request(`http://${req.headers.host}${req.url}`, {
          headers: req.headers as HeadersInit,
        });
        if (!isAgentRequest(request)) return next();

        const pathname = req.url.replace(/\?.*$/, '');
        const base = basePath + '/';
        if (!pathname.startsWith(base) && pathname !== basePath) return next();

        const segment = pathname === basePath ? 'index' : pathname.slice(base.length);
        const docsFull = resolve(resolvedRoot, docsDir);
        const vllmPath = resolve(docsFull, `${segment}.vllm`);
        const vllmPathIndex = resolve(docsFull, segment, 'index.vllm');

        let source: string | null = null;
        if (existsSync(vllmPath)) {
          source = readFileSync(vllmPath, 'utf-8');
        } else if (existsSync(vllmPathIndex)) {
          source = readFileSync(vllmPathIndex, 'utf-8');
        }
        if (!source) return next();

        const { content, meta } = parseVLLMSource(source);
        const token_cost = meta.token_cost != null && meta.token_cost >= 0 ? meta.token_cost : estimateTokenCost(content);
        const payload = {
          content,
          meta: { ...meta, path: pathname, token_cost },
          data_llm_require: meta.requires,
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(JSON.stringify(payload));
      });
    },

    writeBundle() {
      const entries = collectEntries();
      if (entries.length === 0) return;
      validateDependencyGraph(entries);
      const sitemap = generateLLMSitemap(entries, { baseUrl: '' });
      const outDir =
        options.sitemapOutputDir ??
        (existsSync(resolve(resolvedRoot, 'static')) ? 'static' : 'dist');
      const sitemapDir = resolve(resolvedRoot, outDir);
      mkdirSync(sitemapDir, { recursive: true });
      writeFileSync(
        resolve(sitemapDir, 'llm-sitemap.json'),
        JSON.stringify(sitemap, null, 2),
        'utf-8'
      );
      if (options.enableSearchIndex) {
        const genDir = resolve(resolvedRoot, dirname(generatedModulePath));
        const indexInput = entries.map((e) => ({
          path: e.path,
          content: e.content,
          summary:
            e.content.trimStart().split('\n')[0]?.trim().replace(/^#+\s*/, '').slice(0, 120) ?? '',
        }));
        const searchIndex = buildSearchIndex(indexInput);
        mkdirSync(genDir, { recursive: true });
        writeFileSync(
          resolve(genDir, 'search-index.json'),
          JSON.stringify(searchIndex),
          'utf-8'
        );
      }
    },
  };
}
