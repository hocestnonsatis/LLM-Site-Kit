/**
 * Zero-config MCP web handler: SSE + Streamable HTTP in a single handler.
 * Use from SvelteKit hooks.server.ts for path /mcp (GET /mcp/sse, POST /mcp/messages).
 */

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './mcp.js';
import type { AgentDocsMap } from './mcp.js';
import type { SearchIndex } from './search-index.js';

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

let cached: {
  server: ReturnType<typeof createMcpServer>;
  transport: WebStandardStreamableHTTPServerTransport;
} | null = null;

async function getOrCreateServerAndTransport(
  agentDocs: AgentDocsMap,
  searchIndex?: SearchIndex | null
): Promise<WebStandardStreamableHTTPServerTransport> {
  if (cached) return cached.transport;
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  const server = createMcpServer(agentDocs, { searchIndex: searchIndex ?? undefined });
  await server.connect(transport);
  cached = { server, transport };
  return transport;
}

/**
 * Handle MCP HTTP requests: GET /mcp/sse (SSE stream) and POST /mcp/messages (JSON-RPC).
 * Returns a Response with CORS headers (Access-Control-Allow-Origin: *) applied.
 * Use in SvelteKit handle() when event.url.pathname.startsWith('/mcp').
 */
export async function handleMcpRequest(
  request: Request,
  agentDocs: AgentDocsMap,
  searchIndex?: SearchIndex | null
): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/mcp/sse' && request.method === 'GET') {
    const transport = await getOrCreateServerAndTransport(agentDocs, searchIndex);
    const response = await transport.handleRequest(request);
    return withCors(response);
  }

  if (pathname === '/mcp/messages' && request.method === 'POST') {
    const transport = await getOrCreateServerAndTransport(agentDocs, searchIndex);
    const response = await transport.handleRequest(request);
    return withCors(response);
  }

  const notFound = new Response(JSON.stringify({ error: 'Not Found', path: pathname }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
  return notFound;
}
