
/**
 * Centralized Route Constants
 * 
 * Use these constants instead of hardcoding route strings (like "/dashboard") 
 * across the application. This makes it much easier to update route structures 
 * in the future.
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  CONTACT: '/contact',
  AUTH_CALLBACK: '/auth/callback',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected Routes
  DASHBOARD: '/dashboard',
  INBOX: '/inbox',
  UPDATE_PASSWORD: '/update-password',
  
  // Dynamic Routes
  /**
   * Generates the URL for a specific document.
   * @param documentId The ID of the document
   */
  DOCUMENT: (documentId: string) => `/dashboard/${documentId}`,

  /**
   * Generates the URL for an invite link.
   * @param token The invite token
   */
  INVITE: (token: string) => `/dashboard/invite?token=${token}`,
} as const;
