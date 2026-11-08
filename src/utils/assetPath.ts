export function assetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const rawBase =
    (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL || './';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${base}${clean}`;
}
