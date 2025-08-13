// Role-Based Access Control utilities

export interface UserPermissions {
  canAddUsers: boolean;
  canAddProfiles: boolean;
  canViewAllProfiles: boolean;
  canManageSystem: boolean;
}

export interface UserSession {
  userName: string;
  userRole: string;
  userZone: string;
  permissions: UserPermissions;
}

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

// Get current user session information
export function getCurrentUserSession(): UserSession | null {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  const userName = getCookie('userName');
  const userRole = getCookie('userRole');
  const userZone = getCookie('userZone');
  const permissionsStr = getCookie('userPermissions');

  if (!userName || !userRole) return null;

  let permissions: UserPermissions;
  try {
    permissions = permissionsStr ? JSON.parse(permissionsStr) : {
      canAddUsers: false,
      canAddProfiles: false,
      canViewAllProfiles: false,
      canManageSystem: false
    };
  } catch {
    permissions = {
      canAddUsers: false,
      canAddProfiles: false,
      canViewAllProfiles: false,
      canManageSystem: false
    };
  }

  return {
    userName,
    userRole,
    userZone: userZone || '',
    permissions
  };
}

// Check if user can add users
export function canAddUsers(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.permissions.canAddUsers || false;
}

// Check if user can add profiles
export function canAddProfiles(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.permissions.canAddProfiles || false;
}

// Check if user can view all profiles
export function canViewAllProfiles(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.permissions.canViewAllProfiles || false;
}

// Check if user can manage system
export function canManageSystem(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.permissions.canManageSystem || false;
}

// Check if user is SuperAdmin
export function isSuperAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.userRole === 'SuperAdmin' || false;
}

// Check if user is Admin
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.userRole === 'Admin' || false;
}

// Check if user is SuperAdmin or Admin
export function isSuperAdminOrAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const session = getCurrentUserSession();
  return session?.userRole === 'SuperAdmin' || session?.userRole === 'Admin' || false;
}

// Filter profiles based on user permissions and zone
export function filterProfilesByAccess(profiles: any[]): any[] {
  if (typeof window === 'undefined') return profiles; // Return all profiles on server-side
  const session = getCurrentUserSession();
  if (!session) return [];

  // SuperAdmin and Admin can see all profiles
  if (session.permissions.canViewAllProfiles || session.userRole === 'SuperAdmin' || session.userRole === 'Admin') {
    return profiles;
  }

  // Regular users can only see profiles from their zone that have started training
  // (status: Waiting for test, Employed, Departed)
  const allowedStatuses = ['Waiting for test', 'Employed', 'Departed'];
  
  return profiles.filter(profile => {
    // Must be from the same zone
    const isSameZone = profile.zone === session.userZone;
    
    // Must have started training (not Recruit or In-Training)
    const hasStartedTraining = allowedStatuses.includes(profile.status);
    
    return isSameZone && hasStartedTraining;
  });
}

// Get user's zone
export function getUserZone(): string {
  const session = getCurrentUserSession();
  return session?.userZone || '';
}

// Get user's role
export function getUserRole(): string {
  const session = getCurrentUserSession();
  return session?.userRole || '';
}

// Check if user has specific permission
export function hasPermission(permission: keyof UserPermissions): boolean {
  const session = getCurrentUserSession();
  return session?.permissions[permission] || false;
}

// Server-side permission check (for API routes)
export function checkServerPermissions(cookies: any): UserSession | null {
  const userName = cookies.get('userName')?.value;
  const userRole = cookies.get('userRole')?.value;
  const userZone = cookies.get('userZone')?.value;
  const permissionsStr = cookies.get('userPermissions')?.value;

  if (!userName || !userRole) return null;

  let permissions: UserPermissions;
  try {
    permissions = permissionsStr ? JSON.parse(permissionsStr) : {
      canAddUsers: false,
      canAddProfiles: false,
      canViewAllProfiles: false,
      canManageSystem: false
    };
  } catch {
    permissions = {
      canAddUsers: false,
      canAddProfiles: false,
      canViewAllProfiles: false,
      canManageSystem: false
    };
  }

  return {
    userName,
    userRole,
    userZone: userZone || '',
    permissions
  };
}
