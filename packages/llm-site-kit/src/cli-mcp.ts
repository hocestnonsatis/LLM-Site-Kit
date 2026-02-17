#!/usr/bin/env node
/**
 * CLI: start MCP server with stdio transport using the project's compiled agent docs.
 * Run from project root after build: npx llm-site-mcp
 */

import { createMcpServer } from './mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { join, dirname } from 'path';
import { pathToFileURL } from 'url';
import { existsSync, readFileSync } from 'fs';
import type { SearchIndex } from './search-index.js';

const DEFAULT_GENERATED_PATH = 'src/lib/llm-site-kit/generated.js';

async function loadAgentDocs(cwd: string, generatedPath: string): Promise<Record<string, unknown>> {
  const absolute = join(cwd, generatedPath);
  if (!existsSync(absolute)) {
    throw new Error(
      `Generated docs not found at ${absolute}. Run "npm run build" first so that llm-site-kit can emit the payload.`
    );
  }
  const url = pathToFileURL(absolute).href;
  const mod = await import(url);
  if (!mod.agentDocs || typeof mod.agentDocs !== 'object') {
    throw new Error(`Expected export "agentDocs" from ${generatedPath}`);
  }
  return mod.agentDocs as Record<string, unknown>;
}

function loadSearchIndex(cwd: string, generatedPath: string): SearchIndex | null {
  const genDir = join(cwd, dirname(generatedPath));
  const indexPath = join(genDir, 'search-index.json');
  if (!existsSync(indexPath)) return null;
  try {
    const raw = readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as SearchIndex;
  } catch {
    return null;
  }
}

async function main() {
  const cwd = process.cwd();
  const generatedPath = process.env.LLM_SITE_GENERATED_PATH ?? DEFAULT_GENERATED_PATH;

  const agentDocs = await loadAgentDocs(cwd, generatedPath);
  const searchIndex = loadSearchIndex(cwd, generatedPath);
  const server = createMcpServer(agentDocs as Parameters<typeof createMcpServer>[0], {
    searchIndex: searchIndex ?? undefined,
  });
  const transport = new StdioServerTransport(process.stdin, process.stdout);
  await server.connect(transport);
}

main().catch((err) => {
  console.error('llm-site-mcp:', err instanceof Error ? err.message : err);
  process.exit(1);
});
