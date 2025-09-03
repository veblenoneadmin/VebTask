// Internal system configuration
export const INTERNAL_CONFIG = {
  // Organization settings
  ORGANIZATION: {
    name: 'Veblen',
    slug: 'veblen',
    ownerId: '53ebe8d8-4700-43b0-aae7-f30608cd3b66', // Tony's user ID
    ownerEmail: 'tony@opusautomations.com'
  },
  
  // System mode
  MODE: 'internal', // 'internal' | 'multi-tenant'
  
  // Features enabled for internal use
  FEATURES: {
    publicRegistration: false,
    multipleOrganizations: false,
    organizationCreation: false, // Only admin can manage
    selfServiceInvites: false,
    publicAccess: false
  },
  
  // Admin settings
  ADMIN: {
    defaultRole: 'STAFF',
    allowedRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    requireAdminApproval: true
  },
  
  // UI customization
  UI: {
    hideOrganizationSwitcher: true,
    hideCreateOrganization: true,
    showAdminNavigation: true,
    brandingName: 'VebTask - Veblen Internal'
  }
};

// Check if user is system administrator
export const isSystemAdmin = (userEmail) => {
  const adminEmails = [
    'tony@opusautomations.com',
    'admin@veblen.com.au'
  ];
  return adminEmails.includes(userEmail?.toLowerCase());
};

// Check if user has admin access to organization
export const hasAdminAccess = (userRole) => {
  return ['OWNER', 'ADMIN'].includes(userRole);
};

// Get user permissions based on role
export const getUserPermissions = (userRole) => {
  const permissions = {
    OWNER: {
      canManageUsers: true,
      canManageSettings: true,
      canViewReports: true,
      canManageProjects: true,
      canManageTasks: true,
      canManageClients: true,
      canManageInvoices: true,
      canExportData: true,
      canDeleteData: true
    },
    ADMIN: {
      canManageUsers: true,
      canManageSettings: true,
      canViewReports: true,
      canManageProjects: true,
      canManageTasks: true,
      canManageClients: true,
      canManageInvoices: true,
      canExportData: true,
      canDeleteData: false
    },
    STAFF: {
      canManageUsers: false,
      canManageSettings: false,
      canViewReports: true,
      canManageProjects: true,
      canManageTasks: true,
      canManageClients: false,
      canManageInvoices: false,
      canExportData: false,
      canDeleteData: false
    },
    CLIENT: {
      canManageUsers: false,
      canManageSettings: false,
      canViewReports: false,
      canManageProjects: false,
      canManageTasks: false,
      canManageClients: false,
      canManageInvoices: false,
      canExportData: false,
      canDeleteData: false
    }
  };
  
  return permissions[userRole] || permissions.CLIENT;
};