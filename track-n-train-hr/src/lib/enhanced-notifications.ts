import { useState, useEffect, useCallback, useRef } from 'react'

export interface NotificationPreferences {
  enableSound: boolean
  enableDesktop: boolean
  enableEmail: boolean
  batchNotifications: boolean
  batchInterval: number // minutes
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string // HH:MM format
  }
  categories: {
    [key: string]: {
      enabled: boolean
      priority: 'low' | 'medium' | 'high' | 'urgent'
    }
  }
}

export interface EnhancedNotification {
  id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: string
  read: boolean
  actionable: boolean
  actions?: NotificationAction[]
  data?: Record<string, any>
  expiresAt?: string
}

export interface NotificationAction {
  id: string
  label: string
  action: () => void | Promise<void>
  style?: 'primary' | 'secondary' | 'danger'
}

export interface NotificationBatch {
  id: string
  count: number
  latestNotification: EnhancedNotification
  notifications: EnhancedNotification[]
  timestamp: string
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableSound: true,
  enableDesktop: true,
  enableEmail: false,
  batchNotifications: false,
  batchInterval: 5,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  categories: {
    tag: { enabled: true, priority: 'medium' },
    profile_added: { enabled: true, priority: 'low' },
    status_change: { enabled: true, priority: 'high' },
    comment: { enabled: true, priority: 'medium' },
    system: { enabled: true, priority: 'high' },
    transport_delay: { enabled: true, priority: 'urgent' }
  }
}

