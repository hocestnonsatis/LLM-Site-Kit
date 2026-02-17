/**
 * llm-sitemap.json: machine-first sitemap with token weights, summaries, and relationships.
 */

import type { VLLMCompiled } from './vllm.js';
import { estimateTokenCost } from './tokens.js';

export interface LLMSitemapEntry {
  path: string;
  token_cost: number;
  requires: string[];
  priority?: string;
  category?: string;
  stability?: string;
  summary: string;
}

export interface LLMSitemap {
  version: '1.0';
  base_url?: string;
  entries: LLMSitemapEntry[];
  generated_at: string;
}

function summarize(content: string, maxLen: number = 120): string {
  const firstLine = content.trimStart().split('\n')[0]?.trim() ?? '';
  if (firstLine.startsWith('#')) return firstLine.replace(/^#+\s*/, '').trim();
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen - 3) + '...';
}

/**
 * Build sitemap entries with guaranteed path, token_cost (manual or estimated), requires, priority, summary.
 */
export function generateLLMSitemap(
  compiled: VLLMCompiled[],
  options: { baseUrl?: string } = {}
): LLMSitemap {
  const entries: LLMSitemapEntry[] = compiled.map(({ path, content, meta }) => {
    const token_cost =
      meta.token_cost != null && meta.token_cost >= 0
        ? meta.token_cost
        : estimateTokenCost(content);
    return {
      path,
      token_cost,
      requires: meta.requires ?? [],
      priority: meta.priority,
      category: meta.category,
      stability: meta.stability,
      summary: summarize(content),
    };
  });

  return {
    version: '1.0',
    base_url: options.baseUrl || undefined,
    entries,
    generated_at: new Date().toISOString(),
  };
}
