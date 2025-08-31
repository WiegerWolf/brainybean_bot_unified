export const ALLOWED_PREFIXES = Object.freeze(['image/', 'video/', 'audio/'] as const);
export const ALLOWED_EXACT = Object.freeze(['text/plain', 'application/pdf'] as const);
export function isAllowedMime(type: string | null | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase();
  return ALLOWED_PREFIXES.some(p => t.startsWith(p)) || ALLOWED_EXACT.includes(t as any);
}