/**
 * MCP (Model Context Protocol) server that exposes compiled documentation
 * as tools for LLMs: list pages, read page content, and search (when index is enabled).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SearchIndex } from './search-index.js';
import { search } from './search-index.js';

/** Single doc entry as produced by the plugin (generated.js payload). */
export interface AgentDocEntry {
  content: string;
  meta: {
    path: string;
    token_cost?: number;
    priority?: string;
    category?: string;
    [key: string]: unknown;
  };
  data_llm_require?: string[];
}

export type AgentDocsMap = Record<string, AgentDocEntry>;

function summaryFromContent(content: string, maxLen: number = 120): string {
  const first = content.trimStart().split('\n')[0]?.trim() ?? '';
  if (first.startsWith('#')) return first.replace(/^#+\s*/, '').trim();
  if (first.length <= maxLen) return first;
  return first.slice(0, maxLen - 3) + '...';
}

export interface CreateMcpServerOptions {
  /** When set, enables search_documentation tool using the pre-built BM25 index. */
  searchIndex?: SearchIndex | null;
}

/**
 * Create an MCP server that serves the given agentDocs with:
 * - list_documentation_pages: list all paths with summary and token_cost
 * - read_documentation_page: get content, meta, and requires for a path
 * - search_documentation: (optional) top-3 pages by relevance when searchIndex is provided
 */
export function createMcpServer(
  agentDocs: AgentDocsMap,
  options: CreateMcpServerOptions = {}
): McpServer {
  const { searchIndex } = options;
  const server = new McpServer(
    {
      name: 'llm-site-kit',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.tool(
    'list_documentation_pages',
    'List all documentation pages available on this site. Returns path, short summary, and token cost for each. Use this to discover what the site offers before reading specific pages.',
    {},
    async () => {
      const pages = Object.entries(agentDocs).map(([path, entry]) => ({
        path,
        summary: summaryFromContent(entry.content),
        token_cost: entry.meta?.token_cost ?? Math.ceil(entry.content.length / 4),
      }));
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ pages }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'read_documentation_page',
    'Read the full content and metadata of a single documentation page. Use the exact path returned by list_documentation_pages. Returns raw content, meta (including token_cost, priority), and required reading (data_llm_require) if any.',
    {
      path: z.string().describe('Document path, e.g. /docs/setup or /docs/core'),
    },
    async ({ path }) => {
      const normalized = path.replace(/\/$/, '') || path;
      const entry = agentDocs[normalized];
      if (!entry) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Page not found',
                path: normalized,
                available_paths: Object.keys(agentDocs),
              }),
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                content: entry.content,
                meta: entry.meta,
                data_llm_require: entry.data_llm_require,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  if (searchIndex) {
    server.tool(
      'search_documentation',
      'Search documentation by natural language query. Returns the top-3 most relevant pages with path, summary, and relevance_score. Use this to find pages before reading them in full.',
      { query: z.string().describe('Search query, e.g. "how to install" or "API authentication"') },
      async ({ query }) => {
        const results = search(searchIndex, query, 3);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ results }, null, 2),
            },
          ],
        };
      }
    );
  }

  return server;
}
