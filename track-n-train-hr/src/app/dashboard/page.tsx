"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getCookie } from '@/lib/cookies';
import { StatsSkeleton, ListSkeleton, PageSkeleton } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  Download, 
  Eye, 
  EyeOff,
  Edit3,
  Trash2,
  Crown,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface User {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  role: string;
  zone: string;
  position?: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  // Training related fields
  trainingStartDate?: string;
  trainingEndDate?: string;
  formationStatus?: string;
  status?: string;
}

export default function Dashboard() {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [stats, setStats] = useState({ activeUsers: 0, totalUsers: 0, recentLogins: 0, adminCount: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Check if user has access to dashboard
    const userRole = getCookie('userRole');
    setCurrentUserRole(userRole || '');
    
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      router.push('/profiles');
      return;
    }

    // Fetch users
    fetchUsers();
  }, [router]);

  // Calculate stats from users data
  const getStats = () => {
    const activeUsers = users.filter(u => u.isActive).length;
    const totalUsers = users.length;
    const recentLogins = users.filter(u => {
      if (!u.lastLogin) return false;
      const loginDate = new Date(u.lastLogin);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return loginDate > weekAgo;
    }).length;
    const adminCount = users.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin').length;
    
    return { activeUsers, totalUsers, recentLogins, adminCount };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return <Crown className="w-4 h-4" />;
      case 'Admin': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return darkMode ? 'text-purple-300 bg-purple-900/20 border-purple-700' : 'text-purple-800 bg-purple-100 border-purple-200';
      case 'Admin': return darkMode ? 'text-blue-300 bg-blue-900/20 border-blue-700' : 'text-blue-800 bg-blue-100 border-blue-200';
      default: return darkMode ? 'text-gray-300 bg-gray-700/20 border-gray-600' : 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  useEffect(() => {
    if (users.length > 0) {
      setStats(getStats());
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?dashboard=true');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        // The API returns logs directly as an array, not wrapped in an object
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const exportLogsToCSV = () => {
    if (logs.length === 0) {
      alert('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'User', 'Action', 'Category', 'Severity', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.timestamp || log.createdAt).toLocaleString(),
        log.user || '',
        log.action || '',
        log.category || '',
        log.severity || '',
        (log.details || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Restriction: Admin cannot grant Admin or SuperAdmin roles
    if (currentUserRole === 'Admin' && (newRole === 'Admin' || newRole === 'SuperAdmin')) {
      alert('You do not have permission to grant Admin or SuperAdmin roles.');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        alert('Role updated successfully!');
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const getRoleOptions = () => {
    if (currentUserRole === 'SuperAdmin') {
      return ['User', 'Admin', 'SuperAdmin'];
    } else if (currentUserRole === 'Admin') {
      return ['User']; // Admin can only grant User role
    }
    return ['User'];
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* No duplicate header - remove this line since app already has header */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className={`text-base mt-2 ${
              darkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              User Management & System Administration
            </p>
          </div>
          
          <Button
            onClick={() => setShowAddUserModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`p-6 border-0 shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Active Users
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {loading ? '...' : stats.activeUsers}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-emerald-900/20' : 'bg-emerald-100'
              }`}>
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className={`p-6 border-0 shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Total Users
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : stats.totalUsers}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-blue-900/20' : 'bg-blue-100'
              }`}>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className={`p-6 border-0 shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Recent Logins
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : stats.recentLogins}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-purple-900/20' : 'bg-purple-100'
              }`}>
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className={`p-6 border-0 shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Admin Count
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : stats.adminCount}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-orange-900/20' : 'bg-orange-100'
              }`}>
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className={`p-6 border-0 shadow-lg ${
          darkMode 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100' 
            : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
        }`}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 20px 0',
            color: darkMode ? '#f1f5f9' : '#1e293b'
          }}>
            System Users ({users.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                fontSize: '16px',
                color: darkMode ? '#94a3b8' : '#64748b'
              }}>
                Loading users...
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: darkMode ? '#334155' : '#f8fafc',
                    borderBottom: darkMode ? '1px solid #475569' : '1px solid #e2e8f0'
                  }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Zone</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600' }}>Last Login</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user._id || index} style={{
                      borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{user.fullName}</td>
                      <td style={{ padding: '12px 16px', color: darkMode ? '#94a3b8' : '#64748b' }}>{user.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id!, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: darkMode ? '1px solid #475569' : '1px solid #d1d5db',
                            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                            color: darkMode ? '#f1f5f9' : '#1e293b',
                            fontSize: '12px'
                          }}
                        >
                          {getRoleOptions().map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                          {/* Show current role even if user can't grant it */}
                          {!getRoleOptions().includes(user.role) && (
                            <option value={user.role} disabled>{user.role}</option>
                          )}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{user.zone}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: user.isActive 
                            ? (darkMode ? '#065f46' : '#d1fae5')
                            : (darkMode ? '#7f1d1d' : '#fee2e2'),
                          color: user.isActive 
                            ? (darkMode ? '#10b981' : '#065f46')
                            : (darkMode ? '#f87171' : '#dc2626')
                        }}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: darkMode ? '#1e40af' : '#dbeafe',
                              color: darkMode ? '#60a5fa' : '#1e40af',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id!)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: darkMode ? '#7f1d1d' : '#fee2e2',
                              color: darkMode ? '#f87171' : '#dc2626',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* System Logs Section */}
        <Card className={`p-6 border-0 shadow-lg mt-8 ${
          darkMode 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100' 
            : 'bg-gradient-to-br from-white to-gray-50 text-gray-900'
        }`}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              color: darkMode ? '#f1f5f9' : '#1e293b'
            }}>
              System Logs
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (!showLogs) {
                    fetchLogs();
                  }
                  setShowLogs(!showLogs);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #475569' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#f8fafc',
                  color: darkMode ? '#f1f5f9' : '#1e293b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? '#475569' : '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                }}
              >
                {showLogs ? '📋 Hide Logs' : '📋 View Logs'}
              </button>
              {showLogs && logs.length > 0 && (
                <button
                  onClick={exportLogsToCSV}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: darkMode ? '#059669' : '#10b981',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                  }}
                >
                  📥 Export CSV
                </button>
              )}
            </div>
          </div>

          {showLogs && (
            <div>
              {logsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    fontSize: '16px',
                    color: darkMode ? '#94a3b8' : '#64748b'
                  }}>
                    Loading logs...
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    fontSize: '16px',
                    color: darkMode ? '#94a3b8' : '#64748b'
                  }}>
                    No logs found
                  </div>
                </div>
              ) : (
                <div style={{
                  overflowX: 'auto',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr style={{
                        backgroundColor: darkMode ? '#334155' : '#f8fafc',
                        borderBottom: darkMode ? '1px solid #475569' : '1px solid #e2e8f0'
                      }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Time</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>User</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Severity</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={index} style={{
                          borderBottom: darkMode ? '1px solid #334155' : '1px solid #f1f5f9',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}>
                          <td style={{ padding: '8px 12px', fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                            {new Date(log.timestamp || log.createdAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: '500' }}>{log.user}</td>
                          <td style={{ padding: '8px 12px' }}>{log.action}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                              color: darkMode ? '#d1d5db' : '#6b7280'
                            }}>
                              {log.category}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor:
                                log.severity === 'error' ? (darkMode ? '#7f1d1d' : '#fee2e2') :
                                log.severity === 'warning' ? (darkMode ? '#92400e' : '#fef3c7') :
                                (darkMode ? '#065f46' : '#d1fae5'),
                              color:
                                log.severity === 'error' ? (darkMode ? '#f87171' : '#dc2626') :
                                log.severity === 'warning' ? (darkMode ? '#fbbf24' : '#d97706') :
                                (darkMode ? '#10b981' : '#065f46')
                            }}>
                              {log.severity}
                            </span>
                          </td>
                          <td style={{
                            padding: '8px 12px',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '12px',
                            color: darkMode ? '#94a3b8' : '#64748b'
                          }}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
