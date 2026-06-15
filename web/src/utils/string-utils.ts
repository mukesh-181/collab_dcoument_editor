/**
 * Extracts initials from a user's name or email.
 * If name is available, it returns the first letter of the first and last name (if present).
 * If name is empty but email is available, it returns the first letter of the email.
 * Fallback is '?'.
 * 
 * @param name - The user's full name
 * @param email - The user's email address
 * @returns A string of 1 or 2 uppercase characters
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim()[0].toUpperCase();
  }

  if (email && email.trim().length > 0) {
    return email.trim()[0].toUpperCase();
  }

  return '?';
}
