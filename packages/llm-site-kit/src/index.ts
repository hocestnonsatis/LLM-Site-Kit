/**
 * LLM-Site-Kit: Vite-powered, headless web framework for LLMs and autonomous AI agents.
 */

export { llmSiteKit } from './plugin.js';
export type { LLMSiteKitOptions } from './plugin.js';
export { isAgentRequest, LLM_CLIENT_HEADER, ACCEPT_LLM_JSON } from './agent.js';
export type { AgentDetectionOptions } from './agent.js';
export type { LLMMeta, VLLMModule, VLLMCompiled } from './vllm.js';
export { parseMarkdownSource, parseVLLMSource } from './parse-vllm.js';
export { generateLLMSitemap } from './sitemap.js';
export type { LLMSitemap, LLMSitemapEntry } from './sitemap.js';
export { estimateTokenCost, DEFAULT_CHARS_PER_TOKEN } from './tokens.js';
export { createMcpServer } from './mcp.js';
export type { AgentDocEntry, AgentDocsMap, CreateMcpServerOptions } from './mcp.js';
export { handleMcpRequest } from './mcp-web.js';
export { buildSearchIndex, search, tokenize } from './search-index.js';
export type { SearchIndex, SearchIndexDocument, IndexInputEntry } from './search-index.js';
