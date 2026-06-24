const X_STATUS_HOSTS = new Set([
  'mobile.twitter.com',
  'twitter.com',
  'www.twitter.com',
  'www.x.com',
  'x.com',
]);

export const normalizeXStatusUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !X_STATUS_HOSTS.has(url.hostname.toLowerCase())
    ) {
      return null;
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const hasStatusRoute =
      pathSegments.length >= 3 &&
      pathSegments[pathSegments.length - 2] === 'status' &&
      /^\d+$/.test(pathSegments[pathSegments.length - 1]);

    if (!hasStatusRoute) return null;

    url.search = '';
    url.hash = '';

    return url.toString();
  } catch {
    return null;
  }
};
