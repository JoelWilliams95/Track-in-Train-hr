"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Logger, getCurrentUser } from "@/lib/logger";

import NotificationButton from "./NotificationButtonNew";
import CommentInput from "./CommentInput";
import AddUserButton from "./AddUserButton";
import { extractMentionedUsers, sendTagNotification, sendProfileAddedNotification } from "@/lib/notifications";
import { COLORS, getColors, BUTTON_COLORS, STATUS_COLORS } from "@/lib/colors";
import { useResponsive } from "@/hooks/useResponsive";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import MobileAddProfileButton from "./MobileAddProfileButton";
import FloatingAddProfileButton from "./FloatingAddProfileButton";
import HorizontalScrollButtons from "./HorizontalScrollButtons";
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

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
  departureDate?: string;
  departureReason?: string;
  formationStatus?: string;
  photo?: string;
  comments?: Comment[];
  // Recruit lifecycle fields
  dateOfIntegration?: string;
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

function ProfilePanel({ user, onClose, darkMode, onAddComment, comments, loading, onBrandAsDeparted, updateProfile, onUserUpdate }: {
  user: User;
  onClose: () => void;
  darkMode: boolean;
  onAddComment: (comment: Comment) => void;
  comments: Comment[];
  loading: boolean;
  onBrandAsDeparted: (fullName: string, reason: string) => void;
  updateProfile: (fullName: string, fields: Partial<User>) => Promise<void>;
  onUserUpdate: (updatedUser: User) => void;
}) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestSetup, setShowTestSetup] = useState(false);
  const [showRetestDialog, setShowRetestDialog] = useState(false);
  const [showDepartureModal, setShowDepartureModal] = useState(false);
  const [departureReason, setDepartureReason] = useState("");
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().slice(0, 10));
  const [showTestSetupModal, setShowTestSetupModal] = useState(false);
  const [testSetupDate, setTestSetupDate] = useState("");

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    const author = getCurrentUser() || 'Unknown User';
    const date = new Date().toLocaleString();
    const newComment = { author, text: comment, date };

    // Only trigger the parent's handler, don't make API call here
    setComment("");
    onAddComment(newComment); // Let parent handle the API call and refresh
    setIsSubmitting(false);
  }

  async function handleTrainingUpdate(field: 'technicalTrainingCompleted' | 'theoreticalTrainingCompleted', value: boolean) {
    // Validation: Can't unmark technical training when theoretical training is marked
    if (field === 'technicalTrainingCompleted' && !value && user.theoreticalTrainingCompleted) {
      showErrorMessage("Cannot unmark technical training when theoretical training is already completed. Please unmark theoretical training first.");
      return;
    }

    // Validation: Can't mark theoretical training complete if technical training is not completed
    if (field === 'theoreticalTrainingCompleted' && value && !user.technicalTrainingCompleted) {
      showErrorMessage("Cannot mark theoretical training as completed. Technical training must be completed first.");
      return;
    }

    const updatedFields: Partial<User> = { [field]: value };

    // Check if both trainings will be completed after this update
    const technicalCompleted = field === 'technicalTrainingCompleted' ? value : user.technicalTrainingCompleted;
    const theoreticalCompleted = field === 'theoreticalTrainingCompleted' ? value : user.theoreticalTrainingCompleted;

    // If both trainings are completed and no test result yet, set status to "Waiting for test"
    if (technicalCompleted && theoreticalCompleted && !user.testResult && user.status === 'In-Training') {
      updatedFields.status = 'Waiting for test';
    }

    await updateProfile(user.fullName, updatedFields);
    onUserUpdate({ ...user, ...updatedFields });
  }

  async function handleTestSetup(testDate: string) {
    const updatedFields = { testDay: testDate };
    await updateProfile(user.fullName, updatedFields);
    onUserUpdate({ ...user, ...updatedFields });
    setShowTestSetup(false);
  }

  async function handleTestResult(result: string) {
    const today = new Date().toISOString().slice(0, 10);
    const testHistory = user.testHistory || [];
    const newTestEntry = { date: today, result };

    let updatedFields: Partial<User> = {
      testResult: result as "Pass" | "Fail but Promising" | "Fail",
      testHistory: [...testHistory, newTestEntry]
    };

    if (result === 'Pass') {
      updatedFields.validationDate = today;
      updatedFields.status = 'Employed';
    } else if (result === 'Retest') {
      setShowRetestDialog(true);
      return; // Don't update yet, wait for retest date
    }

    await updateProfile(user.fullName, updatedFields);
    onUserUpdate({ ...user, ...updatedFields });
  }

  async function handleRetestSetup(retestDate: string) {
    const updatedFields = { retestScheduled: retestDate };
    await updateProfile(user.fullName, updatedFields);
    onUserUpdate({ ...user, ...updatedFields });
    setShowRetestDialog(false);
  }

  async function handleDepartureConfirm() {
    if (!departureReason.trim()) {
      showErrorMessage("Please enter a departure reason");
      return;
    }

    try {
      await updateProfile(user.fullName, {
        departureDate: departureDate,
        departureReason: departureReason.trim(),
        status: 'Departed'
      });
      onUserUpdate({
        ...user,
        departureDate: departureDate,
        departureReason: departureReason.trim(),
        status: 'Departed'
      });
      setShowDepartureModal(false);
      setDepartureReason("");
    } catch (error) {
      showErrorMessage("Error updating departure information");
    }
  }

  async function handleTestSetupConfirm() {
    if (!testSetupDate.trim()) {
      showErrorMessage("Please enter a test date");
      return;
    }

    try {
      // Convert DD/MM/YY to YYYY-MM-DD for storage
      const convertedDate = convertToDateInput(testSetupDate);
      if (convertedDate) {
        await handleTestSetup(convertedDate);
        setShowTestSetupModal(false);
        setTestSetupDate("");
      } else {
        showErrorMessage("Invalid date format. Please use DD/MM/YY");
      }
    } catch (error) {
      showErrorMessage("Error setting up test date");
    }
  }

  function showErrorMessage(message: string) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${darkMode ? '#dc2626' : '#ef4444'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    // Add animation keyframes
    if (!document.querySelector('#errorNotificationStyles')) {
      const style = document.createElement('style');
      style.id = 'errorNotificationStyles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Only show info, no interactive controls
  return (
    <div
      style={{
        flex: 1,
        background: darkMode ? "#18191a" : "#fff",
        color: darkMode ? "#f5f6fa" : "#18191a",
        borderRadius: 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
        padding: 40,
        maxWidth: 1000, // Reduced width for portrait orientation
        minWidth: 800, // Adjusted minimum width
        margin: '40px auto 20px auto', // Reduced top margin to allow more height
        maxHeight: "100vh", // Set to 100vh as requested
        minHeight: "170px", // Set to 170px as requested
        overflowY: "auto",
        position: 'relative',
        display: 'flex',
        flexDirection: 'column', // changed to column for better layout
        gap: 30
      }}
    >
      <button onClick={onClose} style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: darkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(248, 250, 252, 0.9)",
        border: darkMode ? "1px solid #4b5563" : "1px solid #e2e8f0",
        borderRadius: "8px",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: "bold",
        color: darkMode ? "#f9fafb" : "#1e293b",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = darkMode ? "#dc2626" : "#ef4444";
        e.currentTarget.style.color = "#ffffff";
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = darkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(248, 250, 252, 0.9)";
        e.currentTarget.style.color = darkMode ? "#f9fafb" : "#1e293b";
        e.currentTarget.style.transform = "scale(1)";
      }}>&times;</button>

      {/* Header with photo and name */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 30 }}>
        <img src={user.photo || "https://via.placeholder.com/100"} alt={user.fullName} style={{ width: 100, height: 100, borderRadius: 16, objectFit: "cover", border: `2px solid ${darkMode ? '#333' : '#eee'}` }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 700, textTransform: 'uppercase' }}>{user.fullName}</h2>
          <div style={{ fontSize: 20, color: darkMode ? "#9ca3af" : "#6b7280", marginBottom: 4 }}>CIN: {user.cin || '-'}</div>
          <div style={{ fontSize: 22, color: darkMode ? "#aaa" : "#555" }}>{user.poste}</div>
        </div>
      </div>

      {/* Main content area with tables and comments */}
      <div style={{ display: 'flex', gap: 30, flex: 1, minHeight: 0 }}>
        {/* Left: Profile details in double table format */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 20 }}>Profile Details</div>

          {/* Double table layout */}
          <div style={{ display: 'flex', gap: 30, fontSize: 18, lineHeight: 1.6 }}>
            {/* Left table - Basic Info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: 22, fontWeight: 600, color: darkMode ? '#60a5fa' : '#2563eb' }}>Basic Information</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden' }}>
                <tbody>
                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, width: '40%', fontSize: '16px' }}>Status</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>{user.status}</td>
                  </tr>

                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>Zone</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>{user.zone}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>Sub-Zone</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>{user.subZone || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>Trajectory Code</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>{user.trajectoryCode || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>Phone Number</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>{user.phoneNumber || '-'}</td>
                  </tr>
                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>Recruit Date</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, fontSize: '16px' }}>{formatDate(user.recruitDate || '')}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px', fontSize: '16px' }}>Integration Date</td>
                    <td style={{ padding: '12px 16px', fontSize: '16px' }}>{formatDate(user.dateOfIntegration || '')}</td>
                  </tr>
                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>Address</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>{user.address || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right table - Training & Tests */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 600, color: darkMode ? '#10b981' : '#059669' }}>Training & Tests</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden' }}>
                <tbody>
                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, width: '40%' }}>Technical Training</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>{user.technicalTrainingCompleted ? '✅ Yes' : '❌ No'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>Theoretical Training</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                      {user.theoreticalTrainingCompleted ? '✅ Yes' : '❌ No'}
                      {!user.technicalTrainingCompleted && !user.theoreticalTrainingCompleted && (
                        <span style={{
                          fontSize: 12,
                          color: darkMode ? '#9ca3af' : '#6b7280',
                          marginLeft: 8
                        }}>
                          (Requires technical training first)
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>Training Date</td>
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>
                      <input
                        type="date"
                        value={user.trainingStartDate || ''}
                        onChange={async (e) => {
                          await updateProfile(user.fullName, { trainingStartDate: e.target.value });
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                          background: darkMode ? '#374151' : '#ffffff',
                          color: darkMode ? '#f9fafb' : '#1e293b',
                          fontSize: 13
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px' }}>Training Completed</td>
                    <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 14,
                          opacity: user.theoreticalTrainingCompleted && !user.technicalTrainingCompleted ? 0.6 : 1,
                          position: 'relative'
                        }}
                        title={user.theoreticalTrainingCompleted && !user.technicalTrainingCompleted ?
                          "Cannot unmark technical training when theoretical training is completed" :
                          "Mark when technical training is completed"}
                      >
                        <input
                          type="checkbox"
                          checked={user.technicalTrainingCompleted || false}
                          onChange={(e) => handleTrainingUpdate('technicalTrainingCompleted', e.target.checked)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: darkMode ? '#60a5fa' : '#2563eb',
                            cursor: 'pointer'
                          }}
                        />
                        Technical
                        {user.theoreticalTrainingCompleted && !user.technicalTrainingCompleted && (
                          <span style={{
                            fontSize: 12,
                            color: darkMode ? '#fbbf24' : '#d97706',
                            marginLeft: 4
                          }}>
                            ⚠️
                          </span>
                        )}
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 14,
                          opacity: !user.technicalTrainingCompleted ? 0.5 : 1,
                          cursor: !user.technicalTrainingCompleted ? 'not-allowed' : 'pointer'
                        }}
                        title={!user.technicalTrainingCompleted
                          ? "Technical training must be completed first before marking theoretical training as complete"
                          : "Mark when theoretical training is completed"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={user.theoreticalTrainingCompleted || false}
                          disabled={!user.technicalTrainingCompleted}
                          onChange={(e) => handleTrainingUpdate('theoreticalTrainingCompleted', e.target.checked)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: darkMode ? '#60a5fa' : '#2563eb',
                            cursor: !user.technicalTrainingCompleted ? 'not-allowed' : 'pointer',
                            opacity: !user.technicalTrainingCompleted ? 0.5 : 1
                          }}
                        />
                        Theoretical
                        {!user.technicalTrainingCompleted && (
                          <span style={{
                            fontSize: 12,
                            color: darkMode ? '#fbbf24' : '#d97706',
                            marginLeft: 4
                          }}>
                            🔒
                          </span>
                        )}
                      </label>
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                    <td style={{ fontWeight: 600, padding: '12px 16px' }}>Test Setup</td>
                    <td style={{ padding: '12px 16px' }}>
                      {!user.testDay ? (
                        <button
                          onClick={() => {
                            if (!user.technicalTrainingCompleted || !user.theoreticalTrainingCompleted) {
                              showErrorMessage("Can't set up Test without completing the training");
                              return;
                            }
                            setShowTestSetupModal(true);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: darkMode ? '#059669' : '#10b981',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Set up test day
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            Test Date: {formatDate(user.testDay || '')}
                          </span>
                          {!user.testResult && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleTestResult(e.target.value);
                                  e.target.value = ''; // Reset dropdown
                                }
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                                background: darkMode ? '#374151' : '#ffffff',
                                color: darkMode ? '#f9fafb' : '#1e293b',
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Select Result</option>
                              <option value="Pass">Pass</option>
                              <option value="Retest">Retest</option>
                              <option value="Fail">Fail</option>
                            </select>
                          )}
                          {user.testResult && (
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: user.testResult === 'Pass' ? '#10b981' : user.testResult === 'Fail' ? '#ef4444' : '#f59e0b'
                            }}>
                              Result: {user.testResult}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Test History and Final Dates */}
          <div style={{ marginTop: 30 }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 600, color: darkMode ? '#f59e0b' : '#d97706' }}>Additional Information</h3>
            <div style={{ display: 'flex', gap: 30 }}>
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden' }}>
                  <tbody>
                    <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                      <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, width: '40%' }}>Validation Date</td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>{formatDate(user.validationDate || '')}</td>
                    </tr>
                    {user.departureDate && (
                      <>
                        <tr>
                          <td style={{ fontWeight: 600, padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>Departure Date</td>
                          <td style={{ padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}` }}>{formatDate(user.departureDate || '')}</td>
                        </tr>
                        <tr style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
                          <td style={{ fontWeight: 600, padding: '12px 16px' }}>Departure Reason</td>
                          <td style={{ padding: '12px 16px' }}>{user.departureReason || '-'}</td>
                        </tr>
                      </>
                    )}
                    {!user.departureDate && (
                      <tr>
                        <td colSpan={2} style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => setShowDepartureModal(true)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: darkMode ? '#dc2626' : '#ef4444',
                              color: 'white',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = darkMode ? '#b91c1c' : '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = darkMode ? '#dc2626' : '#ef4444';
                            }}
                          >
                            Mark as Departed
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Test History</div>
                <div style={{
                  maxHeight: 100,
                  overflowY: 'auto',
                  border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 6,
                  padding: 10,
                  backgroundColor: darkMode ? '#1f2937' : '#f9fafb'
                }}>
                  {Array.isArray(user.testHistory) && user.testHistory.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12 }}>
                      {user.testHistory.map((t, i) => (
                        <li key={i} style={{ marginBottom: 3, fontSize: 12 }}>{t.date}: {t.result}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic', fontSize: 12 }}>No test history available</div>
                  )}
                </div>
                
                {/* Transport Routes Button */}
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => {
                      const router = (window as any).next?.router || { push: (url: string) => window.location.href = url };
                      router.push('/transport-routes');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: darkMode ? '#1d4ed8' : '#2563eb',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#1e40af' : '#1d4ed8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#1d4ed8' : '#2563eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                    }}
                  >
                    🚌 Find Nearest Pickup Point
                  </button>
                </div>
              </div>
            </div>
          </div>
        {user.status === "Departed" && (
          <button
            onClick={() => onBrandAsDeparted(user.fullName, user.departureReason || "Departed by HR")}
            style={{
              background: darkMode ? '#065f46' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'background 0.2s',
              marginTop: 24
            }}
          >
            Brand as Departed
          </button>
        )}
      </div>
        {/* Comments Section */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 600, color: darkMode ? '#ec4899' : '#db2777' }}>HR Comments</h3>
          <div style={{
            flex: 1,
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: 8,
            padding: 16,
            backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 150
          }}>
            {loading ? (
              <div style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: 16, textAlign: 'center', padding: 12 }}>Loading comments...</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                {comments && comments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {comments.map((c, i) => (
                      <div key={`${c.date}-${i}`} style={{
                        padding: 12,
                        backgroundColor: darkMode ? '#374151' : '#ffffff',
                        borderRadius: 8,
                        border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: darkMode ? '#60a5fa' : '#2563eb' }}>{c.author}</span>
                          <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}>{c.date}</span>
                        </div>
                        <div style={{ color: darkMode ? '#d1d5db' : '#374151', lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: 12 }}>No comments yet.</div>
                )}
              </div>
            )}
            <form onSubmit={handleAddComment} style={{ display: "flex", gap: 10, borderTop: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`, paddingTop: 16 }}>
              <CommentInput
                value={comment}
                onChange={setComment}
                onSubmit={handleAddComment}
                placeholder="Add a comment... (use @username to tag someone)"
                darkMode={darkMode}
                disabled={isSubmitting}
                currentUserRole={getCookie('userRole') || ''}
              />
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                style={{
                  background: (isSubmitting || !comment.trim()) ? (darkMode ? '#4b5563' : '#d1d5db') : (darkMode ? '#059669' : '#10b981'),
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: (isSubmitting || !comment.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  transition: 'background 0.2s'
                }}
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Retest Dialog */}
      {showRetestDialog && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minWidth: '300px',
            maxWidth: '400px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: darkMode ? '#f9fafb' : '#1e293b',
              fontSize: 18,
              fontWeight: 600
            }}>
              Schedule Retest
            </h3>
            <p style={{
              margin: '0 0 16px 0',
              color: darkMode ? '#d1d5db' : '#64748b',
              fontSize: 14
            }}>
              Enter the date for the retest (DD/MM/YY):
            </p>
            <input
              type="text"
              id="retestDate"
              placeholder="DD/MM/YY"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                background: darkMode ? '#374151' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1e293b',
                fontSize: 14,
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRetestDialog(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#f8fafc',
                  color: darkMode ? '#d1d5db' : '#64748b',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const retestDate = (document.getElementById('retestDate') as HTMLInputElement)?.value;
                  if (retestDate) {
                    // Convert DD/MM/YY to YYYY-MM-DD for storage
                    const convertedDate = convertToDateInput(retestDate);
                    if (convertedDate) {
                      handleRetestSetup(convertedDate);
                    } else {
                      showErrorMessage("Invalid date format. Please use DD/MM/YY");
                    }
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: darkMode ? '#059669' : '#10b981',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Setup Modal */}
      {showTestSetupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: darkMode
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            color: darkMode ? '#f9fafb' : '#1e293b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                Set Up Test Date
              </h3>
              <button
                onClick={() => {
                  setShowTestSetupModal(false);
                  setTestSetupDate("");
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{
                margin: '0 0 16px 0',
                color: darkMode ? '#d1d5db' : '#4b5563',
                fontSize: '14px'
              }}>
                Enter the test date for <strong>{user.fullName}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#f9fafb' : '#374151'
              }}>
                Test Date (DD/MM/YY) *
              </label>
              <input
                type="text"
                value={testSetupDate}
                onChange={(e) => setTestSetupDate(e.target.value)}
                placeholder="e.g., 25/12/24"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: '14px'
                }}
              />
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: darkMode ? '#9ca3af' : '#6b7280'
              }}>
                Format: DD/MM/YY (e.g., 25/12/24)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTestSetupModal(false);
                  setTestSetupDate("");
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#f8fafc',
                  color: darkMode ? '#d1d5db' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTestSetupConfirm}
                disabled={!testSetupDate.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: (!testSetupDate.trim())
                    ? (darkMode ? '#4b5563' : '#e5e7eb')
                    : (darkMode ? '#059669' : '#10b981'),
                  color: (!testSetupDate.trim())
                    ? (darkMode ? '#9ca3af' : '#9ca3af')
                    : '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!testSetupDate.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: (!testSetupDate.trim()) ? 0.6 : 1
                }}
              >
                Set Test Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Departure Modal */}
      {showDepartureModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '600px',
            minWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: darkMode
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 10px 20px -5px rgba(0, 0, 0, 0.3)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.08)',
            color: darkMode ? '#f9fafb' : '#1e293b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                Mark as Departed
              </h3>
              <button
                onClick={() => {
                  setShowDepartureModal(false);
                  setDepartureReason("");
                  setDepartureDate(new Date().toISOString().slice(0, 10));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{
                margin: '0 0 16px 0',
                color: darkMode ? '#d1d5db' : '#4b5563',
                fontSize: '16px'
              }}>
                You are about to mark <strong>{user.fullName}</strong> as departed.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#f9fafb' : '#374151'
              }}>
                Departure Date *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#f9fafb' : '#374151'
              }}>
                Departure Reason *
              </label>
              <textarea
                value={departureReason}
                onChange={(e) => setDepartureReason(e.target.value)}
                placeholder="Enter the reason for departure..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: '14px',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: darkMode ? '#7f1d1d' : '#fef2f2',
              border: darkMode ? '1px solid #991b1b' : '1px solid #fecaca',
              marginBottom: '24px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: darkMode ? '#fca5a5' : '#dc2626',
                fontWeight: '500'
              }}>
                ⚠️ Warning: This action cannot be undone. The employee will be marked as departed.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDepartureModal(false);
                  setDepartureReason("");
                  setDepartureDate(new Date().toISOString().slice(0, 10));
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#f8fafc',
                  color: darkMode ? '#d1d5db' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDepartureConfirm}
                disabled={!departureReason.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: (!departureReason.trim())
                    ? (darkMode ? '#4b5563' : '#e5e7eb')
                    : (darkMode ? '#dc2626' : '#ef4444'),
                  color: (!departureReason.trim())
                    ? (darkMode ? '#9ca3af' : '#9ca3af')
                    : '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!departureReason.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: (!departureReason.trim()) ? 0.6 : 1
                }}
              >
                Mark as Departed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  'Coating': ['GUF', 'Cover', 'Towers', 'Reeling', 'Mixe'],
  'Maintenance': [], // No sub-zones
  'Logistics': [], // No sub-zones
  'Quality': [] // No sub-zones
};

