"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Header from '@/components/Header';
import { getCookie } from '@/lib/cookies';
import { getColors } from '@/lib/colors';

interface User {
  _id?: string;
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

  const colors = getColors(darkMode);

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
      color: darkMode ? '#f1f5f9' : '#1e293b'
    }}>
      <Header userName={getCookie('userName') || ''} />
      
      <div style={{
        padding: '40px 20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              margin: 0,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: '16px',
              color: darkMode ? '#94a3b8' : '#64748b',
              margin: '8px 0 0 0'
            }}>
              User Management & System Administration
            </p>
          </div>
          
          <button
            onClick={() => setShowAddUserModal(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            + Add New User
          </button>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: darkMode 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
        }}>
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
        </div>

        {/* System Logs Section */}
        <div style={{
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '32px',
          boxShadow: darkMode
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
        }}>
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
        </div>
      </div>
    </div>
  );
}
