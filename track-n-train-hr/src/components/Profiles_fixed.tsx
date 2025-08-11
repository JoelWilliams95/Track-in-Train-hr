"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Logger, getCurrentUser } from "@/lib/logger";
import LogsViewer from "./LogsViewer";
import NotificationButton from "./NotificationButtonNew";
import CommentInput from "./CommentInput";
import AddUserButton from "./AddUserButton";
import { extractMentionedUsers, sendTagNotification, sendProfileAddedNotification } from "@/lib/notifications";
import { COLORS, getColors, BUTTON_COLORS, STATUS_COLORS } from "@/lib/colors";
import { useResponsive } from "@/hooks/useResponsive";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import MobileAddProfileButton from "./MobileAddProfileButton";
import HorizontalScrollButtons from "./HorizontalScrollButtons";
import { useRouter } from 'next/navigation';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

type Comment = {
  author: string;
  text: string;
  date: string;
};

type User = {
  _id?: any; // MongoDB document ID
  id?: string; // Alternative ID field
  fullName: string;
  status: string;
  poste: string;
  zone: string;
  subZone?: string;
  address?: string;
  trajectoryCode?: string; // Changed from transportNumber
  phoneNumber?: string; // Added phone number field
  cin?: string;
  recruitDate?: string;
  recruitmentDate?: string; // Alternative field name for recruit date
  dateAdded?: string; // Date when profile was added to system
  departureDate?: string;
  departureReason?: string;
  formationStatus?: string;
  photo?: string;
  comments?: Comment[];
  // Recruit lifecycle fields
  dateOfIntegration?: string;
  trainingStartDate?: string; // Added training start date field
  technicalTrainingCompleted?: boolean;
  theoreticalTrainingCompleted?: boolean;
  testDay?: string;
  testResult?: "Pass" | "Fail but Promising" | "Fail";
  validationDate?: string;
  retestScheduled?: string;
  testHistory?: { date: string; result: string }[];
  retestResult?: "Pass" | "Fail but Promising" | "Fail";
  showRecruitDatePicker?: boolean; // Added for recruitment date picker
};

// Helper function to format dates to DD/MM/YY
function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return dateString; // Return original if parsing fails
  }
}

