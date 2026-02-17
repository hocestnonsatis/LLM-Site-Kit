/**
 * Build-time search index: TF-IDF / BM25 inverted index.
 * No embeddings; fully local and serializable for zero runtime compute cost.
 */

/** Normalize and split text into terms (lowercase, non-alphanumeric split). */
export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const terms = normalized.split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  return terms;
}

/** Optional: remove common stopwords to reduce index size and noise. */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
]);

export function tokenizeWithStopwords(text: string, removeStopwords = true): string[] {
  const terms = tokenize(text);
  if (!removeStopwords) return terms;
  return terms.filter((t) => !STOPWORDS.has(t));
}

/** Single document in the index (path, summary, length in terms). */
export interface SearchIndexDocument {
  path: string;
  summary: string;
  length: number;
}

/** Posting: docId + term frequency in that doc. */
export interface Posting {
  docId: number;
  tf: number;
}

/** Term entry: IDF and list of (docId, tf). */
export interface TermEntry {
  idf: number;
  postings: Posting[];
}

/** Serializable search index (written at build, read at runtime). */
export interface SearchIndex {
  documents: SearchIndexDocument[];
  terms: Record<string, TermEntry>;
  avgdl: number;
}

/** Input entry for building the index (path, content to index, summary for display). */
export interface IndexInputEntry {
  path: string;
  content: string;
  summary: string;
}

const BM25_K1 = 1.2;
const BM25_B = 0.75;

/**
 * Build BM25 inverted index from compiled doc entries.
 * Indexes content + summary for better match; stores path/summary/length per doc.
 */
export function buildSearchIndex(entries: IndexInputEntry[]): SearchIndex {
  const documents: SearchIndexDocument[] = [];
  const docLengths: number[] = [];
  const termDocFreq: Record<string, Set<number>> = {};
  const termFreqInDoc: Array<Record<string, number>> = [];

  for (let docId = 0; docId < entries.length; docId++) {
    const e = entries[docId];
    const text = `${e.content}\n${e.summary}`;
    const terms = tokenizeWithStopwords(text);
    docLengths.push(terms.length);
    documents.push({
      path: e.path,
      summary: e.summary,
      length: terms.length,
    });

    const tfLocal: Record<string, number> = {};
    for (const t of terms) {
      tfLocal[t] = (tfLocal[t] ?? 0) + 1;
      if (!termDocFreq[t]) termDocFreq[t] = new Set<number>();
      termDocFreq[t].add(docId);
    }
    termFreqInDoc.push(tfLocal);
  }

  const N = documents.length;
  const avgdl = N === 0 ? 0 : docLengths.reduce((a, b) => a + b, 0) / N;

  const terms: Record<string, TermEntry> = {};
  for (const [term, docIds] of Object.entries(termDocFreq)) {
    const n_t = docIds.size;
    const idf = Math.log((N - n_t + 0.5) / (n_t + 0.5) + 1);
    const postings: Posting[] = Array.from(docIds).map((docId) => ({
      docId,
      tf: termFreqInDoc[docId][term],
    }));
    terms[term] = { idf, postings };
  }

  return { documents, terms, avgdl };
}

/**
 * Run BM25 search over the index; returns top-k docs with relevance_score.
 */
export function search(
  index: SearchIndex,
  query: string,
  topK: number = 3
): Array<{ path: string; summary: string; relevance_score: number }> {
  if (index.documents.length === 0) return [];
  const terms = tokenizeWithStopwords(query);
  if (terms.length === 0) return [];

  const scores: number[] = new Array(index.documents.length).fill(0);
  const { documents, terms: termIndex, avgdl } = index;

  for (const term of terms) {
    const entry = termIndex[term];
    if (!entry) continue;
    const { idf, postings } = entry;
    for (const { docId, tf } of postings) {
      const len = documents[docId].length;
      const norm = 1 - BM25_B + BM25_B * (len / avgdl);
      const score = idf * ((tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm));
      scores[docId] += score;
    }
  }

  const withScore = scores
    .map((score, docId) => ({ docId, score }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return withScore.map(({ docId, score }) => ({
    path: documents[docId].path,
    summary: documents[docId].summary,
    relevance_score: Math.round(score * 1000) / 1000,
  }));
}
