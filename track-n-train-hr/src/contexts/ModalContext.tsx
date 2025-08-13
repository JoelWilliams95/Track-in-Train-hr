"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isAnyModalOpen: boolean;
  openModals: Set<string>;
  openModal: (modalId: string) => boolean; // Returns true if modal can be opened
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  canOpenModal: () => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const openModal = (modalId: string): boolean => {
    // Check if any modal is already open
    if (openModals.size > 0) {
      console.warn(`Cannot open modal "${modalId}" - another modal is already open:`, Array.from(openModals));
      return false;
    }

    setOpenModals(prev => new Set(prev).add(modalId));
    console.log(`Modal "${modalId}" opened`);
    return true;
  };

  const closeModal = (modalId: string) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(modalId);
      return newSet;
    });
    console.log(`Modal "${modalId}" closed`);
  };

  const isModalOpen = (modalId: string): boolean => {
    return openModals.has(modalId);
  };

  const canOpenModal = (): boolean => {
    return openModals.size === 0;
  };

  const value: ModalContextType = {
    isAnyModalOpen: openModals.size > 0,
    openModals,
    openModal,
    closeModal,
    isModalOpen,
    canOpenModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Hook for individual modal management
export function useModalState(modalId: string) {
  const { openModal, closeModal, isModalOpen } = useModal();
  
  const open = () => {
    return openModal(modalId);
  };

  const close = () => {
    closeModal(modalId);
  };

  const isOpen = isModalOpen(modalId);

  return {
    isOpen,
    open,
    close,
    canOpen: () => openModal(modalId) // This will return false if another modal is open
  };
}
