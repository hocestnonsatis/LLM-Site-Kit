/**
 * Markdown + YAML frontmatter parser for .md / .mdx docs.
 * Uses gray-matter: frontmatter → LLM_Meta, rest → content.
 */

import matter from 'gray-matter';
import type { LLMMeta } from './vllm.js';

function toLLMMeta(data: Record<string, unknown>): LLMMeta {
  const meta: LLMMeta = {};
  if (typeof data.priority === 'string') {
    const p = data.priority.toLowerCase();
    if (p === 'high' || p === 'medium' || p === 'low') meta.priority = p;
  }
  if (typeof data.category === 'string') meta.category = data.category;
  if (typeof data.token_cost === 'number') meta.token_cost = data.token_cost;
  if (Array.isArray(data.requires) && data.requires.every((x): x is string => typeof x === 'string'))
    meta.requires = data.requires;
  if (typeof data.stability === 'string') {
    const s = data.stability.toLowerCase();
    if (s === 'stable' || s === 'beta' || s === 'deprecated') meta.stability = s;
  }
  if (typeof data.lang === 'string') meta.lang = data.lang;
  return meta;
}

/**
 * Parse a Markdown or MDX source string with YAML frontmatter.
 * Returns content (body only, frontmatter excluded) and meta (LLMMeta shape).
 * Token estimation and sitemap should use content only.
 */
export function parseMarkdownSource(source: string): { content: string; meta: LLMMeta } {
  const { data, content } = matter(source);
  const meta = toLLMMeta((data || {}) as Record<string, unknown>);
  return { content: content.trim(), meta };
}
