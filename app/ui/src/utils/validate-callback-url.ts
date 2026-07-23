import { paths } from '~/paths';

/**
 * Get all available routes from the paths object
 * Recursively extracts all route paths
 */
function getAllAvailableRoutes(): string[] {
  const routes: string[] = [];
  const PROTECTED_KEYS = ['index', 'signIn', 'signOut', 'notAuthorized', 'notFound', 'serverError'];

  const extractRoutes = (obj: any): void => {
    if (typeof obj === 'function') {
      // It's a path function, call it to get the actual path
      try {
        const path = obj();
        if (typeof path === 'string') {
          routes.push(path);
        }
      } catch (e) {
        // Some paths might require parameters, skip them
      }
    } else if (typeof obj === 'object' && obj !== null) {
      // Recursively process nested objects
      Object.entries(obj).forEach(([key, value]) => {
        // Skip internal keys
        if (!key.startsWith('_') && !PROTECTED_KEYS.includes(key)) {
          extractRoutes(value);
        }
      });
    }
  };

  // Start extraction from paths object
  extractRoutes(paths);

  // Remove duplicates and sort
  return Array.from(new Set(routes)).sort();
}

/**
 * Validate if a callback URL is a valid, available route
 *
 * @param callbackUrl - The URL to validate (e.g., '/home-screen' or '/core/customer')
 * @returns true if the URL is a valid available route, false otherwise
 *
 * @example
 * isValidCallbackUrl('/home-screen') // true
 * isValidCallbackUrl('/core/customer') // true
 * isValidCallbackUrl('/nonexistent-page') // false
 * isValidCallbackUrl('https://evil.com') // false (external URLs not allowed)
 * isValidCallbackUrl('') // false (empty URLs not allowed)
 */
export function isValidCallbackUrl(callbackUrl: string | string[] | undefined): boolean {
  // Ensure it's a string
  if (!callbackUrl || typeof callbackUrl !== 'string' || callbackUrl.trim().length === 0) {
    return false;
  }

  // Prevent external URLs and protocol-based redirects
  if (
    callbackUrl.startsWith('http://') ||
    callbackUrl.startsWith('https://') ||
    callbackUrl.startsWith('//')
  ) {
    return false;
  }

  // Ensure it starts with /
  if (!callbackUrl.startsWith('/')) {
    return false;
  }

  // Remove query params and hash for comparison
  const urlPath = callbackUrl.split('?')[0].split('#')[0];

  // Get all available routes
  const availableRoutes = getAllAvailableRoutes();

  // Check if the URL path matches any available route
  // Support exact match or as parent path for nested routes
  return availableRoutes.some(
    (route) => route === urlPath || urlPath.startsWith(route + '/')
  );
}

/**
 * Get list of all available routes (useful for debugging)
 */
export function getAvailableRoutes(): string[] {
  return getAllAvailableRoutes();
}
