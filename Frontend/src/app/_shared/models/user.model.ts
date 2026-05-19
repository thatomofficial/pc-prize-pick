export interface User {
  id: string;
  email: string;
  displayName: string;
}

export const deriveInitials = (displayName: string): string => {
  const parts = displayName
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 2);
  if (parts.length === 0) return '??';
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
};
