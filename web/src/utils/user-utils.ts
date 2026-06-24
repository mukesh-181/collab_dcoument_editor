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
  return email ?? USER_FALLBACKS.EMAIL;
}

export function getUserImage(image?: string | null): string {
  return image || USER_FALLBACKS.IMAGE;
}

export function getUserRole(role?: string | null): string {
  return role || USER_FALLBACKS.ROLE;
}

export interface UserLike {
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  image?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

export function extractUserInfo(user?: UserLike | null, role?: string | null) {
  if (!user) {
    return {
      name: USER_FALLBACKS.NAME,
      email: USER_FALLBACKS.EMAIL,
      image: USER_FALLBACKS.IMAGE,
      role: getUserRole(role),
    };
  }

  const rawName = user.user_metadata?.full_name || user.full_name || user.name;
  const rawImage = user.user_metadata?.avatar_url || user.avatar_url || user.image;

  return {
    name: getUserName(rawName, user.email),
    email: getUserEmail(user.email),
    image: getUserImage(rawImage),
    role: getUserRole(role || user.role)
  };
}
