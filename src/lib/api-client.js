import { useOrganization } from '../contexts/OrganizationContext';

/**
 * @typedef {Object} ApiClient
 * @property {function(string, Object=): Promise<any>} fetch - Enhanced fetch with org context
 */

/**
 * Enhanced fetch wrapper that automatically includes organization context
 * @returns {ApiClient}
 */
export function createApiClient() {
  // Deprecated - use useApiClient() instead which properly handles React context
  return {
    async fetch(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
  };
}

/**
 * Hook to get API client with organization context
 * @returns {ApiClient}
 */
export function useApiClient() {
  // Get organization context at hook level
  let currentOrg = null;
  try {
    const orgContext = useOrganization();
    currentOrg = orgContext.currentOrg;
  } catch (error) {
    console.warn('Organization context not available in useApiClient');
  }
  
  return {
    async fetch(url, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Add organization ID as header if available
      if (currentOrg?.id) {
        headers['X-Org-Id'] = currentOrg.id;
      }
      
      // Also add as query parameter for backward compatibility
      const urlWithOrg = currentOrg?.id ? 
        `${url}${url.includes('?') ? '&' : '?'}orgId=${currentOrg.id}` : 
        url;
      
      const response = await fetch(urlWithOrg, {
        ...options,
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
  };
}

/**
 * Simple fetch wrapper that doesn't require React context (for server-side use)
 */
export async function apiCall(url, options = {}, orgId = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}