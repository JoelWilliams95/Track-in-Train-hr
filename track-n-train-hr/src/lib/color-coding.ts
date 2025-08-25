import { TransportRoute, PickupPoint } from '@/models';

export interface ColorScheme {
  primary: string;
  secondary: string;
  border: string;
  background: string;
  text: string;
  icon: string;
}

export interface RouteColorInfo {
  color: ColorScheme;
  indicator: string;
  status: string;
  priority: number; // Higher number = higher priority for display
}

export class TransportColorCoding {
  // Color schemes for different route states
  static readonly COLOR_SCHEMES = {
    // Operational Status Colors
    active: {
      primary: '#10b981', // Green
      secondary: '#6ee7b7',
      border: '#059669',
      background: 'rgba(16, 185, 129, 0.1)',
      text: '#065f46',
      icon: '✅'
    },
    delayed: {
      primary: '#f59e0b', // Amber
      secondary: '#fbbf24',
      border: '#d97706',
      background: 'rgba(245, 158, 11, 0.1)',
      text: '#92400e',
      icon: '⏰'
    },
    maintenance: {
      primary: '#8b5cf6', // Purple
      secondary: '#a78bfa',
      border: '#7c3aed',
      background: 'rgba(139, 92, 246, 0.1)',
      text: '#5b21b6',
      icon: '🔧'
    },
    cancelled: {
      primary: '#ef4444', // Red
      secondary: '#f87171',
      border: '#dc2626',
      background: 'rgba(239, 68, 68, 0.1)',
      text: '#991b1b',
      icon: '❌'
    },

    // Efficiency Colors
    highEfficiency: {
      primary: '#22c55e', // Bright Green
      secondary: '#86efac',
      border: '#16a34a',
      background: 'rgba(34, 197, 94, 0.1)',
      text: '#14532d',
      icon: '⚡'
    },
    mediumEfficiency: {
      primary: '#3b82f6', // Blue
      secondary: '#93c5fd',
      border: '#2563eb',
      background: 'rgba(59, 130, 246, 0.1)',
      text: '#1e3a8a',
      icon: '🔹'
    },
    lowEfficiency: {
      primary: '#f97316', // Orange
      secondary: '#fdba74',
      border: '#ea580c',
      background: 'rgba(249, 115, 22, 0.1)',
      text: '#9a3412',
      icon: '🔸'
    },

    // Capacity Utilization Colors
    full: {
      primary: '#dc2626', // Red
      secondary: '#f87171',
      border: '#991b1b',
      background: 'rgba(220, 38, 38, 0.1)',
      text: '#7f1d1d',
      icon: '🔴'
    },
    high: {
      primary: '#f59e0b', // Amber
      secondary: '#fbbf24',
      border: '#d97706',
      background: 'rgba(245, 158, 11, 0.1)',
      text: '#78350f',
      icon: '🟡'
    },
    medium: {
      primary: '#3b82f6', // Blue
      secondary: '#93c5fd',
      border: '#2563eb',
      background: 'rgba(59, 130, 246, 0.1)',
      text: '#1e3a8a',
      icon: '🔵'
    },
    low: {
      primary: '#10b981', // Green
      secondary: '#6ee7b7',
      border: '#059669',
      background: 'rgba(16, 185, 129, 0.1)',
      text: '#064e3b',
      icon: '🟢'
    },
    empty: {
      primary: '#6b7280', // Gray
      secondary: '#9ca3af',
      border: '#4b5563',
      background: 'rgba(107, 114, 128, 0.1)',
      text: '#374151',
      icon: '⚪'
    },

    // Priority Colors
    critical: {
      primary: '#dc2626', // Red
      secondary: '#f87171',
      border: '#991b1b',
      background: 'rgba(220, 38, 38, 0.1)',
      text: '#7f1d1d',
      icon: '🚨'
    },
    highPriority: {
      primary: '#f59e0b', // Amber
      secondary: '#fbbf24',
      border: '#d97706',
      background: 'rgba(245, 158, 11, 0.1)',
      text: '#78350f',
      icon: '⚠️'
    },
    mediumPriority: {
      primary: '#3b82f6', // Blue
      secondary: '#93c5fd',
      border: '#2563eb',
      background: 'rgba(59, 130, 246, 0.1)',
      text: '#1e3a8a',
      icon: 'ℹ️'
    },
    lowPriority: {
      primary: '#10b981', // Green
      secondary: '#6ee7b7',
      border: '#059669',
      background: 'rgba(16, 185, 129, 0.1)',
      text: '#064e3b',
      icon: '✓'
    },

    // Route Type Colors
    express: {
      primary: '#8b5cf6', // Purple
      secondary: '#c4b5fd',
      border: '#7c3aed',
      background: 'rgba(139, 92, 246, 0.1)',
      text: '#5b21b6',
      icon: '🚄'
    },
    standard: {
      primary: '#06b6d4', // Cyan
      secondary: '#67e8f9',
      border: '#0891b2',
      background: 'rgba(6, 182, 212, 0.1)',
      text: '#155e75',
      icon: '🚌'
    },
    local: {
      primary: '#84cc16', // Lime
      secondary: '#bef264',
      border: '#65a30d',
      background: 'rgba(132, 204, 22, 0.1)',
      text: '#365314',
      icon: '🚐'
    }
  };