export class EnhancedNotificationManager {
  private static instance: EnhancedNotificationManager
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES
  private notifications: EnhancedNotification[] = []
  private batches: NotificationBatch[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private listeners: Set<(notifications: EnhancedNotification[]) => void> = new Set()
  private audioContext: AudioContext | null = null

  static getInstance(): EnhancedNotificationManager {
    if (!EnhancedNotificationManager.instance) {
      EnhancedNotificationManager.instance = new EnhancedNotificationManager()
    }
    return EnhancedNotificationManager.instance
  }

  constructor() {
    this.loadPreferences()
    this.initializeAudio()
    this.requestNotificationPermission()
  }

  // Preferences Management
  updatePreferences(newPreferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences }
    this.savePreferences()
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  private savePreferences() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notification-preferences', JSON.stringify(this.preferences))
    }
  }

  private loadPreferences() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('notification-preferences')
      if (saved) {
        try {
          this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) }
        } catch (error) {
          console.warn('Failed to load notification preferences:', error)
        }
      }
    }
  }

  // Notification Management
  addNotification(notification: Omit<EnhancedNotification, 'id' | 'timestamp' | 'read'>) {
    const categoryPrefs = this.preferences.categories[notification.type]
    
    // Check if this notification type is enabled
    if (!categoryPrefs || !categoryPrefs.enabled) {
      return
    }

    // Check quiet hours
    if (this.isQuietTime()) {
      // Store for later delivery or reduce priority
      notification.priority = 'low'
    }

    const enhancedNotification: EnhancedNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      read: false,
      priority: notification.priority || categoryPrefs.priority
    }

    if (this.preferences.batchNotifications) {
      this.addToBatch(enhancedNotification)
    } else {
      this.deliverNotification(enhancedNotification)
    }
  }

  private addToBatch(notification: EnhancedNotification) {
    // Find existing batch for this type
    let batch = this.batches.find(b => 
      b.notifications.some(n => n.type === notification.type)
    )

    if (!batch) {
      batch = {
        id: this.generateId(),
        count: 0,
        latestNotification: notification,
        notifications: [],
        timestamp: notification.timestamp
      }
      this.batches.push(batch)
    }

    batch.notifications.push(notification)
    batch.count = batch.notifications.length
    batch.latestNotification = notification
    batch.timestamp = notification.timestamp

    // Schedule batch delivery
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.deliverBatch(batch!)
    }, this.preferences.batchInterval * 60 * 1000)
  }

  private deliverBatch(batch: NotificationBatch) {
    const summaryNotification: EnhancedNotification = {
      id: this.generateId(),
      type: 'batch',
      title: `${batch.count} new notifications`,
      message: `Latest: ${batch.latestNotification.title}`,
      priority: this.getHighestPriority(batch.notifications),
      timestamp: batch.timestamp,
      read: false,
      actionable: true,
      actions: [
        {
          id: 'view-all',
          label: 'View All',
          action: () => this.showBatchDetails(batch)
        }
      ],
      data: { batch }
    }

    this.deliverNotification(summaryNotification)
    
    // Remove the batch
    this.batches = this.batches.filter(b => b.id !== batch.id)
    this.batchTimeout = null
  }

  private deliverNotification(notification: EnhancedNotification) {
    this.notifications.unshift(notification)
    
    // Limit stored notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100)
    }

    // Notify listeners
    this.notifyListeners()

    // Play sound if enabled
    if (this.preferences.enableSound && notification.priority !== 'low') {
      this.playNotificationSound(notification.priority)
    }

    // Show desktop notification if enabled
    if (this.preferences.enableDesktop) {
      this.showDesktopNotification(notification)
    }
  }

  // Audio Management
  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Audio context not available:', error)
    }
  }

  private playNotificationSound(priority: string) {
    if (!this.audioContext || this.isQuietTime()) return

    try {
      // Generate different tones based on priority
      const frequencies = {
        low: 400,
        medium: 600,
        high: 800,
        urgent: 1000
      }

      const frequency = frequencies[priority as keyof typeof frequencies] || 600
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }

  // Desktop Notifications
  private async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  private showDesktopNotification(notification: EnhancedNotification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const desktopNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.type,
          requireInteraction: notification.priority === 'urgent'
        })

        desktopNotification.onclick = () => {
          window.focus()
          this.markAsRead(notification.id)
          desktopNotification.close()
        }

        // Auto-close after 5 seconds for non-urgent notifications
        if (notification.priority !== 'urgent') {
          setTimeout(() => desktopNotification.close(), 5000)
        }
      } catch (error) {
        console.warn('Failed to show desktop notification:', error)
      }
    }
  }

  // Notification Actions
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.notifyListeners()
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.notifyListeners()
  }

  clearAll() {
    this.notifications = []
    this.batches = []
    this.notifyListeners()
  }

  // Getters
  getNotifications(): EnhancedNotification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  getNotificationsByType(type: string): EnhancedNotification[] {
    return this.notifications.filter(n => n.type === type)
  }

  // Utility Methods
  private isQuietTime(): boolean {
    if (!this.preferences.quietHours.enabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number)
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime > endTime) {
      // Crosses midnight
      return currentTime >= startTime || currentTime <= endTime
    } else {
      return currentTime >= startTime && currentTime <= endTime
    }
  }

  private getHighestPriority(notifications: EnhancedNotification[]): 'low' | 'medium' | 'high' | 'urgent' {
    const priorities = ['low', 'medium', 'high', 'urgent']
    let highest = 0

    notifications.forEach(notification => {
      const index = priorities.indexOf(notification.priority)
      if (index > highest) highest = index
    })

    return priorities[highest] as any
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private showBatchDetails(batch: NotificationBatch) {
    // This would typically open a detailed view
    console.log('Showing batch details:', batch)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  // Listener Management
  addListener(listener: (notifications: EnhancedNotification[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

// React Hook
export function useEnhancedNotifications() {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const managerRef = useRef<EnhancedNotificationManager>()

  useEffect(() => {
    managerRef.current = EnhancedNotificationManager.getInstance()
    
    // Load initial data
    setNotifications(managerRef.current.getNotifications())
    setPreferences(managerRef.current.getPreferences())

    // Subscribe to updates
    const unsubscribe = managerRef.current.addListener(setNotifications)

    return unsubscribe
  }, [])

  const addNotification = useCallback((notification: Omit<EnhancedNotification, 'id' | 'timestamp' | 'read'>) => {
    managerRef.current?.addNotification(notification)
  }, [])

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    managerRef.current?.updatePreferences(newPreferences)
    setPreferences(managerRef.current?.getPreferences() || DEFAULT_PREFERENCES)
  }, [])

  const markAsRead = useCallback((id: string) => {
    managerRef.current?.markAsRead(id)
  }, [])

  const markAllAsRead = useCallback(() => {
    managerRef.current?.markAllAsRead()
  }, [])

  const deleteNotification = useCallback((id: string) => {
    managerRef.current?.deleteNotification(id)
  }, [])

  const clearAll = useCallback(() => {
    managerRef.current?.clearAll()
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    preferences,
    unreadCount,
    addNotification,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  }
}
