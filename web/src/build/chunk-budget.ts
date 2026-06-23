export type BuildChunk = {
  code: string;
  fileName: string;
  name?: string;
  type: 'chunk';
};

export type BuildBundle = Record<
  string,
  BuildChunk | { fileName: string; type: string }
>;

export type OversizedChunk = {
  fileName: string;
  name: string;
  sizeKb: number;
};

const APP_CHUNK_BUDGET_BYTES = 500 * 1024;
const LARGE_LAZY_CHUNK_NAMES = new Set(['mapbox']);

export const getOversizedAppChunks = (
  bundle: BuildBundle,
  budgetBytes = APP_CHUNK_BUDGET_BYTES,
): OversizedChunk[] =>
  Object.values(bundle)
    .filter((entry): entry is BuildChunk => entry.type === 'chunk')
    .filter((chunk) => !LARGE_LAZY_CHUNK_NAMES.has(chunk.name ?? ''))
    .map((chunk) => ({
      fileName: chunk.fileName,
      name: chunk.name ?? chunk.fileName,
      sizeKb: Math.round(chunk.code.length / 1024),
    }))
    .filter((chunk) => chunk.sizeKb * 1024 > budgetBytes);

export const formatChunkBudgetError = (chunks: OversizedChunk[]): string =>
  [
    'App chunk budget exceeded. Keep large SDKs lazy and app chunks under 500 KiB:',
    ...chunks.map(
      (chunk) => `- ${chunk.fileName} (${chunk.sizeKb} KiB, ${chunk.name})`,
    ),
  ].join('\n');
