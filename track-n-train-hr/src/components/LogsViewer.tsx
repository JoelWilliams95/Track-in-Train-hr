"use client";
import React, { useState, useEffect } from 'react';
import { LogEntry } from '@/app/api/logs/route';

interface LogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onProfileClick?: (profileName: string) => void;
}

export default function LogsViewer({ isOpen, onClose, darkMode, onProfileClick }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    user: '',
    category: '',
    severity: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.user) params.append('user', filters.user);
      if (filters.category) params.append('category', filters.category);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '500');

      const response = await fetch(`/api/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, filters]);

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/logs?confirm=true', { method: 'DELETE' });
        if (response.ok) {
          setLogs([]);
          alert('All logs have been cleared.');
        }
      } catch (error) {
        console.error('Error clearing logs:', error);
        alert('Failed to clear logs.');
      }
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Details', 'Target', 'Category', 'Severity'].join(','),
      ...logs.map(log => [
        log.timestamp,
        log.user,
        log.action,
        `"${log.details.replace(/"/g, '""')}"`,
        log.target || '',
        log.category,
        log.severity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR': return darkMode ? '#ef4444' : '#dc2626';
      case 'WARNING': return darkMode ? '#f59e0b' : '#d97706';
      case 'INFO': return darkMode ? '#10b981' : '#059669';
      default: return darkMode ? '#6b7280' : '#4b5563';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'VIEW': return '👁️';
      case 'LOGIN': return '🔑';
      case 'LOGOUT': return '🚪';
      case 'SEARCH': return '🔍';
      case 'FILTER': return '🔽';
      case 'EXPORT': return '📤';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        borderRadius: '16px',
        width: '95%',
        maxWidth: '1400px',
        height: '90%',
        maxHeight: '900px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px 32px',
          borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(248, 250, 252, 0.5)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            color: darkMode ? '#f9fafb' : '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📋 System Logs
          </h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={exportLogs}
              style={{
                padding: '12px 24px',
                backgroundColor: darkMode ? '#059669' : '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
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
              📤 Export CSV
            </button>
            <button
              onClick={clearLogs}
              style={{
                padding: '12px 24px',
                backgroundColor: darkMode ? '#dc2626' : '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              🗑️ Clear All
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: darkMode ? '#374151' : '#6b7280',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 114, 128, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          padding: '24px 32px',
          borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(248, 250, 252, 0.3)',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="🔍 Filter by user..."
            value={filters.user}
            onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #374151' : '1px solid #d1d5db',
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#111827',
              fontSize: '16px',
              minWidth: '200px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #374151' : '1px solid #d1d5db',
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#111827',
              fontSize: '16px',
              minWidth: '160px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="VIEW">View</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="SEARCH">Search</option>
            <option value="FILTER">Filter</option>
            <option value="EXPORT">Export</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #374151' : '1px solid #d1d5db',
              backgroundColor: darkMode ? '#374151' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#111827',
              fontSize: '16px',
              minWidth: '160px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer'
            }}
          >
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>
          <button
            onClick={fetchLogs}
            style={{
              padding: '12px 20px',
              backgroundColor: darkMode ? '#2563eb' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Logs List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: darkMode ? '#9ca3af' : '#6b7280'
            }}>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: darkMode ? '#9ca3af' : '#6b7280'
            }}>
              No logs found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '20px 24px',
                    borderRadius: '12px',
                    backgroundColor: darkMode ? '#374151' : '#f9fafb',
                    border: `1px solid ${getSeverityColor(log.severity)}30`,
                    borderLeft: `5px solid ${getSeverityColor(log.severity)}`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: log.target && onProfileClick ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (log.target && onProfileClick) {
                      console.log('📋 Log clicked - opening profile:', log.target);
                      onProfileClick(log.target);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>{getCategoryIcon(log.category)}</span>
                      <span style={{
                        fontWeight: '600',
                        color: darkMode ? '#f9fafb' : '#111827',
                        fontSize: '14px'
                      }}>
                        {log.action}
                      </span>
                      {log.target && (
                        <span style={{
                          backgroundColor: darkMode ? '#1f2937' : '#e5e7eb',
                          color: darkMode ? '#9ca3af' : '#6b7280',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {log.target}
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      color: darkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      <span>{log.user}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span style={{
                        backgroundColor: getSeverityColor(log.severity),
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        {log.severity}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    color: darkMode ? '#d1d5db' : '#374151',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