// Position mapping by zone
const ZONE_POSITIONS = {
  'Textile': ['Operator'],
  'Self-Closing': ['Operator'],
  'Customizing': ['Operator'],
  'Heat-Shield': ['Operator'],
  'Coating': ['Operator'],
  'Maintenance': ['Maintenance Technician'],
  'Logistics': ['Warehouse Worker'],
  'Quality': ['Quality Auditor (M)', 'Quality Auditor (F)', 'Scrap Operator']
};

// Helper function to get available positions for a zone
function getPositionsForZone(zone: string): string[] {
  return ZONE_POSITIONS[zone as keyof typeof ZONE_POSITIONS] || [];
}

// Helper function to check if position is changeable for a zone
function isPositionChangeable(zone: string): boolean {
  // Only Quality zone allows position selection
  return zone === 'Quality';
}

// Helper function to get default position for a zone
function getDefaultPosition(zone: string): string {
  const positions = getPositionsForZone(zone);
  return positions.length > 0 ? positions[0] : '';
}

export type { User };
export default function Profiles({ users, darkMode = false }: { users: User[]; darkMode?: boolean }) {
  const router = useRouter();

  // Loading state for better UX
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  // Add global zoom effect to scale down to 75%
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'profiles-zoom-style';
    style.textContent = `
      html, body {
        zoom: 0.75 !important;
        transform-origin: top left;
        overflow-x: hidden !important;
        max-width: 100% !important;
      }
      
      /* Fix floating buttons positioning with better spacing */
      .responsive-floating {
        right: 25px !important;
        bottom: 25px !important;
        box-sizing: content-box;
      }

      .responsive-floating-secondary {
        right: 95px !important;
        bottom: 25px !important;
        box-sizing: content-box;
      }
      
      @media (max-width: 1200px) {
        html, body {
          zoom: 0.8 !important;
        }
      }
      @media (max-width: 768px) {
        html, body {
          zoom: 0.9 !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('profiles-zoom-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  const [showTransport, setShowTransport] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [userList, setUserList] = useState(users);

  // Debug: Log the initial data
  useEffect(() => {
    console.log('🔍 INITIAL DATA DEBUG:');
    console.log('Users prop from server:', users.length);
    console.log('UserList state:', userList.length);
    console.log('Sample user from server:', users[0] ? {
      fullName: users[0].fullName,
      zone: users[0].zone,
      status: users[0].status,
      hasId: !!users[0]._id || !!users[0].id
    } : 'No users');

    // Log current user info
    const userRole = getCookie('userRole');
    const userName = getCookie('userName');
    const userZone = getCookie('userZone');
    console.log('🔍 CURRENT USER INFO:');
    console.log('- Name:', userName);
    console.log('- Role:', userRole);
    console.log('- Zone:', userZone);
  }, [users, userList]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  // Responsive hook with new medium desktop breakpoint
  const { isMobile, isTablet, isMediumDesktop, isDesktop, width } = useResponsive();
  
  // Always use modal for add profile now

  // Smart horizontal scroll hook
  const { scrollRef: tableScrollRef, isScrollable } = useHorizontalScroll();

  // Helper function for responsive table header styles (only for mobile/tablet)
  const getResponsiveHeaderStyle = (customPadding?: string) => ({
    padding: customPadding || (isMobile ? '12px 8px' : isTablet ? '16px 12px' : '20px 16px'), // Original desktop: 20px 16px
    textAlign: 'center' as const,
    fontWeight: 700,
    fontSize: isMobile ? 12 : isTablet ? 14 : 16, // Increased from 14 to 16 for desktop
    color: darkMode ? '#f9fafb' : '#1e293b',
    letterSpacing: isMobile ? '0.3px' : '0.5px', // Original desktop: 0.5px
    textTransform: 'uppercase' as const,
    borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
  });

  // Helper function for responsive table cell styles (only for mobile/tablet)
  const getResponsiveCellStyle = (customPadding?: string) => ({
    padding: customPadding || (isMobile ? '8px 6px' : isTablet ? '12px 8px' : '16px 12px'), // Original desktop: 16px 12px
    textAlign: 'center' as const,
    fontSize: isMobile ? 12 : isTablet ? 13 : 15, // Original desktop: 15
    borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('all'); // 'all', 'name', 'cin', 'position'
  const [statusFilter, setStatusFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [subZoneFilter, setSubZoneFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);


  // Filtering logic
  const applyFilters = (profiles: User[]) => {
    let filtered = profiles;

    // Role-based filtering for non-SuperAdmin users
    const userRole = getCookie('userRole');
    const currentUserZone = getCookie('userZone');

    // Check for both SuperAdmin variations and Admin
    const isSuperAdmin = userRole === 'SuperAdmin' || userRole === 'Super Admin';
    const isAdmin = userRole === 'Admin';
    const isSuperAdminOrAdmin = isSuperAdmin || isAdmin;

    console.log('🔍 FILTERING DEBUG:');
    console.log('Current user role:', userRole);
    console.log('Current user zone:', currentUserZone);
    console.log('Total profiles before filtering:', profiles.length);
    console.log('Is SuperAdmin?', isSuperAdmin);
    console.log('Is Admin?', isAdmin);
    console.log('Is SuperAdmin or Admin?', isSuperAdminOrAdmin);
    console.log('Role comparison:', { userRole, expected: 'SuperAdmin', match: isSuperAdmin });
    console.log('Sample profile:', profiles[0] ? {
      fullName: profiles[0].fullName,
      zone: profiles[0].zone,
      status: profiles[0].status
    } : 'No profiles available');

    if (!isSuperAdminOrAdmin) {
      console.log('🚫 Applying non-SuperAdmin/Admin filtering...');
      // Non-SuperAdmin/Admin users can only see profiles that are:
      // 1. In their zone (or onwards in the hierarchy)
      // 2. Have specific allowed statuses (4 out of 5 total statuses)
      // Total statuses: Recruit, In-Training, Waiting for Test, Employed, Departed
      // Hidden from non-SuperAdmin/Admin: Recruit
      // Visible to non-SuperAdmin/Admin: In-Training, Waiting for Test, Employed, Departed
      const allowedStatuses = [
        'in-training',
        'waiting for test',
        'employed',
        'departed'
      ];

      filtered = filtered.filter(user => {
        // Check if user is in the same zone or a sub-zone
        const isInSameZone = user.zone === currentUserZone;

        // Check if user has reached at least "in-training" status
        const userStatusLower = (user.status || '').toLowerCase();
        const hasValidStatus = allowedStatuses.some(status =>
          userStatusLower.includes(status) || userStatusLower === status
        );

        const shouldShow = isInSameZone && hasValidStatus;

        if (!shouldShow) {
          console.log(`Filtering out user: ${user.fullName}, Zone: ${user.zone}, Status: ${user.status}, Same Zone: ${isInSameZone}, Valid Status: ${hasValidStatus}`);
        } else {
          console.log(`Showing user: ${user.fullName}, Zone: ${user.zone}, Status: ${user.status}`);
        }

        return shouldShow;
      });

      console.log('Profiles after role-based filtering:', filtered.length);
    } else {
      console.log('✅ SuperAdmin or Admin detected - showing all profiles without filtering');
    }

    // Enhanced search filter with dropdown selection
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();

      switch (searchBy) {
        case 'name':
          filtered = filtered.filter(user =>
            (user.fullName || '').toLowerCase().includes(searchLower)
          );
          break;
        case 'cin':
          filtered = filtered.filter(user =>
            (user.cin || '').toLowerCase().includes(searchLower)
          );
          break;
        case 'position':
          filtered = filtered.filter(user =>
            (user.poste || '').toLowerCase().includes(searchLower)
          );
          break;
        default: // 'all'
          filtered = filtered.filter(user =>
            (user.fullName || '').toLowerCase().includes(searchLower) ||
            (user.cin || '').toLowerCase().includes(searchLower) ||
            (user.poste || '').toLowerCase().includes(searchLower) ||
            (user.zone || '').toLowerCase().includes(searchLower) ||
            (user.subZone || '').toLowerCase().includes(searchLower) ||
            (user.address || '').toLowerCase().includes(searchLower) ||
            (user.trajectoryCode || '').toLowerCase().includes(searchLower) ||
            (user.phoneNumber || '').toLowerCase().includes(searchLower)
          );
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Zone filter
    if (zoneFilter !== 'All') {
      filtered = filtered.filter(user => user.zone === zoneFilter);
    }

    // Sub-zone filter
    if (subZoneFilter !== 'All') {
      filtered = filtered.filter(user => user.subZone === subZoneFilter);
    }

    // Date range filter - Fixed to use correct field name
    if (startDate || endDate) {
      console.log('🗓️ DATE FILTER APPLIED:', {
        startDate,
        endDate,
        startDateParsed: startDate ? new Date(startDate) : null,
        endDateParsed: endDate ? new Date(endDate) : null
      });

      filtered = filtered.filter(user => {
        // Check both possible field names: recruitDate and recruitmentDate
        const recruitmentDate = user.recruitDate || user.recruitmentDate;

        if (!recruitmentDate) {
          console.log(`❌ ${user.fullName}: No recruitment date (checked recruitDate and recruitmentDate)`);
          return false;
        }

        const userDate = new Date(recruitmentDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        console.log(`🔍 ${user.fullName}:`, {
          recruitDate: user.recruitDate,
          recruitmentDate: user.recruitmentDate,
          usedDate: recruitmentDate,
          userDateParsed: userDate,
          startDate: start,
          endDate: end,
          isAfterStart: !start || userDate >= start,
          isBeforeEnd: !end || userDate <= end
        });

        if (start && userDate < start) {
          console.log(`❌ ${user.fullName}: Before start date`);
          return false;
        }
        if (end && userDate > end) {
          console.log(`❌ ${user.fullName}: After end date`);
          return false;
        }

        console.log(`✅ ${user.fullName}: Passes date filter`);
        return true;
      });
    }

    console.log('🎯 FINAL FILTERING RESULT:', filtered.length, 'profiles after all filters');
    console.log('🎯 First 3 filtered profiles:', filtered.slice(0, 3).map(p => ({
      fullName: p.fullName,
      zone: p.zone,
      status: p.status
    })));

    return filtered;
  };

  // Filtered lists using useMemo to avoid re-computation
  const filteredProfiles = useMemo(() => applyFilters(userList), [
    userList, searchTerm, searchBy, statusFilter, zoneFilter, subZoneFilter, startDate, endDate
  ]);

  // Debounced search logging
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        const resultsCount = filteredProfiles.length;
        Logger.searchPerformed(getCurrentUser(), searchTerm, resultsCount);
      }, 1000); // Log after 1 second of no typing

      return () => clearTimeout(timer);
    }
  }, [searchTerm, filteredProfiles]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed items per page

  // Add profile states
  const [showAddProfileModal, setShowAddProfileModal] = useState(false); // Modal state
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

  // Confirmation states
  const [showConfirmation, setShowConfirmation] = useState(false); // Confirmation step state
  const [confirmationName, setConfirmationName] = useState(''); // Name confirmation input
  const [confirmationError, setConfirmationError] = useState(''); // Error message for confirmation
  const [addProfileError, setAddProfileError] = useState(''); // Error message for adding profile

  // Global modal management
  const { canOpenModal, openModal, closeModal } = useModal();

  // Validation error states
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    cin?: string;
    address?: string;
    trajectoryCode?: string;
    phoneNumber?: string;
    zone?: string;
  }>({});

  useEffect(() => {
    setUserList(users);
    // Set initial loading to false after users are loaded
    if (users && users.length > 0) {
      setIsInitialLoading(false);
    }
  }, [users]);



  // Handle auto-selection from URL parameter (for notification clicks)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectProfile = urlParams.get('select');

    if (selectProfile && userList.length > 0) {
      const profileToSelect = userList.find(profile =>
        profile.fullName === decodeURIComponent(selectProfile)
      );

      if (profileToSelect) {
        setSelected(profileToSelect);
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [userList]);

  // Fetch comments for selected profile
  useEffect(() => {
    if (selected) {
      console.log('🔍 Fetching comments for:', selected.fullName);
      setLoading(true);
      fetch(`/api/comments?fullName=${encodeURIComponent(selected.fullName)}`)
        .then(res => {
          console.log('🔍 Comments API response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('🔍 Comments API returned:', data);
          console.log('🔍 Comments count:', Array.isArray(data) ? data.length : 'Not an array');
          setComments(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('❌ Error fetching comments:', error);
          setComments([]);
          setLoading(false);
        });
    } else {
      setComments([]);
    }
  }, [selected]);

  // Listen for notification profile selection events
  useEffect(() => {
    const handleProfileSelection = (event: CustomEvent) => {
      const { profileName } = event.detail;
      console.log('🔔 Received profile selection event:', profileName);

      // Find the profile in the user list
      const profile = userList.find(user => user.fullName === profileName);
      if (profile) {
        console.log('🔔 Found profile, selecting:', profile.fullName);
        setSelected(profile);
        setShowDetails(true); // Ensure details panel is open
      } else {
        console.warn('🔔 Profile not found:', profileName);
      }
    };

    // Add event listener
    window.addEventListener('selectProfile', handleProfileSelection as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('selectProfile', handleProfileSelection as EventListener);
    };
  }, [userList]);

  // Add comment and refresh comments list
  async function handleAddComment(newComment: Comment) {
    if (!selected) return;
    setLoading(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: selected.fullName, comment: newComment })
      });

      if (response.ok) {
        // Log the comment activity for SuperAdmin
        const currentUser = getCookie('userName') || 'Unknown User';
        await Logger.commentAdded(currentUser, selected.fullName, newComment.text);

        // Check for tagged users in the comment and send notifications
        const mentionedUsers = await extractMentionedUsers(newComment.text);

        console.log('Comment submitted:', newComment.text);
        console.log('Mentioned users found:', mentionedUsers);
        console.log('Current user:', currentUser);

        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser !== currentUser) { // Don't notify yourself
            console.log('Sending notification to:', mentionedUser);
            await sendTagNotification(
              mentionedUser,
              currentUser,
              selected.fullName,
              newComment.text,
              selected.fullName // Use fullName as profileId for now
            );
          }
        }

        // Refresh comments from server to get the latest state
        const commentsResponse = await fetch(`/api/comments?fullName=${encodeURIComponent(selected.fullName)}`);
        const data = await commentsResponse.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  }

  // Helper to update profile via API
  async function updateProfile(fullName: string, fields: Partial<User>) {
    const res = await fetch("/api/personnel-records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, fields }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUserList(prev => prev.map(u => u.fullName === fullName ? { ...u, ...fields } : u));
    }
  }

  // Helper to update the selected user in the modal
  function handleUserUpdate(updatedUser: User) {
    setSelected(updatedUser);
    setUserList(prev => prev.map(u => u.fullName === updatedUser.fullName ? updatedUser : u));
  }

  // Handle zone change and reset sub-zone
  function handleZoneChange(selectedZone: string) {
    const defaultPosition = getDefaultPosition(selectedZone);
    setNewProfile(prev => ({
      ...prev,
      zone: selectedZone,
      subZone: '', // Reset sub-zone when zone changes
      poste: defaultPosition // Set default position based on zone
    }));

    // Clear zone error when user selects a zone
    if (validationErrors.zone) {
      setValidationErrors(prev => ({ ...prev, zone: '' }));
    }
  }

  // Handle zone filter change and reset sub-zone filter
  function handleZoneFilterChange(selectedZone: string) {
    setZoneFilter(selectedZone);
    setSubZoneFilter('All'); // Reset sub-zone filter when zone changes
  }

  // Validation helper functions
  const validateFullName = (value: string): string => {
    if (!value.trim()) return 'Full name is required';
    if (value.length < 2) return 'Full name must be at least 2 characters';
    if (value.length > 50) return 'Full name cannot exceed 50 characters';
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  };

  const validateCIN = (value: string): string => {
    if (!value.trim()) return 'CIN is required';
    if (value.length < 6) return 'CIN must be at least 6 characters';
    if (value.length > 12) return 'CIN cannot exceed 12 characters';
    if (!/^[A-Z0-9]+$/.test(value)) return 'CIN can only contain letters and numbers';
    return '';
  };

  const validateAddress = (value: string): string => {
    if (!value.trim()) return 'Address is required';
    if (value.length < 10) return 'Please provide a complete address (at least 10 characters)';
    if (value.length > 200) return 'Address cannot exceed 200 characters';
    if (/[<>&]/.test(value)) return 'Address contains invalid characters';
    return '';
  };

  const validateTrajectoryCode = (value: string): string => {
    if (value && !/^[A-Z0-9-_]+$/.test(value)) return 'Trajectory code can only contain letters, numbers, dashes, and underscores';
    if (value && value.length > 20) return 'Trajectory code cannot exceed 20 characters';
    return '';
  };

  const validatePhoneNumber = (value: string): string => {
    if (value && !/^[+]?[0-9\s()-]+$/.test(value)) return 'Phone number can only contain numbers, spaces, dashes, parentheses, and +';
    if (value && value.length < 8) return 'Phone number is too short';
    if (value && value.length > 20) return 'Phone number cannot exceed 20 characters';
    return '';
  };

  const validateZone = (value: string): string => {
    if (!value.trim()) return 'Zone selection is required';
    return '';
  };

  // Validate all fields and return true if valid
  const validateAllFields = (): boolean => {
    const errors: typeof validationErrors = {
      fullName: validateFullName(newProfile.fullName || ''),
      cin: validateCIN(newProfile.cin || ''),
      address: validateAddress(newProfile.address || ''),
      trajectoryCode: validateTrajectoryCode(newProfile.trajectoryCode || ''),
      phoneNumber: validatePhoneNumber(newProfile.phoneNumber || ''),
      zone: validateZone(newProfile.zone || '')
    };

    setValidationErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error !== '');
  };

  // Handle adding new profile
  async function handleAddProfile() {
    if (!validateAllFields()) {
      // Show a general error message
      const errorMessages = Object.values(validationErrors).filter(error => error !== '');
      alert('Please fix the following errors:\n\n' + errorMessages.join('\n'));
      return;
    }

    try {
      let uploadedPhotoPath = '';

      // Handle photo upload if a file is selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
            uploadedPhotoPath = uploadResult.filePath;
          } else {
            console.error('Photo upload failed');
          }
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
        }
      }

      const profileToAdd = {
        ...newProfile,
        photo: uploadedPhotoPath,
        recruitDate: new Date().toISOString().slice(0, 10),
        dateAdded: new Date().toISOString().slice(0, 10),
        technicalTrainingCompleted: false,
        theoreticalTrainingCompleted: false,
        comments: []
      };

      const res = await fetch("/api/personnel-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileToAdd),
      });

      if (res.ok) {
        const addedProfile = await res.json();
        setUserList(prev => [...prev, addedProfile]);

        // Send notification to users in the same zone
        const currentUser = getCookie('userName') || 'Unknown User';
        await sendProfileAddedNotification(
          newProfile.zone,
          newProfile.fullName,
          currentUser,
          newProfile.fullName // Use fullName as profileId for now
        );

        setNewProfile({
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
        setPhotoFile(null);
        setPhotoPreview(null);
        setShowAddForm(false);
      } else {
        // Handle API error response
        const errorData = await res.json();
        const errorMessage = errorData.error || errorData.message || `Server error: ${res.status}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error adding profile:', error);

      // Extract specific error message from the response
      let errorMessage = 'Error adding profile';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setAddProfileError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => {
        setAddProfileError('');
      }, 5000);
    }
  }

  // Handler to brand a profile as departed
  async function handleBrandAsDeparted(fullName: string, reason: string) {
    const today = new Date().toISOString().slice(0, 10);
    await updateProfile(fullName, {
      status: "Departed",
      departureDate: today,
      departureReason: reason
    });
    // Optionally close modal or refresh selected
    setSelected(null);
  }



  // Pagination logic
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleProfiles = filteredProfiles.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchBy, statusFilter, zoneFilter, subZoneFilter, startDate, endDate]);

  const colors = getColors(darkMode);

  return (
    <div
      className="responsive-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minHeight: '100vh',
        width: '100%', // Changed from 100vw to 100%
        maxWidth: '100%', // Changed from 100vw to 100%
        position: 'relative',
        backgroundColor: colors.BACKGROUND,
        color: colors.TEXT,
        overflowX: 'hidden',
        padding: 0,
        boxSizing: 'border-box' // Added to ensure proper width calculation
      }}>
      {/* Navigation Buttons */}
      <div style={{
        display: "flex",
        gap: 12,
        margin: "20px 60px 16px 60px",
        alignItems: "flex-start"
      }}>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 10,
            border: "none",
            background: darkMode ? "#1e40af" : "#2563eb",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          aria-current="page"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? "#1d4ed8" : "#1e40af";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? "#1e40af" : "#2563eb";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";
          }}
        >
          👥 Profiles
        </button>
        <button
          onClick={() => router.push('/transport-routes')}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 10,
            border: "none",
            background: darkMode ? "#059669" : "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? "#047857" : "#059669";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? "#059669" : "#10b981";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
          }}
        >
          🚌 Transport Routes
        </button>
      </div>

      {/* Search and Filter Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '20px',
      }}>
        <div
          className="search-container"
          style={{
          padding: isMobile ? '16px' : '20px',
          backgroundColor: darkMode ? `${colors.SURFACE}CC` : `${colors.SURFACE}F2`,
          backdropFilter: 'blur(10px)',
          borderRadius: isMobile ? '12px' : '16px',
          border: `1px solid ${colors.BORDER}`,
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
          minWidth: '2250px', // Adjusted to 2250px
          maxWidth: 'none' // Maximum width as requested
        }}>
          {/* Search Bar */}
          <div
            className="search-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16, // Original desktop gap
              marginBottom: showFilters ? 20 : 0, // Original desktop margin
              flexWrap: 'wrap'
            }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              minWidth: 300 // Original desktop min-width
            }}>
              <select
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
                style={{
                  padding: '12px 16px', // Original desktop padding
                  borderRadius: '10px', // Original desktop border radius
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: 16, // Original desktop font size
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: 120, // Original desktop min-width
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
              <option value="all">All Fields</option>
              <option value="name">Name</option>
              <option value="cin">CIN</option>
              <option value="position">Position</option>
            </select>
            <input
              type="text"
              placeholder={
                searchBy === 'name' ? "Search by name..." :
                searchBy === 'cin' ? "Search by CIN..." :
                searchBy === 'position' ? "Search by position..." :
                "Search by name, CIN, or position..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1e293b',
                fontSize: 16,
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = darkMode ? '#60a5fa' : '#2563eb';
                e.target.style.boxShadow = darkMode
                  ? '0 0 0 3px rgba(96, 165, 250, 0.1)'
                  : '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>


            <button
              onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: showFilters
                ? (darkMode ? '#1d4ed8' : '#2563eb')
                : (darkMode ? '#4b5563' : '#6b7280'),
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {(searchTerm || statusFilter !== 'All' || zoneFilter !== 'All' || subZoneFilter !== 'All' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchBy('all');
                setStatusFilter('All');
                setZoneFilter('All');
                setSubZoneFilter('All');
                setStartDate('');
                setEndDate('');
              }}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: darkMode ? '#dc2626' : '#ef4444',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              Clear All
            </button>
          )}
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginTop: 16,
          paddingTop: 16,
          borderTop: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: darkMode ? '#d1d5db' : '#64748b',
            marginRight: 8,
            alignSelf: 'center'
          }}>
            Quick Filters:
          </span>
          {['Recruit', 'In-Training', 'Waiting for test', 'Employed', 'Departed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'All' : status)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: statusFilter === status
                  ? (darkMode ? '#2563eb' : '#3b82f6')
                  : (darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.8)'),
                color: statusFilter === status
                  ? '#ffffff'
                  : (darkMode ? '#d1d5db' : '#64748b'),
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            padding: '20px 0 0 0',
            borderTop: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
          }}>
            {/* Status Filter */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Recruit">Recruit</option>
                <option value="In-Training">In-Training</option>
                <option value="Employed">Employed</option>
                <option value="Departed">Departed</option>
              </select>
            </div>

            {/* Zone Filter */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                Zone
              </label>
              <select
                value={zoneFilter}
                onChange={(e) => handleZoneFilterChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Zones</option>
                {/* Use predefined zones */}
                {Object.keys(ZONES_DATA).map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* Sub-Zone Filter */}
            {zoneFilter !== 'All' && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: darkMode ? '#f9fafb' : '#1e293b'
                }}>
                  Sub-Zone
                </label>
                <select
                  value={subZoneFilter}
                  onChange={(e) => setSubZoneFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Sub-Zones</option>
                  {ZONES_DATA[zoneFilter as keyof typeof ZONES_DATA]?.map(subZone => (
                    <option key={subZone} value={subZone}>{subZone}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Date Filter */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                Recruit Date From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: 14,
                  fontWeight: 500
                }}
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                Recruit Date To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#ffffff',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: 14,
                  fontWeight: 500
                }}
              />
            </div>
          </div>
        )}

        {/* Results Count */}
        <div style={{
          marginTop: 16,
          padding: '8px 0',
          fontSize: 14,
          fontWeight: 500,
          color: darkMode ? '#d1d5db' : '#64748b',
          textAlign: 'center'
        }}>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredProfiles.length)} of {filteredProfiles.length} profiles
          {filteredProfiles.length !== userList.length && ` (filtered from ${userList.length} total)`}
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== 'All' && ` with status "${statusFilter}"`}
          {zoneFilter !== 'All' && ` in zone "${zoneFilter}"`}
          {subZoneFilter !== 'All' && ` in sub-zone "${subZoneFilter}"`}
          {(startDate || endDate) && ` recruited between ${startDate || 'start'} and ${endDate || 'end'}`}
        </div>
        </div>
      </div>

      {/* Main content container with table and add form */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '10px',
      }}>
        <div style={{
          display: 'flex',
          gap: '20px', // 20px gap between table and form
        alignItems: 'flex-start', // Always align to top
        width: 'auto',
        minWidth: '2250px', // Adjusted to 2250px
        maxWidth: 'none', // Maximum width as requested
        overflow: 'visible',
        position: 'relative'
      }}>
        {/* Table container */}
        <div
          style={{
            backgroundColor: darkMode ? "rgba(36, 37, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backgroundImage: darkMode ? "none" : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
            backdropFilter: "blur(10px)",
            color: darkMode ? "#f5f6fa" : "#1e293b",
            padding: "2.5rem",
            borderRadius: "20px",
            boxShadow: darkMode
              ? "0 8px 32px rgba(0,0,0,0.25)"
              : "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
            flex: 1,
            minWidth: 1000, // Fixed width since no inline form
            maxWidth: 'none',
            position: 'relative',
            border: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
          }}
        >
        {/* Table is now larger and text is smaller */}
        <>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: 16,
            fontWeight: 600,
            color: darkMode ? '#f9fafb' : '#1e293b',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(241, 245, 249, 0.5)'
          }}>
            <input
              type="checkbox"
              checked={showTransport}
              style={{
                width: 18,
                height: 18,
                accentColor: darkMode ? '#60a5fa' : '#2563eb',
                cursor: 'pointer'
              }}
              onChange={() => setShowTransport(v => !v)}
            />
            Show Trajectory Code
          </label>
        </div>
        <div
          className="responsive-table-container"
          ref={tableScrollRef}
          data-scrollable={isScrollable}
          style={{
            position: 'relative',
            width: '100%',
            overflowX: 'auto',
            overflowY: 'visible',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
          }}
        >
          {/* Horizontal Scroll Buttons */}
          <HorizontalScrollButtons
            containerRef={tableScrollRef}
            darkMode={darkMode}
          />
          <table
            className="responsive-table"
            style={{
              margin: '0 auto',
              width: '100%',
              minWidth: isMobile ? '800px' : isTablet ? '900px' : '100%', // Force min-width on small screens
              fontSize: 15, // Original desktop font size
              borderRadius: 16, // Original desktop border radius
              overflow: 'hidden',
              boxShadow: darkMode
                ? '0 4px 20px rgba(0,0,0,0.25)'
                : '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
              border: 'none',
              outline: 'none',
              background: darkMode ? '#1f2937' : '#ffffff',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'auto', // Allow natural column sizing for better scrolling
            }}
          >
          <thead style={{
            backgroundColor: darkMode ? '#374151' : '#f1f5f9',
            backgroundImage: darkMode
              ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          }}>
            <tr>
              <th style={getResponsiveHeaderStyle()}>Full Name</th>
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Date Added</th>
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Accepted?</th>
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Status</th>
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Recruitment Date</th>
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Training Start Date</th>
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Validation Date</th>

              {/* Departure columns - only show when Departed filter is active */}
              {statusFilter === 'Departed' && (
                <>
                  <th style={{
                    padding: '20px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
                  }}>Departure Date</th>
                  <th style={{
                    padding: '20px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 16,
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
                  }}>Departure Reason</th>
                </>
              )}
              <th style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Zone</th>
              <th style={{
                minWidth: 100,
                width: 100,
                padding: '20px 16px',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: 16,
                color: darkMode ? '#f9fafb' : '#1e293b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: darkMode ? '2px solid #4b5563' : '2px solid #cbd5e1'
              }}>Sub-Zone</th>
              {/* Trajectory Code Header - Only show when showTransport is true */}
              {showTransport && (
                <th style={getResponsiveHeaderStyle()}>Trajectory Code</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleProfiles.map((user, idx) => {
              return (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0
                      ? (darkMode ? '#374151' : '#f8fafc')
                      : (darkMode ? '#1f2937' : '#ffffff'),
                    transition: 'all 0.2s ease',
                    borderBottom: darkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? '#4b5563' : '#f1f5f9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = darkMode
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0
                      ? (darkMode ? '#374151' : '#f8fafc')
                      : (darkMode ? '#1f2937' : '#ffffff');
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Full Name */}
                  <td
                    style={{
                      padding: '16px 16px',
                      cursor: 'pointer',
                      color: darkMode ? '#60a5fa' : '#2563eb',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      fontSize: 16,
                      transition: 'color 0.2s ease',
                      textAlign: 'center'
                    }}
                    onClick={() => {
                      if (openModal('profile-panel')) {
                        setSelected(user);
                        Logger.profileViewed(getCurrentUser(), user.fullName);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = darkMode ? '#93c5fd' : '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = darkMode ? '#60a5fa' : '#2563eb';
                    }}
                  >
                    <span style={{ textTransform: 'uppercase' }}>{user.fullName}</span>
                  </td>

                  {/* Date Added */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {formatDate(user.dateAdded || user.recruitDate || '')}
                  </td>

                  {/* Accepted? */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {user.dateOfIntegration ? '✅ Yes' : user.departureDate ? '❌ No' : '-'}
                  </td>

                  {/* Status */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 600
                  }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: 16,
                      fontWeight: 600,
                      backgroundColor:
                        user.status === 'Employed' ? (darkMode ? '#065f46' : '#d1fae5') :
                        user.status === 'In-Training' ? (darkMode ? '#1e3a8a' : '#dbeafe') :
                        user.status === 'Departed' ? (darkMode ? '#7f1d1d' : '#fee2e2') :
                        (darkMode ? '#374151' : '#f3f4f6'),
                      color:
                        user.status === 'Employed' ? (darkMode ? '#10b981' : '#065f46') :
                        user.status === 'In-Training' ? (darkMode ? '#60a5fa' : '#1e40af') :
                        user.status === 'Departed' ? (darkMode ? '#f87171' : '#dc2626') :
                        (darkMode ? '#9ca3af' : '#6b7280')
                    }}>
                      {user.status || 'Unknown'}
                    </span>
                  </td>

                  {/* Recruitment Date */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {formatDate(user.recruitDate || '')}
                  </td>

                  {/* Training Start Date */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {formatDate(user.trainingStartDate || user.dateOfIntegration || '')}
                  </td>

                  {/* Validation Date */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {formatDate(user.validationDate || '')}
                  </td>

                  {/* Departure columns - only show when Departed filter is active */}
                  {statusFilter === 'Departed' && (
                    <>
                      {/* Departure Date */}
                      <td style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontSize: 16,
                        color: darkMode ? '#d1d5db' : '#64748b'
                      }}>
                        {formatDate(user.departureDate || '')}
                      </td>

                      {/* Departure Reason */}
                      <td style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontSize: 16,
                        color: darkMode ? '#d1d5db' : '#64748b'
                      }}>
                        {user.departureReason || '-'}
                      </td>
                    </>
                  )}

                  {/* Zone */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {user.zone || '-'}
                  </td>

                  {/* Sub-Zone */}
                  <td style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: 16,
                    color: darkMode ? '#d1d5db' : '#64748b'
                  }}>
                    {user.subZone || '-'}
                  </td>

                  {/* Trajectory Code (optional) - Only show when showTransport is true */}
                  {showTransport && (
                    <td style={getResponsiveCellStyle()}>
                      {user.trajectoryCode || '-'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>


        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 30,
            marginBottom: 20,
            padding: '20px 0'
          }}>
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentPage === 1
                  ? (darkMode ? '#374151' : '#e5e7eb')
                  : (darkMode ? '#4b5563' : '#f3f4f6'),
                color: currentPage === 1
                  ? (darkMode ? '#6b7280' : '#9ca3af')
                  : (darkMode ? '#f9fafb' : '#1f2937'),
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              ← Previous
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                // Show first page, last page, current page, and pages around current
                const showPage = pageNum === 1 ||
                                pageNum === totalPages ||
                                Math.abs(pageNum - currentPage) <= 2;

                if (!showPage && pageNum === 2 && currentPage > 4) {
                  return <span key="dots1" style={{ padding: '8px 4px', color: darkMode ? '#6b7280' : '#9ca3af' }}>...</span>;
                }
                if (!showPage && pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key="dots2" style={{ padding: '8px 4px', color: darkMode ? '#6b7280' : '#9ca3af' }}>...</span>;
                }
                if (!showPage) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: currentPage === pageNum
                        ? (darkMode ? '#2563eb' : '#3b82f6')
                        : (darkMode ? '#374151' : '#f9fafb'),
                      color: currentPage === pageNum
                        ? '#ffffff'
                        : (darkMode ? '#d1d5db' : '#374151'),
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: currentPage === pageNum ? 700 : 500,
                      minWidth: 36,
                      transition: 'all 0.2s ease',
                      boxShadow: currentPage === pageNum
                        ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                        : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.target.style.backgroundColor = darkMode ? '#4b5563' : '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.target.style.backgroundColor = darkMode ? '#374151' : '#f9fafb';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentPage === totalPages
                  ? (darkMode ? '#374151' : '#e5e7eb')
                  : (darkMode ? '#4b5563' : '#f3f4f6'),
                color: currentPage === totalPages
                  ? (darkMode ? '#6b7280' : '#9ca3af')
                  : (darkMode ? '#f9fafb' : '#1f2937'),
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              Next →
            </button>
          </div>
        )}
        </>
        </div>
        </div>
      </div>

      {selected && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}>
          <ProfilePanel user={selected} onClose={() => {
            setSelected(null);
            closeModal('profile-panel');
          }} darkMode={darkMode} onAddComment={handleAddComment} comments={comments} loading={loading} onBrandAsDeparted={handleBrandAsDeparted} updateProfile={updateProfile} onUserUpdate={handleUserUpdate} />
        </div>
      )}



      {/* Notification Button */}
      <NotificationButton
        userId={getCookie('userName') || ''}
        userZone={getCookie('userZone') || ''}
        darkMode={darkMode}
      />

      {/* Add User Button - Only for SuperAdmin and Admin */}
      {(getCookie('userRole') === 'SuperAdmin' || getCookie('userRole') === 'Admin') && (
        <AddUserButton darkMode={darkMode} />
      )}

      {/* Floating Add Profile Button - Always show for SuperAdmin and Admin, always opens modal */}
      {(getCookie('userRole') === 'SuperAdmin' || getCookie('userRole') === 'Admin') && (
        <FloatingAddProfileButton
          darkMode={darkMode}
          onClick={() => {
            if (openModal('add-profile')) {
              setShowAddProfileModal(true);
            }
          }}
        />
      )}

      {/* Add Profile Modal for smaller screens */}
      {showAddProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: '20px', // Slightly larger border radius
            padding: '32px', // Increased padding from 24px to 32px
            width: '100%',
            maxWidth: '750px', // Increased from 650px to 750px for more width
            maxHeight: '100vh', // Set to 100vh as requested
            minHeight: '170px', // Set to 170px as requested
            overflowY: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.5)', // Enhanced shadow
            color: darkMode ? '#f9fafb' : '#1e293b',
            minWidth: '680px' // Increased minimum width
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '32px', // Increased to 32px for better visibility
                fontWeight: '700',
                color: darkMode ? '#10b981' : '#059669'
              }}>
                Add New Profile
              </h3>
              <button
                onClick={() => {
                  setShowAddProfileModal(false);
                  setAddProfileError('');
                  setConfirmationError('');
                  closeModal('add-profile');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: darkMode ? '#374151' : '#f8fafc',
                  color: darkMode ? '#f9fafb' : '#374151',
                  cursor: 'pointer',
                  fontSize: 20,
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  minWidth: '36px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#ef4444' : '#fee2e2';
                  e.target.style.color = darkMode ? '#ffffff' : '#dc2626';
                  e.target.style.borderColor = darkMode ? '#ef4444' : '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                  e.target.style.color = darkMode ? '#f9fafb' : '#374151';
                  e.target.style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Add Profile Error Message */}
              {addProfileError && (
                <div style={{
                  backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2',
                  border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    color: darkMode ? '#fca5a5' : '#dc2626',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    ❌ Error Adding Profile
                  </div>
                  <div style={{
                    color: darkMode ? '#fca5a5' : '#991b1b',
                    fontSize: '14px',
                    marginTop: '4px'
                  }}>
                    {addProfileError}
                  </div>
                </div>
              )}

              {/* General Error Message */}
              {Object.values(validationErrors).some(error => error) && (
                <div style={{
                  backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2',
                  border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    color: darkMode ? '#fca5a5' : '#dc2626',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    ⚠️ Please fix the following errors:
                  </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: darkMode ? '#fca5a5' : '#991b1b',
                    fontSize: '13px'
                  }}>
                    {Object.entries(validationErrors).map(([field, error]) =>
                      error ? <li key={field}>{error}</li> : null
                    )}
                  </ul>
                </div>
              )}

              {/* Photo Upload */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  Profile Photo
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `3px solid ${darkMode ? '#4b5563' : '#d1d5db'}`
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: darkMode ? '#374151' : '#f3f4f6',
                      border: `2px dashed ${darkMode ? '#6b7280' : '#9ca3af'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: darkMode ? '#9ca3af' : '#6b7280'
                    }}>
                      📷
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setPhotoPreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      background: darkMode ? '#374151' : '#ffffff',
                      color: darkMode ? '#f9fafb' : '#1e293b',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {/* Full Name (Required) */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: darkMode ? '#f9fafb' : '#374151'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newProfile.fullName || ''}
                  onChange={(e) => {
                    setNewProfile(prev => ({ ...prev, fullName: e.target.value }));
                    // Clear error when user starts typing
                    if (validationErrors.fullName) {
                      setValidationErrors(prev => ({ ...prev, fullName: '' }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: validationErrors.fullName
                      ? '2px solid #ef4444'
                      : (darkMode ? '1px solid #4b5563' : '1px solid #d1d5db'),
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 16
                  }}
                />
                {validationErrors.fullName && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '16px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {validationErrors.fullName}
                  </div>
                )}
              </div>

              {/* CIN (Required) */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  CIN *
                </label>
                <input
                  type="text"
                  value={newProfile.cin || ''}
                  onChange={(e) => {
                    setNewProfile(prev => ({ ...prev, cin: e.target.value }));
                    // Clear error when user starts typing
                    if (validationErrors.cin) {
                      setValidationErrors(prev => ({ ...prev, cin: '' }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: validationErrors.cin
                      ? '2px solid #ef4444'
                      : (darkMode ? '1px solid #4b5563' : '1px solid #d1d5db'),
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 16
                  }}
                />
                {validationErrors.cin && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {validationErrors.cin}
                  </div>
                )}
              </div>

              {/* Address (Required) */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  Address *
                </label>
                <textarea
                  value={newProfile.address || ''}
                  onChange={(e) => {
                    setNewProfile(prev => ({ ...prev, address: e.target.value }));
                    // Clear error when user starts typing
                    if (validationErrors.address) {
                      setValidationErrors(prev => ({ ...prev, address: '' }));
                    }
                  }}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: validationErrors.address
                      ? '2px solid #ef4444'
                      : (darkMode ? '1px solid #4b5563' : '1px solid #d1d5db'),
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 16,
                    resize: 'vertical'
                  }}
                />
                {validationErrors.address && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {validationErrors.address}
                  </div>
                )}
              </div>

              {/* Zone (Required) */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  Zone *
                </label>
                <select
                  value={newProfile.zone || ''}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: validationErrors.zone
                      ? '2px solid #ef4444'
                      : (darkMode ? '1px solid #4b5563' : '1px solid #d1d5db'),
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select a Zone</option>
                  {Object.keys(ZONES_DATA).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                {validationErrors.zone && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {validationErrors.zone}
                  </div>
                )}
              </div>

              {/* Sub-Zone */}
              {newProfile.zone && !['Maintenance', 'Logistics', 'Quality'].includes(newProfile.zone) ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                    Sub-Zone
                  </label>
                  <select
                    value={newProfile.subZone || ''}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, subZone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      background: darkMode ? '#374151' : '#ffffff',
                      color: darkMode ? '#f9fafb' : '#1e293b',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select a Sub-Zone</option>
                    {ZONES_DATA[newProfile.zone as keyof typeof ZONES_DATA]?.map(subZone => (
                      <option key={subZone} value={subZone}>{subZone}</option>
                    ))}
                  </select>
                </div>
              ) : newProfile.zone ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                    Sub-Zone
                  </label>
                  <input
                    type="text"
                    value="N/A - No sub-zones for this zone"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      background: darkMode ? '#4b5563' : '#f3f4f6',
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      fontSize: 16,
                      cursor: 'not-allowed',
                      opacity: 0.7,
                      fontStyle: 'italic'
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                    Sub-Zone
                  </label>
                  <input
                    type="text"
                    value="Select Zone first"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      background: darkMode ? '#4b5563' : '#f3f4f6',
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      fontSize: 16,
                      cursor: 'not-allowed',
                      opacity: 0.6,
                      fontStyle: 'italic'
                    }}
                  />
                </div>
              )}

              {/* Position */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  Position
                </label>
                {newProfile.zone === 'Quality' ? (
                  <select
                    value={newProfile.poste || ''}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, poste: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      background: darkMode ? '#374151' : '#ffffff',
                      color: darkMode ? '#f9fafb' : '#1e293b',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Position</option>
                    {getPositionsForZone('Quality').map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newProfile.poste || ''}
                    readOnly={!isPositionChangeable(newProfile.zone || '')}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, poste: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      background: !isPositionChangeable(newProfile.zone || '') 
                        ? (darkMode ? '#4b5563' : '#f3f4f6') 
                        : (darkMode ? '#374151' : '#ffffff'),
                      color: darkMode ? '#f9fafb' : '#1e293b',
                      fontSize: 16,
                      cursor: !isPositionChangeable(newProfile.zone || '') ? 'not-allowed' : 'text',
                      opacity: !isPositionChangeable(newProfile.zone || '') ? 0.7 : 1
                    }}
                  />
                )}
              </div>

              {/* Trajectory Code */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  Trajectory Code
                </label>
                <input
                  type="text"
                  value={newProfile.trajectoryCode || ''}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, trajectoryCode: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 16
                  }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 16, fontWeight: 600, color: darkMode ? '#f9fafb' : '#374151' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newProfile.phoneNumber || ''}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="e.g., +1234567890"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: 16
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    // Validate required fields before showing confirmation
                    const errors: any = {};
                    if (!newProfile.fullName?.trim()) errors.fullName = 'Full name is required';
                    if (!newProfile.cin?.trim()) errors.cin = 'CIN is required';
                    if (!newProfile.address?.trim()) errors.address = 'Address is required';
                    if (!newProfile.zone?.trim()) errors.zone = 'Zone is required';

                    if (Object.keys(errors).length > 0) {
                      setValidationErrors(errors);
                      return;
                    }

                    setShowConfirmation(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: darkMode ? '#059669' : '#10b981',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Review & Add Profile
                </button>
                <button
                  onClick={() => {
                    setNewProfile({
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
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setValidationErrors({});
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    backgroundColor: 'transparent',
                    color: darkMode ? '#d1d5db' : '#64748b',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Confirmation Step */}
              {showConfirmation && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '28px',
                      fontWeight: '700',
                      color: darkMode ? '#f59e0b' : '#d97706'
                    }}>
                      Confirm Profile Details
                    </h3>
                    <button
                      onClick={() => {
                        setShowConfirmation(false);
                        setConfirmationName('');
                        setConfirmationError('');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                        backgroundColor: darkMode ? '#374151' : '#f8fafc',
                        color: darkMode ? '#f9fafb' : '#374151',
                        cursor: 'pointer',
                        fontSize: 20,
                        fontWeight: 'bold'
                      }}
                    >
                      ←
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
                    <div style={{
                      backgroundColor: darkMode ? '#374151' : '#f8fafc',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Profile Information</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                        <div><strong>Full Name:</strong> {newProfile.fullName}</div>
                        <div><strong>CIN:</strong> {newProfile.cin}</div>
                        <div><strong>Zone:</strong> {newProfile.zone}</div>
                        <div><strong>Sub-Zone:</strong> {newProfile.subZone || 'N/A'}</div>
                        <div><strong>Position:</strong> {newProfile.poste || 'N/A'}</div>
                        <div><strong>Status:</strong> {newProfile.status}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {newProfile.address}</div>
                        {newProfile.trajectoryCode && <div><strong>Trajectory Code:</strong> {newProfile.trajectoryCode}</div>}
                        {newProfile.phoneNumber && <div><strong>Phone:</strong> {newProfile.phoneNumber}</div>}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: darkMode ? '#dc2626' : '#fef2f2',
                      borderRadius: '12px',
                      padding: '16px',
                      border: darkMode ? '1px solid #ef4444' : '1px solid #fecaca',
                      marginBottom: '20px'
                    }}>
                      <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: darkMode ? '#fca5a5' : '#dc2626' }}>
                        ⚠️ Confirmation Required
                      </p>
                      <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: darkMode ? '#fca5a5' : '#991b1b' }}>
                        To confirm adding this profile to the database, please type the exact full name below:
                      </p>
                      <input
                        type="text"
                        value={confirmationName}
                        onChange={(e) => setConfirmationName(e.target.value)}
                        placeholder={`Type "${newProfile.fullName}" to confirm`}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                          color: darkMode ? '#f9fafb' : '#1e293b',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Confirmation Error Message */}
                      {confirmationError && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2',
                          border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`,
                          borderRadius: '8px',
                          color: darkMode ? '#fca5a5' : '#dc2626',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          ⚠️ {confirmationError}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={async () => {
                        if (confirmationName.trim() === newProfile.fullName?.trim()) {
                          await handleAddProfile();
                          setShowAddProfileModal(false);
                          setShowConfirmation(false);
                          setConfirmationName('');
                          setConfirmationError('');
                          setAddProfileError('');
                          closeModal('add-profile');
                        } else {
                          setConfirmationError('The name you entered does not match the profile name. Please try again.');

                          // Clear error after 5 seconds
                          setTimeout(() => {
                            setConfirmationError('');
                          }, 5000);
                        }
                      }}
                      disabled={confirmationName.trim() !== newProfile.fullName?.trim()}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: confirmationName.trim() === newProfile.fullName?.trim()
                          ? (darkMode ? '#059669' : '#10b981')
                          : (darkMode ? '#4b5563' : '#d1d5db'),
                        color: confirmationName.trim() === newProfile.fullName?.trim() ? 'white' : (darkMode ? '#9ca3af' : '#6b7280'),
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: confirmationName.trim() === newProfile.fullName?.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✓ Confirm & Add to Database
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmation(false);
                        setConfirmationName('');
                        setConfirmationError('');
                      }}
                      style={{
                        padding: '14px 20px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                        backgroundColor: 'transparent',
                        color: darkMode ? '#d1d5db' : '#64748b',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}