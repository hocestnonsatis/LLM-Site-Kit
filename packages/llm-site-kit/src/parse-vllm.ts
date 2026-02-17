/**
 * .vllm parser: re-exports AST-based implementation.
 * Use parse-vllm-ast.ts for the actual acorn-based parser.
 */

export { parseVLLMSource } from './parse-vllm-ast.js';
