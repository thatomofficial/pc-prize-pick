export interface User {
  id: string;
  email: string;
  displayName: string;
  cellPhone: string;
}

/**
 * Accepts South African mobile numbers in either local (`0XXXXXXXXX`) or
 * international (`+27XXXXXXXXX`) form, after stripping spaces / dashes /
 * parens. Returns the canonical `+27...` form, or the cleaned input
 * unchanged when it can't be normalised — leaving validation to reject it.
 */
export const normaliseCellPhone = (raw: string): string => {
  if (!raw) return '';
  const clean = raw.replace(/[\s()\-]/g, '');
  if (/^0\d{9}$/.test(clean)) return `+27${clean.slice(1)}`;
  return clean;
};

export const isValidSaMobile = (normalised: string): boolean =>
  /^\+27[6-8]\d{8}$/.test(normalised);

export const deriveInitials = (displayName: string): string => {
  const parts = displayName
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 2);
  if (parts.length === 0) return '??';
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
};