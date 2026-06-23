const SENSITIVE_QUERY_KEY_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /credential/i,
  /authorization/i,
  /^api[-_]?key$/i,
  /^key$/i,
];

export const isSensitiveQueryKey = (key: string): boolean =>
  SENSITIVE_QUERY_KEY_PATTERNS.some((pattern) => pattern.test(key));

export const redactUrlForLogs = (url: string): string => {
  try {
    const isAbsoluteUrl = /^[a-z][a-z\d+\-.]*:\/\//i.test(url);
    const parsedUrl = new URL(url, 'http://nearbyfeed.local');
    const queryEntries = Array.from(parsedUrl.searchParams.entries());

    if (queryEntries.length === 0) {
      return url;
    }

    const query = queryEntries
      .map(([key, value]) => {
        const queryValue = isSensitiveQueryKey(key)
          ? '[redacted]'
          : encodeURIComponent(value);

        return `${encodeURIComponent(key)}=${queryValue}`;
      })
      .join('&');
    const redactedPath = `${parsedUrl.pathname}?${query}${parsedUrl.hash}`;

    return isAbsoluteUrl ? `${parsedUrl.origin}${redactedPath}` : redactedPath;
  } catch {
    return url.replace(
      /([?&][^=&]*(?:token|password|secret|credential|authorization|api[-_]?key)[^=]*=)[^&]*/gi,
      '$1[redacted]',
    );
  }
};
