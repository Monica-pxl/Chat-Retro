const API = import.meta.env.VITE_API_URL ?? '';

export function resolveAvatarUrl(avatar: string | null): string | undefined {
  if (!avatar) return undefined;
  return /^https?:\/\//i.test(avatar) ? avatar : `${API}${avatar}`;
}