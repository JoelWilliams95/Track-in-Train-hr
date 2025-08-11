import { LogEntry } from '@/app/api/logs/route';

type LogCategory = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'SEARCH' | 'FILTER' | 'EXPORT' | 'OTHER';
type LogSeverity = 'INFO' | 'WARNING' | 'ERROR';

interface LogParams {
  user: string;
  action: string;
  details: string;
  target?: string;
  category?: LogCategory;
  severity?: LogSeverity;
}

// Client-side logging function
export async function logAction(params: LogParams): Promise<void> {
  // Only log in browser environment and if all required params are present
  if (typeof window === 'undefined' || !params?.user || !params?.action) return;

  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: params.user,
        action: params.action,
        details: params.details || '',
        target: params.target || '',
        category: params.category || 'OTHER',
        severity: params.severity || 'INFO',
      }),
    });

    if (!response.ok) {
      // Silently fail for logging errors to avoid disrupting user experience
      // Only log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to log action:', response.status, response.statusText);
      }
    }
  } catch (error) {
    // Silently fail for logging errors to avoid disrupting user experience
    // Only log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error logging action:', error);
    }
  }
}

// Predefined logging functions for common actions
export const Logger = {
  // Profile operations
  profileCreated: (user: string, profileName: string) =>
    logAction({
      user,
      action: 'Profile Created',
      details: `Created new profile for ${profileName}`,
      target: profileName,
      category: 'CREATE',
      severity: 'INFO',
    }),

  profileUpdated: (user: string, profileName: string, field: string, oldValue: string, newValue: string) =>
    logAction({
      user,
      action: 'Profile Updated',
      details: `Updated ${field} from "${oldValue}" to "${newValue}"`,
      target: profileName,
      category: 'UPDATE',
      severity: 'INFO',
    }),

  profileDeleted: (user: string, profileName: string) =>
    logAction({
      user,
      action: 'Profile Deleted',
      details: `Deleted profile for ${profileName}`,
      target: profileName,
      category: 'DELETE',
      severity: 'WARNING',
    }),

  profileViewed: (user: string, profileName: string) =>
    logAction({
      user,
      action: 'Profile Viewed',
      details: `Viewed profile details for ${profileName}`,
      target: profileName,
      category: 'VIEW',
      severity: 'INFO',
    }),

  // Comments
  commentAdded: (user: string, profileName: string, comment: string) =>
    logAction({
      user,
      action: 'Comment Added',
      details: `${user} commented on ${profileName}'s profile: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
      target: profileName,
      category: 'CREATE',
      severity: 'INFO',
    }),

  // Authentication
  userLogin: (user: string) =>
    logAction({
      user,
      action: 'User Login',
      details: `User ${user} logged into the system`,
      category: 'LOGIN',
      severity: 'INFO',
    }),

  userLogout: (user: string) =>
    logAction({
      user,
      action: 'User Logout',
      details: `User ${user} logged out of the system`,
      category: 'LOGOUT',
      severity: 'INFO',
    }),

  // Search and filtering
  searchPerformed: (user: string, searchTerm: string, resultsCount: number) =>
    logAction({
      user,
      action: 'Search Performed',
      details: `Searched for "${searchTerm}" - ${resultsCount} results found`,
      category: 'SEARCH',
      severity: 'INFO',
    }),

  filterApplied: (user: string, filterType: string, filterValue: string) =>
    logAction({
      user,
      action: 'Filter Applied',
      details: `Applied ${filterType} filter: ${filterValue}`,
      category: 'FILTER',
      severity: 'INFO',
    }),


  // Training and tests
  trainingUpdated: (user: string, profileName: string, trainingType: string, completed: boolean) =>
    logAction({
      user,
      action: 'Training Updated',
      details: `Marked ${trainingType} training as ${completed ? 'completed' : 'incomplete'}`,
      target: profileName,
      category: 'UPDATE',
      severity: 'INFO',
    }),

  testScheduled: (user: string, profileName: string, testDate: string) =>
    logAction({
      user,
      action: 'Test Scheduled',
      details: `Scheduled test for ${testDate}`,
      target: profileName,
      category: 'UPDATE',
      severity: 'INFO',
    }),

  testResultUpdated: (user: string, profileName: string, result: string) =>
    logAction({
      user,
      action: 'Test Result Updated',
      details: `Test result set to: ${result}`,
      target: profileName,
      category: 'UPDATE',
      severity: 'INFO',
    }),

  // Status changes
  statusChanged: (user: string, profileName: string, oldStatus: string, newStatus: string) =>
    logAction({
      user,
      action: 'Status Changed',
      details: `Status changed from "${oldStatus}" to "${newStatus}"`,
      target: profileName,
      category: 'UPDATE',
      severity: newStatus === 'Departed' ? 'WARNING' : 'INFO',
    }),

  // Departure
  profileDeparted: (user: string, profileName: string, reason: string, date: string) =>
    logAction({
      user,
      action: 'Profile Departed',
      details: `Marked as departed on ${date}. Reason: ${reason}`,
      target: profileName,
      category: 'UPDATE',
      severity: 'WARNING',
    }),

  // System events
  systemError: (user: string, error: string, context: string) =>
    logAction({
      user,
      action: 'System Error',
      details: `Error in ${context}: ${error}`,
      category: 'OTHER',
      severity: 'ERROR',
    }),

  dataExport: (user: string, exportType: string, recordCount: number) =>
    logAction({
      user,
      action: 'Data Export',
      details: `Exported ${recordCount} records as ${exportType}`,
      category: 'EXPORT',
      severity: 'INFO',
    }),
};

// Get current user from session/cookie
export function getCurrentUser(): string {
  if (typeof window === 'undefined') return 'System';
  
  // Try to get from cookie first
  const match = document.cookie.match(/userName=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  
  // Fallback to sessionStorage
  return sessionStorage.getItem('userName') || 'Unknown User';
}
