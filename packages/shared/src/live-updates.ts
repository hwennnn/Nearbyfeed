import { normalizeXStatusUrl } from './x-status-url';

export type LiveUpdateSource = 'x';

export type NormalizedLiveUpdate = {
  id: string;
  occurredAt: string | null;
  source: LiveUpdateSource;
  summary: string;
  tags: string[];
  title: string;
  url: string;
};

export type LiveUpdateNormalizationOptions = {
  maxCount?: number;
  maxSummaryLength?: number;
  maxTagCount?: number;
  maxTagLength?: number;
  maxTitleLength?: number;
};

const DEFAULT_MAX_COUNT = 8;
const DEFAULT_MAX_TITLE_LENGTH = 90;
const DEFAULT_MAX_SUMMARY_LENGTH = 240;
const DEFAULT_MAX_TAG_COUNT = 6;
const DEFAULT_MAX_TAG_LENGTH = 24;

const parseJsonResult = (resultJson: unknown): unknown => {
  if (typeof resultJson !== 'string') return resultJson;

  try {
    return JSON.parse(resultJson);
  } catch {
    return resultJson;
  }
};

const toBase64Url = (value: string): string => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = Array.from(value).map((character) => character.charCodeAt(0));
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const triplet = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    output += alphabet[(triplet >> 18) & 63];
    output += alphabet[(triplet >> 12) & 63];
    output += second === undefined ? '=' : alphabet[(triplet >> 6) & 63];
    output += third === undefined ? '=' : alphabet[triplet & 63];
  }

  return output.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const sanitizeText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;

  const normalized = value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.length === 0) return null;

  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 3)}...`;
};

const normalizeOccurredAt = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeTags = (
  value: unknown,
  maxTagCount: number,
  maxTagLength: number,
): string[] => {
  if (!Array.isArray(value)) return [];

  const tags: string[] = [];
  const seenTags = new Set<string>();

  for (const rawTag of value) {
    if (tags.length >= maxTagCount) break;

    const tag = sanitizeText(rawTag, maxTagLength);
    if (tag === null || seenTags.has(tag)) continue;

    seenTags.add(tag);
    tags.push(tag);
  }

  return tags;
};

const normalizeLiveUpdate = (
  rawUpdate: unknown,
  index: number,
  options: Required<LiveUpdateNormalizationOptions>,
): NormalizedLiveUpdate | null => {
  if (rawUpdate === null || typeof rawUpdate !== 'object') return null;

  const update = rawUpdate as Partial<NormalizedLiveUpdate>;
  const title = sanitizeText(update.title, options.maxTitleLength);
  const summary = sanitizeText(update.summary, options.maxSummaryLength);
  const url = normalizeXStatusUrl(update.url);

  if (title === null || summary === null || url === null) return null;

  return {
    id: `x-${index}-${toBase64Url(url)}`,
    occurredAt: normalizeOccurredAt(update.occurredAt),
    source: 'x',
    summary,
    tags: normalizeTags(update.tags, options.maxTagCount, options.maxTagLength),
    title,
    url,
  };
};

export const normalizeLiveUpdates = (
  resultJson: unknown,
  options: LiveUpdateNormalizationOptions = {},
): NormalizedLiveUpdate[] => {
  const resolvedOptions = {
    maxCount: options.maxCount ?? DEFAULT_MAX_COUNT,
    maxSummaryLength:
      options.maxSummaryLength ?? DEFAULT_MAX_SUMMARY_LENGTH,
    maxTagCount: options.maxTagCount ?? DEFAULT_MAX_TAG_COUNT,
    maxTagLength: options.maxTagLength ?? DEFAULT_MAX_TAG_LENGTH,
    maxTitleLength: options.maxTitleLength ?? DEFAULT_MAX_TITLE_LENGTH,
  };
  const parsedResult = parseJsonResult(resultJson);
  const rawUpdates = Array.isArray(parsedResult)
    ? parsedResult
    : Array.isArray((parsedResult as { updates?: unknown }).updates)
      ? (parsedResult as { updates: unknown[] }).updates
      : [];

  const seenUrls = new Set<string>();
  const updates: NormalizedLiveUpdate[] = [];

  for (const rawUpdate of rawUpdates) {
    if (updates.length >= resolvedOptions.maxCount) break;

    const update = normalizeLiveUpdate(
      rawUpdate,
      updates.length,
      resolvedOptions,
    );
    if (update === null || seenUrls.has(update.url)) continue;

    seenUrls.add(update.url);
    updates.push(update);
  }

  return updates;
};
