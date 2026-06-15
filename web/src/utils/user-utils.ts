export const USER_FALLBACKS = {
  NAME: "Anonymous User",
  EMAIL: "No email provided",
  IMAGE: "",
  ROLE: "viewer",
} as const;

export function getUserName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) return name;
  if (email && email.trim().length > 0) return email.split("@")[0];
  return USER_FALLBACKS.NAME;
}

export function getUserEmail(email?: string | null): string {
  return email || USER_FALLBACKS.EMAIL;
}

export function getUserImage(image?: string | null): string {
  return image || USER_FALLBACKS.IMAGE;
}

export function getUserRole(role?: string | null): string {
  return role || USER_FALLBACKS.ROLE;
}
