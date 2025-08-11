"use client";
import React, { useState, useEffect } from "react";
import Profiles from "@/components/Profiles";
import { Plus, X, Upload } from "lucide-react";
import type { User } from "@/components/Profiles";
import { useTheme } from "next-themes";
import { useRouter } from 'next/navigation';

function ThemeToggle({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        padding: "0.5rem 1rem",
        borderRadius: 8,
        border: "none",
        background: theme === "dark" ? "#333" : "#eee",
        color: theme === "dark" ? "#fff" : "#222",
        cursor: "pointer",
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

function NavButtons() {
  const router = useRouter();

  return (
    <div style={{
      position: "absolute",
      top: 24,
      left: 24,
      display: "flex",
      gap: 12,
      zIndex: 10
    }}>
      <button
        style={{
          padding: "0.5rem 1.2rem",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          cursor: "pointer"
        }}
        aria-current="page"
      >
        Profiles
      </button>
      <button
        onClick={() => router.push('/transport-routes')}
        style={{
          padding: "0.5rem 1.2rem",
          borderRadius: 8,
          border: "none",
          background: "#10b981",
          color: "#fff",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#059669";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#10b981";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        🚌 Transport Routes
      </button>
    </div>
  );
}

export default function ProfilesClient({ personnelRecords, userName }: { personnelRecords: User[]; userName: string }) {
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [showWelcome, setShowWelcome] = useState(true);
  const [fade, setFade] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    cin: '',
    recruitDate: '',
    photo: null as File | null,
    poste: '',
    status: '',
    zone: '',
    trajectoryCode: '',
    phoneNumber: '',
    formationStatus: '',
    birthdate: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<User[]>(personnelRecords);

  useEffect(() => {
    if (showWelcome) {
      const fadeTimer = setTimeout(() => setFade(true), 9500);
      const hideTimer = setTimeout(() => setShowWelcome(false), 10000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [showWelcome]);

  // Add Profile Modal Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file as File | null
      }));
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setPhotoPreview(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.cin || !formData.birthdate) {
      alert('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    let uploadedPhotoPath = '';
    if (formData.photo) {
      const data = new FormData();
      data.append('file', formData.photo as File);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        });
        if (res.ok) {
          const result = await res.json();
          uploadedPhotoPath = result.filePath;
        } else {
          alert('Photo upload failed.');
        }
      } catch (err) {
        alert('Photo upload error.');
      }
    }
    // Ensure all recruit lifecycle fields are set for new profiles
    const today = new Date().toISOString().slice(0, 10);
    const newProfile: User = {
      ...formData,
      photo: uploadedPhotoPath || '',
      comments: [],
      status: 'Recruit',
      recruitDate: formData.recruitDate || today,
      dateOfIntegration: '',
      technicalTrainingCompleted: false,
      theoreticalTrainingCompleted: false,
      testDay: '',
      testResult: undefined,
      validationDate: '',
      retestScheduled: '',
      testHistory: [],
      departureDate: '',
      departureReason: '',
      cin: formData.cin || '',
      fullName: formData.fullName || '',
      poste: formData.poste || '-',
      zone: formData.zone || '-',
      trajectoryCode: formData.trajectoryCode || '-',
      phoneNumber: formData.phoneNumber || '-',
      formationStatus: formData.formationStatus || '-',
    };
    // POST to API
    try {
      const res = await fetch('/api/personnel-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
      if (res.ok) {
        const result = await res.json();
        setRecords((prev: User[]) => [result.record, ...prev]);
      } else {
        alert('Failed to save profile.');
      }
    } catch (err) {
      alert('Failed to save profile.');
    }
    handleCloseModal();
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      fullName: '',
      cin: '',
      recruitDate: '',
      photo: null,
      poste: '',
      status: '',
      zone: '',
      trajectoryCode: '',
      phoneNumber: '',
      formationStatus: '',
      birthdate: '',
    });
    setPhotoPreview(null);
  };

  if (!mounted) return null;

  return (
    <>
      <NavButtons />
      {/* ThemeToggle removed */}

      {/* Add Profile Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200
        }}>
          <div style={{
            background: darkMode ? "#1f2937" : "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            width: 340,
            maxWidth: "95vw",
            padding: 18,
            position: "relative",
            minHeight: 0,
            color: darkMode ? "#f9fafb" : "#1e293b"
          }}>
            <button
              onClick={handleCloseModal}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 24, color: "#888", cursor: "pointer" }}
              aria-label="Close"
            >
              <X />
            </button>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Add New Profile</h2>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: 80, height: 80, borderRadius: 40, objectFit: "cover", margin: "0 auto 8px" }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 40, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                  <Upload style={{ color: "#bbb", width: 32, height: 32 }} />
                </div>
              )}
              <label style={{ cursor: "pointer", color: "#2563eb", fontWeight: 500 }}>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                Upload Photo
              </label>
            </div>
            <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>CIN (National ID) *</label>
                <input
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleInputChange}
                  placeholder="Enter CIN"
                  required
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Birthdate *</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate || ''}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Poste (optional)</label>
                <input
                  type="text"
                  name="poste"
                  value={formData.poste}
                  onChange={handleInputChange}
                  placeholder="Poste (optional)"
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Zone (optional)</label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="Zone (optional)"
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Trajectory Code (optional)</label>
                <input
                  type="text"
                  name="trajectoryCode"
                  value={formData.trajectoryCode}
                  onChange={handleInputChange}
                  placeholder="Trajectory Code (optional)"
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Phone Number (optional)</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone Number (optional)"
                  style={{
                    width: "100%",
                    padding: 7,
                    borderRadius: 6,
                    border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                    marginBottom: 6,
                    background: darkMode ? "#374151" : "#fff",
                    color: darkMode ? "#f9fafb" : "#1e293b"
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={handleCloseModal}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: darkMode ? "1px solid #4b5563" : "1px solid #ddd",
                  background: darkMode ? "#374151" : "#f3f4f6",
                  color: darkMode ? "#f9fafb" : "#222",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Adding...' : 'Add Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Profiles users={records} darkMode={darkMode} />
      {userName && showWelcome && (
        <div
          style={{
            position: 'fixed',
            right: 32,
            bottom: 32,
            minWidth: 220,
            background: '#d1fae5',
            color: '#065f46',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            opacity: fade ? 0 : 1,
            transition: 'opacity 0.5s',
            zIndex: 1000,
            textAlign: 'center',
          }}
        >
          Welcome back, {userName}!
        </div>
      )}
    </>
  );
} 