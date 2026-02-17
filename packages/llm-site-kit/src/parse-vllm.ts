/**
 * Doc parser: Markdown + YAML frontmatter (.md / .mdx).
 * Re-exports parseMarkdownSource as parseVLLMSource for backward compatibility.
 */

export { parseMarkdownSource, parseMarkdownSource as parseVLLMSource } from './parse-markdown.js';
