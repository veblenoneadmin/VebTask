import { useOrganization } from '../contexts/OrganizationContext';

/**
 * Enhanced fetch wrapper that automatically includes organization context
 */
export function createApiClient() {
  return {
    async fetch(url, options = {}) {
      // Get current organization context
      const { currentOrg } = useOrganization();
      
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
 * Hook to get API client with organization context
 */
export function useApiClient() {
  return createApiClient();
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