// Helper function to convert DD/MM/YY to YYYY-MM-DD for date input
function convertToDateInput(ddmmyy: string): string {
  if (!ddmmyy || ddmmyy === '-') return '';
  try {
    const parts = ddmmyy.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${year}-${month}-${day}`;
    }
    return '';
  } catch {
    return '';
  }
}

// Helper function to convert YYYY-MM-DD to DD/MM/YY
function convertFromDateInput(yyyymmdd: string): string {
  if (!yyyymmdd) return '';
  try {
    const date = new Date(yyyymmdd);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return yyyymmdd;
  }
}

// Zone and Sub-Zone mapping
const ZONES_DATA = {
  'Textile': ['Trenza', 'Encarretado', 'Fast-Tuning', 'Afeitado', 'Re-Reeling', 'Devidoir'],
  'Self-Closing': ['Ourdidor', 'Raschel', 'Horno'],
  'Customizing': ['Corte', 'Panes'],
  'Heat-Shield': ['aluminium', 'Coupe Laser', 'Snap', 'Couture', 'Tampon'],
  'Coating': ['GUF', 'Cover', 'Towers', 'Reeling', 'Mixe']
};

export type { User };
export default function Profiles({ users, darkMode = false }: { users: User[]; darkMode?: boolean }) {
  const router = useRouter();

  // Loading state for better UX
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  const [showTransport, setShowTransport] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [userList, setUserList] = useState(users);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  // Responsive hook
  const { isMobile, isTablet, isDesktop, width } = useResponsive();

  // Smart horizontal scroll hook
  const { scrollRef: tableScrollRef, isScrollable } = useHorizontalScroll();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('all'); // 'all', 'name', 'cin', 'position'
  const [statusFilter, setStatusFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [subZoneFilter, setSubZoneFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Add profile states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState<Partial<User>>({
    fullName: '',
    cin: '',
    poste: '',
    zone: '',
    subZone: '',
    address: '',
    trajectoryCode: '',
    phoneNumber: '',
    status: 'Recruit'
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed items per page

  const colors = getColors(darkMode);

  return (
    <div
      className="responsive-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        position: 'relative',
        backgroundColor: colors.BACKGROUND,
        color: colors.TEXT,
        overflowX: 'hidden',
        padding: 0
      }}>
      {/* Title */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1
          className="responsive-title"
          style={{
            backgroundImage: darkMode
              ? `linear-gradient(135deg, ${COLORS.WHITE} 0%, ${COLORS.ULTIMATE_GREY} 100%)`
              : `linear-gradient(135deg, ${COLORS.ORANGE_RELATS} 0%, ${COLORS.ORANGE_2} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            width: '100%'
          }}>Track-IN-Train HR</h1>
      </div>

      {/* Search and Filter Section */}
      <div
        className="search-container"
        style={{
          width: showAddForm ? 'calc(70% - 20px)' : 'calc(100% - 20px)', // Shortened when add form is open
          margin: '20px 0 16px 20px',
          padding: '16px',
          backgroundColor: darkMode ? `${colors.SURFACE}CC` : `${colors.SURFACE}F2`,
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: `1px solid ${colors.BORDER}`,
          transition: 'all 0.3s ease',
          boxSizing: 'border-box'
        }}>
        {/* Basic search and filter content - simplified for this fix */}
        <div>Search and Filter Section - Content goes here</div>
      </div>

      {/* Layout container for search extension and main content */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginLeft: 20,
        marginTop: showAddForm ? -16 : 0, // Move up when add form is open
        alignItems: 'flex-start',
        width: 'calc(100% - 20px)',
        maxWidth: '100%',
        overflowX: 'visible',
        transition: 'all 0.3s ease'
      }}>
        {/* Add Profile Form - Positioned next to shortened search bar */}
        {showAddForm && getCookie('userRole') === 'SuperAdmin' && (
          <div
            style={{
              backgroundColor: darkMode ? "rgba(36, 37, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
              backgroundImage: darkMode ? "none" : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "#f5f6fa" : "#1e293b",
              padding: "1rem",
              borderRadius: "16px",
              boxShadow: darkMode
                ? "0 8px 32px rgba(0,0,0,0.25)"
                : "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
              width: '28%', // Takes up the remaining space from shortened search
              minWidth: '320px',
              maxWidth: '400px',
              height: 'fit-content',
              border: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
              display: 'flex',
              flexDirection: 'column',
              alignSelf: 'flex-start' // Align to top
            }}
          >
            <div>Add Profile Form Content</div>
          </div>
        )}

        {/* Main content container with table */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: showAddForm ? '70%' : '100%', // Table takes remaining width
          maxWidth: '100%',
          overflowX: 'visible',
          transition: 'all 0.3s ease'
        }}>
          {/* Table container */}
          <div
            style={{
              backgroundColor: darkMode ? "rgba(36, 37, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
              backgroundImage: darkMode ? "none" : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "#f5f6fa" : "#1e293b",
              padding: showAddForm ? "1.5rem" : "2rem",
              borderRadius: "16px",
              boxShadow: darkMode
                ? "0 8px 32px rgba(0,0,0,0.25)"
                : "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
              flex: 1,
              minWidth: showAddForm ? (showTransport ? 1100 : 800) : (showTransport ? 1200 : 1000),
              maxWidth: 'none',
              position: 'relative',
              border: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
            }}
          >
            <div>Table Content Goes Here</div>
          </div>
        </div>

        {/* Add Profile Button - Only show when form is not open */}
        {!showAddForm && getCookie('userRole') === 'SuperAdmin' && (
          <div
            style={{
              backgroundColor: darkMode ? "rgba(36, 37, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
              backgroundImage: darkMode ? "none" : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
              backdropFilter: "blur(10px)",
              color: darkMode ? "#f5f6fa" : "#1e293b",
              padding: "2rem",
              borderRadius: "16px",
              boxShadow: darkMode
                ? "0 8px 32px rgba(0,0,0,0.25)"
                : "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
              border: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              alignSelf: 'flex-start',
              marginTop: 0
            }}
          >
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: isMobile ? '12px 16px' : '16px 24px',
                borderRadius: isMobile ? '10px' : '12px',
                border: 'none',
                backgroundColor: darkMode ? '#059669' : '#10b981',
                color: 'white',
                fontSize: isMobile ? 14 : 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                width: isMobile ? '100%' : 'auto'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = darkMode ? '#047857' : '#059669';
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = darkMode ? '#059669' : '#10b981';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              + Add New Profile
            </button>
          </div>
        )}
      </div>

      {/* Other components */}
      {/* Notification Button */}
      <NotificationButton
        userId={getCookie('userName') || ''}
        userZone={getCookie('userZone') || ''}
        darkMode={darkMode}
      />

      {/* Add User Button - Only for SuperAdmin */}
      {getCookie('userRole') === 'SuperAdmin' && (
        <AddUserButton darkMode={darkMode} />
      )}

      {/* Mobile Add Profile Button - Only on mobile - Always accessible */}
      {isMobile && (
        <MobileAddProfileButton
          darkMode={darkMode}
          onClick={() => setShowAddForm(true)}
        />
      )}
    </div>
  );
}
