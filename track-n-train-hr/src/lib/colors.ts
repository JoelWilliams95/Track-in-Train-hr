// Relats Brand Color Palette
export const COLORS = {
  // Primary Colors
  BLACK: '#1C1C1C',
  WHITE: '#FFFFFF',
  ORANGE_RELATS: '#FF5710',
  BLUE: '#3131FF',
  GREEN: '#42EC8B',
  
  // Secondary Colors
  ORANGE_2: '#FF9E2C',
  WARM_GREY: '#F5F1ED',
  ULTIMATE_GREY: '#EDDBD7',
  
  // Dark Mode Variants
  DARK: {
    BACKGROUND: '#1C1C1C',
    SURFACE: '#2A2A2A',
    SURFACE_LIGHT: '#3A3A3A',
    TEXT: '#FFFFFF',
    TEXT_SECONDARY: '#EDDBD7',
    BORDER: '#3A3A3A',
    ACCENT: '#FF5710',
    SUCCESS: '#42EC8B',
    WARNING: '#FF9E2C',
    INFO: '#3131FF'
  },
  
  // Light Mode Variants
  LIGHT: {
    BACKGROUND: '#FFFFFF',
    SURFACE: '#F5F1ED',
    SURFACE_LIGHT: '#EDDBD7',
    TEXT: '#1C1C1C',
    TEXT_SECONDARY: '#666666',
    BORDER: '#EDDBD7',
    ACCENT: '#FF5710',
    SUCCESS: '#42EC8B',
    WARNING: '#FF9E2C',
    INFO: '#3131FF'
  }
};

// Helper function to get colors based on dark mode
export const getColors = (darkMode: boolean) => {
  return darkMode ? COLORS.DARK : COLORS.LIGHT;
};

// Status colors
export const STATUS_COLORS = {
  RECRUIT: COLORS.ULTIMATE_GREY,
  IN_TRAINING: COLORS.ORANGE_2,
  WAITING_FOR_TEST: COLORS.BLUE,
  EMPLOYED: COLORS.GREEN,
  DEPARTED: COLORS.BLACK
};

// Button variants
export const BUTTON_COLORS = {
  PRIMARY: {
    BACKGROUND: COLORS.ORANGE_RELATS,
    HOVER: '#E64A0A',
    TEXT: COLORS.WHITE
  },
  SECONDARY: {
    BACKGROUND: COLORS.BLUE,
    HOVER: '#2828E6',
    TEXT: COLORS.WHITE
  },
  SUCCESS: {
    BACKGROUND: COLORS.GREEN,
    HOVER: '#3BD67A',
    TEXT: COLORS.WHITE
  },
  WARNING: {
    BACKGROUND: COLORS.ORANGE_2,
    HOVER: '#E68A25',
    TEXT: COLORS.WHITE
  },
  DANGER: {
    BACKGROUND: '#DC2626',
    HOVER: '#B91C1C',
    TEXT: COLORS.WHITE
  }
};
