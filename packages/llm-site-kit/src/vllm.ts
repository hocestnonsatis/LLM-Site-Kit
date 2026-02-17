/**
 * Doc metadata: same shape as YAML frontmatter in .md / .mdx files.
 * Used for sitemap, agent payload, and MCP.
 */

export interface LLMMeta {
  /** Crawl priority: "high" | "medium" | "low" */
  priority?: 'high' | 'medium' | 'low';
  /** Semantic category for grouping (e.g. "core-concept", "api") */
  category?: string;
  /** Estimated token cost for budgeting */
  token_cost?: number;
  /** Paths that should be read before this doc */
  requires?: string[];
  /** Optional stability: "stable" | "beta" | "deprecated" */
  stability?: 'stable' | 'beta' | 'deprecated';
  /** Optional language tag (e.g. "en", "ja") */
  lang?: string;
}

export interface VLLMModule {
  LLM_Meta?: LLMMeta;
  default: () => string;
}

/**
 * Result of compiling a doc file (.md / .mdx): content (body only) + metadata for sitemap and agent response.
 */
export interface VLLMCompiled {
  content: string;
  meta: LLMMeta;
  /** Resolved path (e.g. /docs/audio-processing) for sitemap and requires. */
  path: string;
}