  // Dark mode variants
  static readonly DARK_COLOR_SCHEMES = {
    ...this.COLOR_SCHEMES,
    // Override backgrounds for dark mode
    active: { ...this.COLOR_SCHEMES.active, background: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' },
    delayed: { ...this.COLOR_SCHEMES.delayed, background: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
    maintenance: { ...this.COLOR_SCHEMES.maintenance, background: 'rgba(139, 92, 246, 0.2)', text: '#c4b5fd' },
    cancelled: { ...this.COLOR_SCHEMES.cancelled, background: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
    highEfficiency: { ...this.COLOR_SCHEMES.highEfficiency, background: 'rgba(34, 197, 94, 0.2)', text: '#86efac' },
    mediumEfficiency: { ...this.COLOR_SCHEMES.mediumEfficiency, background: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd' },
    lowEfficiency: { ...this.COLOR_SCHEMES.lowEfficiency, background: 'rgba(249, 115, 22, 0.2)', text: '#fdba74' },
  };

  /**
   * Calculate capacity utilization percentage
   */
  static calculateCapacityUtilization(route: TransportRoute): number {
    const maxCapacity = route.maxCapacity || route.pickupPoints.reduce((sum, pp) => sum + pp.maxCapacity, 0);
    return maxCapacity > 0 ? (route.totalUsers / maxCapacity) * 100 : 0;
  }

  /**
   * Calculate pickup point utilization
   */
  static calculatePickupUtilization(pickupPoint: PickupPoint): number {
    return pickupPoint.maxCapacity > 0 ? (pickupPoint.currentUsers / pickupPoint.maxCapacity) * 100 : 0;
  }

  /**
   * Get utilization category based on percentage
   */
  static getUtilizationCategory(utilizationPercent: number): 'full' | 'high' | 'medium' | 'low' | 'empty' {
    if (utilizationPercent >= 100) return 'full';
    if (utilizationPercent >= 80) return 'high';
    if (utilizationPercent >= 50) return 'medium';
    if (utilizationPercent > 0) return 'low';
    return 'empty';
  }

  /**
   * Get route color information based on multiple criteria
   */
  static getRouteColorInfo(route: TransportRoute, darkMode: boolean = false): RouteColorInfo {
    const schemes = darkMode ? this.DARK_COLOR_SCHEMES : this.COLOR_SCHEMES;
    
    // Priority order: operational status > priority > efficiency > capacity
    
    // 1. Operational Status (highest priority)
    if (route.operationalStatus) {
      const statusKey = route.operationalStatus;
      if (schemes[statusKey]) {
        return {
          color: schemes[statusKey],
          indicator: schemes[statusKey].icon,
          status: this.formatStatus(route.operationalStatus),
          priority: 4
        };
      }
    }

    // 2. Priority Level
    if (route.priority) {
      const priorityKey = route.priority === 'high' ? 'highPriority' : 
                         route.priority === 'medium' ? 'mediumPriority' : 
                         route.priority === 'critical' ? 'critical' : 'lowPriority';
      return {
        color: schemes[priorityKey],
        indicator: schemes[priorityKey].icon,
        status: `${this.formatStatus(route.priority)} Priority`,
        priority: 3
      };
    }

    // 3. Efficiency
    if (route.efficiency) {
      const efficiencyKey = route.efficiency === 'high' ? 'highEfficiency' :
                           route.efficiency === 'medium' ? 'mediumEfficiency' : 'lowEfficiency';
      return {
        color: schemes[efficiencyKey],
        indicator: schemes[efficiencyKey].icon,
        status: `${this.formatStatus(route.efficiency)} Efficiency`,
        priority: 2
      };
    }

    // 4. Capacity Utilization (fallback)
    const utilization = this.calculateCapacityUtilization(route);
    const utilizationCategory = this.getUtilizationCategory(utilization);
    
    return {
      color: schemes[utilizationCategory],
      indicator: schemes[utilizationCategory].icon,
      status: `${Math.round(utilization)}% Capacity`,
      priority: 1
    };
  }

  /**
   * Get pickup point color information
   */
  static getPickupPointColorInfo(pickupPoint: PickupPoint, darkMode: boolean = false): RouteColorInfo {
    const schemes = darkMode ? this.DARK_COLOR_SCHEMES : this.COLOR_SCHEMES;
    
    const utilization = this.calculatePickupUtilization(pickupPoint);
    const utilizationCategory = pickupPoint.utilization || this.getUtilizationCategory(utilization);
    
    return {
      color: schemes[utilizationCategory],
      indicator: schemes[utilizationCategory].icon,
      status: `${pickupPoint.currentUsers}/${pickupPoint.maxCapacity} users`,
      priority: 1
    };
  }

  /**
   * Get route type color information
   */
  static getRouteTypeColorInfo(route: TransportRoute, darkMode: boolean = false): RouteColorInfo | null {
    if (!route.routeType) return null;
    
    const schemes = darkMode ? this.DARK_COLOR_SCHEMES : this.COLOR_SCHEMES;
    const typeKey = route.routeType;
    
    if (schemes[typeKey]) {
      return {
        color: schemes[typeKey],
        indicator: schemes[typeKey].icon,
        status: this.formatStatus(route.routeType),
        priority: 0
      };
    }
    
    return null;
  }

  /**
   * Format status string for display
   */
  static formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  /**
   * Get color for map visualization (returns hex colors)
   */
  static getMapColor(route: TransportRoute, darkMode: boolean = false): {
    main: string;
    hover: string;
    selected: string;
  } {
    const colorInfo = this.getRouteColorInfo(route, darkMode);
    
    return {
      main: colorInfo.color.primary,
      hover: colorInfo.color.secondary,
      selected: colorInfo.color.border
    };
  }

  /**
   * Get status badge styles
   */
  static getStatusBadgeStyles(route: TransportRoute, darkMode: boolean = false): {
    backgroundColor: string;
    color: string;
    borderColor: string;
  } {
    const colorInfo = this.getRouteColorInfo(route, darkMode);
    
    return {
      backgroundColor: colorInfo.color.background,
      color: colorInfo.color.text,
      borderColor: colorInfo.color.border
    };
  }

  /**
   * Get all status indicators for a route (returns array of all applicable statuses)
   */
  static getAllStatusIndicators(route: TransportRoute, darkMode: boolean = false): RouteColorInfo[] {
    const indicators: RouteColorInfo[] = [];
    
    // Add all applicable status indicators
    if (route.operationalStatus) {
      const statusInfo = this.getRouteColorInfo({ ...route, priority: undefined, efficiency: undefined }, darkMode);
      indicators.push(statusInfo);
    }
    
    if (route.priority) {
      const priorityInfo = this.getRouteColorInfo({ ...route, operationalStatus: undefined, efficiency: undefined }, darkMode);
      indicators.push(priorityInfo);
    }
    
    if (route.routeType) {
      const typeInfo = this.getRouteTypeColorInfo(route, darkMode);
      if (typeInfo) indicators.push(typeInfo);
    }
    
    // Always add capacity indicator
    const utilization = this.calculateCapacityUtilization(route);
    const utilizationCategory = this.getUtilizationCategory(utilization);
    const schemes = darkMode ? this.DARK_COLOR_SCHEMES : this.COLOR_SCHEMES;
    
    indicators.push({
      color: schemes[utilizationCategory],
      indicator: schemes[utilizationCategory].icon,
      status: `${Math.round(utilization)}% Capacity`,
      priority: 1
    });
    
    // Sort by priority (higher first)
    return indicators.sort((a, b) => b.priority - a.priority);
  }
}

export default TransportColorCoding;
