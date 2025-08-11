"use client";
import React, { useState, useRef, useEffect } from 'react';

interface User {
  fullName: string;
  zone: string;
  status: string;
}

interface SystemUser {
  fullName: string;
  role: string;
  zone?: string;
}

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  darkMode: boolean;
  disabled?: boolean;
  currentUserRole?: string;
}

export default function CommentInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Add a comment...",
  darkMode,
  disabled = false,
  currentUserRole
}: CommentInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get actual system users (not personnel records) for tagging
  const getAllUsers = async (): Promise<User[]> => {
    console.log('🔍 CommentInput: Fetching users for tagging...');

    try {
      // Fetch users from the dedicated tagging API
      const response = await fetch('/api/users/tagging');
      if (response.ok) {
        const data = await response.json();
        const systemUsersList = data.users || [];

        console.log('🔍 CommentInput: Found', systemUsersList.length, 'users for tagging');

        // Convert system users to the expected format
        const users: User[] = systemUsersList.map((sysUser: any) => ({
          fullName: sysUser.fullName,
          zone: sysUser.zone || 'System',
          status: sysUser.role || 'User'
        }));

        console.log('🔍 CommentInput: Final user list for tagging:', users.map(u => u.fullName));
        return users;
      } else {
        console.error('❌ CommentInput: Failed to fetch users for tagging:', response.status);
        const errorText = await response.text();
        console.error('❌ CommentInput: Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ CommentInput: Error fetching users:', error);
    }

    // Fallback to default users if API fails
    return [
      { fullName: 'SuperAdmin', zone: 'System', status: 'Admin' },
      { fullName: 'Super Admin', zone: 'System', status: 'Admin' }
    ];
  };

  // Handle input changes and detect @ mentions
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const searchTerm = textBeforeCursor.substring(atIndex + 1);

      // Only show suggestions if we're still typing after @
      if (searchTerm.length >= 0 && !searchTerm.includes(' ')) {
        const allUsers = await getAllUsers();
        const filteredUsers = allUsers.filter(user =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Increased to 10 suggestions for SuperAdmin

        setSuggestions(filteredUsers);
        setShowSuggestions(filteredUsers.length > 0);
        setSelectedSuggestion(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[selectedSuggestion]) {
          insertMention(suggestions[selectedSuggestion]);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }

    // Handle form submission
    if (e.key === 'Enter' && !showSuggestions) {
      onSubmit(e);
    }
  };

  // Insert selected user mention
  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const newValue = 
      textBeforeCursor.substring(0, atIndex) + 
      `@${user.fullName} ` + 
      textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = atIndex + user.fullName.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          borderRadius: 8,
          border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
          padding: '10px 12px',
          background: darkMode ? '#374151' : '#ffffff',
          color: darkMode ? '#f9fafb' : '#1f2937',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = darkMode ? '#60a5fa' : '#3b82f6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
        }}
      />
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: darkMode ? '#1f2937' : '#ffffff',
          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: 4
        }}>
          {suggestions.map((user, index) => (
            <div
              key={user.fullName}
              onClick={() => insertMention(user)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: index === selectedSuggestion 
                  ? (darkMode ? '#374151' : '#f3f4f6')
                  : 'transparent',
                borderBottom: index < suggestions.length - 1 
                  ? `1px solid ${darkMode ? '#374151' : '#f3f4f6'}` 
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={() => setSelectedSuggestion(index)}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: darkMode ? '#4b5563' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold',
                color: darkMode ? '#f9fafb' : '#374151'
              }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: darkMode ? '#f9fafb' : '#1f2937'
                }}>
                  {user.fullName}
                </div>
                <div style={{
                  fontSize: 12,
                  color: darkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {user.zone} • {user.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
