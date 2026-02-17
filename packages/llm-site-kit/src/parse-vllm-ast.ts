/**
 * AST-based .vllm parser using acorn.
 * Safely extracts LLM_Meta object and default-export template literal without regex.
 */

import * as acorn from 'acorn';
import { simple as walk } from 'acorn-walk';
import type { LLMMeta } from './vllm.js';

/** Minimal AST node shape for our extraction (acorn uses ESTree; we avoid strict typings for portability). */
interface ASTNode {
  type: string;
  [key: string]: unknown;
}

const ECMA_VERSION = 2024;

/**
 * Convert a simple AST value node to a plain JavaScript value.
 * Supports: Literal, Identifier, ArrayExpression of Literals, ObjectExpression.
 */
function nodeToValue(node: ASTNode | null | undefined): unknown {
  if (!node) return undefined;
  const n = node as Record<string, unknown>;
  switch (node.type) {
    case 'Literal':
      return n.value;
    case 'Identifier':
      return n.name as string;
    case 'ArrayExpression': {
      const elements = (n.elements ?? []) as ASTNode[];
      return elements
        .filter((el): el is ASTNode => el != null && (el as ASTNode).type !== 'SpreadElement')
        .map((el) => nodeToValue(el));
    }
    case 'ObjectExpression': {
      const obj: Record<string, unknown> = {};
      const props = (n.properties ?? []) as ASTNode[];
      for (const prop of props) {
        if (prop.type !== 'Property') continue;
        const keyNode = (prop as Record<string, unknown>).key as ASTNode;
        if (keyNode?.type === 'PrivateIdentifier') continue;
        const key =
          keyNode?.type === 'Identifier'
            ? (keyNode as Record<string, unknown>).name as string
            : keyNode?.type === 'Literal'
              ? String((keyNode as Record<string, unknown>).value)
              : null;
        if (key != null) obj[key] = nodeToValue((prop as Record<string, unknown>).value as ASTNode);
      }
      return obj;
    }
    default:
      return undefined;
  }
}

/**
 * Map raw AST object to LLMMeta (only known fields, type-safe).
 */
function toLLMMeta(obj: Record<string, unknown>): LLMMeta {
  const meta: LLMMeta = {};
  if (typeof obj.priority === 'string') {
    const p = obj.priority.toLowerCase();
    if (p === 'high' || p === 'medium' || p === 'low') meta.priority = p;
  }
  if (typeof obj.category === 'string') meta.category = obj.category;
  if (typeof obj.token_cost === 'number') meta.token_cost = obj.token_cost;
  if (Array.isArray(obj.requires) && obj.requires.every((x): x is string => typeof x === 'string'))
    meta.requires = obj.requires;
  if (typeof obj.stability === 'string') {
    const s = obj.stability.toLowerCase();
    if (s === 'stable' || s === 'beta' || s === 'deprecated') meta.stability = s;
  }
  if (typeof obj.lang === 'string') meta.lang = obj.lang;
  return meta;
}

/**
 * Extract template literal string from a TemplateLiteral node.
 * Uses 'cooked' so escape sequences (e.g. \`) are interpreted; 'raw' would leave backslashes literal.
 */
function getTemplateLiteralString(node: ASTNode): string {
  const r = node as Record<string, unknown>;
  const quasis = (r.quasis ?? []) as Array<{ value: { raw: string; cooked?: string | null } }>;
  const expressions = (r.expressions ?? []) as ASTNode[];
  const parts: string[] = [];
  for (let i = 0; i < quasis.length; i++) {
    const value = quasis[i].value;
    parts.push(value.cooked != null ? value.cooked : value.raw);
    if (i < expressions.length) parts.push('');
  }
  return parts.join('');
}

/**
 * Parse .vllm source with acorn and extract LLM_Meta + default export return value.
 */
export function parseVLLMSource(source: string): { content: string; meta: LLMMeta } {
  const result: { content: string; meta: LLMMeta } = { content: '', meta: {} };

  let ast: acorn.Node;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: ECMA_VERSION,
      sourceType: 'module',
      locations: true,
    });
  } catch (err) {
    throw new Error(
      `Failed to parse .vllm file: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const n = (node: unknown): ASTNode => node as ASTNode;

  walk(ast, {
    ExportNamedDeclaration(node: unknown) {
      const nd = n(node);
      const decl = (nd as Record<string, unknown>).declaration as ASTNode | undefined;
      if (!decl || decl.type !== 'VariableDeclaration') return;
      const decls = ((decl as Record<string, unknown>).declarations ?? []) as ASTNode[];
      for (const d of decls) {
        const id = (d as Record<string, unknown>).id as ASTNode;
        const init = (d as Record<string, unknown>).init as ASTNode | null;
        if (
          d.type === 'VariableDeclarator' &&
          id?.type === 'Identifier' &&
          (id as Record<string, unknown>).name === 'LLM_Meta' &&
          init?.type === 'ObjectExpression'
        ) {
          const value = nodeToValue(init);
          if (value != null && typeof value === 'object' && !Array.isArray(value))
            result.meta = toLLMMeta(value as Record<string, unknown>);
          return;
        }
      }
    },
    ExportDefaultDeclaration(node: unknown) {
      const nd = n(node);
      const decl = (nd as Record<string, unknown>).declaration as ASTNode;
      const isFunc =
        decl?.type === 'FunctionDeclaration' || decl?.type === 'FunctionExpression';
      if (!isFunc || !decl.body || (decl.body as ASTNode).type !== 'BlockStatement') return;
      const body = decl.body as Record<string, unknown>;
      for (const stmt of (body.body ?? []) as ASTNode[]) {
        if (stmt.type === 'ReturnStatement') {
          const arg = (stmt as Record<string, unknown>).argument as ASTNode | null;
          if (arg?.type === 'TemplateLiteral') {
            result.content = getTemplateLiteralString(arg).trim();
            return;
          }
          if (arg?.type === 'Literal') {
            const v = (arg as Record<string, unknown>).value;
            if (typeof v === 'string') result.content = v.trim();
            return;
          }
        }
      }
    },
  });

  return result;
}
