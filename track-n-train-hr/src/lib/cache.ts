/**
 * Simple but effective caching implementation for API calls and expensive operations
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  onEvict?: (key: string, data: unknown) => void
  serialize?: (data: unknown) => string
  deserialize?: (data: string) => unknown
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>()
  private accessOrder = new Map<string, number>() // For LRU implementation
  private accessCounter = 0

  constructor(private options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      ...options,
    }
  }

  /**
   * Get an item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key)
      return null
    }

    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter)
    return entry.data
  }

  /**
   * Set an item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const actualTtl = ttl || this.options.ttl || 5 * 60 * 1000
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: actualTtl,
      key,
    }

    // Check size limit and evict if necessary
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(key, entry as CacheEntry<unknown>)
    this.accessOrder.set(key, ++this.accessCounter)
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key)
    
    if (existed && this.options.onEvict) {
      const entry = this.cache.get(key)
      this.options.onEvict(key, entry?.data)
    }

    this.cache.delete(key)
    this.accessOrder.delete(key)
    return existed
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    if (this.options.onEvict) {
      for (const [key, entry] of this.cache) {
        this.options.onEvict(key, entry.data)
      }
    }
    
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number
    keys: string[]
    oldestEntry?: { key: string; age: number }
    newestEntry?: { key: string; age: number }
  } {
    const keys = Array.from(this.cache.keys())
    let oldestEntry: { key: string; age: number } | undefined
    let newestEntry: { key: string; age: number } | undefined

    for (const [key, entry] of this.cache) {
      const age = Date.now() - entry.timestamp
      
      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = { key, age }
      }
      
      if (!newestEntry || age < newestEntry.age) {
        newestEntry = { key, age }
      }
    }

    return {
      size: this.cache.size,
      keys,
      oldestEntry,
      newestEntry,
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removedCount = 0
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.delete(key)
        removedCount++
      }
    }
    
    return removedCount
  }

  /**
   * Get or set pattern - useful for caching expensive operations
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | undefined
    let lruAccess = Infinity

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < lruAccess) {
        lruAccess = accessTime
        lruKey = key
      }
    }

    if (lruKey) {
      this.delete(lruKey)
    }
  }
}

// Global cache instances
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
})

export const dataCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
})

export const sessionCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 20,
})

/**
 * Cache key generators
 */
export const CacheKeys = {
  // API endpoints
  personnelRecords: () => 'personnel:all',
  personnelRecord: (id: string) => `personnel:${id}`,
  users: () => 'users:all',
  user: (id: string) => `user:${id}`,
  notifications: (userId: string) => `notifications:${userId}`,
  
  // Search and filters
  searchResults: (query: string, filters: Record<string, unknown>) => 
    `search:${query}:${JSON.stringify(filters)}`,
  
  // Statistics and counts
  personnelStats: (zone?: string) => zone ? `stats:personnel:${zone}` : 'stats:personnel:all',
  userStats: () => 'stats:users',
  
  // Transport
  routes: () => 'transport:routes',
  route: (id: string) => `transport:route:${id}`,
  
  // Custom key generator
  custom: (namespace: string, ...parts: string[]) => 
    `${namespace}:${parts.join(':')}`,
}

/**
 * Cached API call wrapper
 */
export async function cachedApiCall<T>(
  key: string,
  apiFn: () => Promise<T>,
  options: {
    ttl?: number
    cache?: CacheManager
    forceRefresh?: boolean
  } = {}
): Promise<T> {
  const cache = options.cache || apiCache
  
  // Force refresh bypasses cache
  if (options.forceRefresh) {
    cache.delete(key)
  }

  return cache.getOrSet(key, apiFn, options.ttl)
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidator = {
  // Invalidate all personnel-related cache
  personnel: () => {
    const keys = apiCache.stats().keys.filter(key => key.startsWith('personnel:'))
    keys.forEach(key => apiCache.delete(key))
  },
  
  // Invalidate specific personnel record
  personnelRecord: (id: string) => {
    apiCache.delete(CacheKeys.personnelRecord(id))
    apiCache.delete(CacheKeys.personnelRecords())
  },
  
  // Invalidate all user-related cache
  users: () => {
    const keys = apiCache.stats().keys.filter(key => key.startsWith('user'))
    keys.forEach(key => apiCache.delete(key))
  },
  
  // Invalidate search results
  search: () => {
    const keys = apiCache.stats().keys.filter(key => key.startsWith('search:'))
    keys.forEach(key => apiCache.delete(key))
  },
  
  // Invalidate all cache
  all: () => {
    apiCache.clear()
    dataCache.clear()
  },
  
  // Custom pattern invalidation
  pattern: (pattern: RegExp) => {
    const keys = apiCache.stats().keys.filter(key => pattern.test(key))
    keys.forEach(key => apiCache.delete(key))
  },
}

/**
 * React hook for cached API calls
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean
    ttl?: number
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (options.enabled === false) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await cachedApiCall(key, fetcher, { ttl: options.ttl })
        setData(result)
        options.onSuccess?.(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        options.onError?.(err instanceof Error ? err : new Error(errorMessage))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [key, options.enabled, options.ttl])

  const refresh = React.useCallback(async () => {
    apiCache.delete(key)
    setLoading(true)
    
    try {
      const result = await cachedApiCall(key, fetcher, { ttl: options.ttl })
      setData(result)
      options.onSuccess?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      options.onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, options.ttl])

  return {
    data,
    loading,
    error,
    refresh,
  }
}

// Re-import React for the hook
import React from 'react'

/**
 * Automatic cache cleanup
 */
export function startCacheCleanup(interval = 60000) { // 1 minute
  const cleanup = () => {
    const apiCleanedCount = apiCache.cleanup()
    const dataCleanedCount = dataCache.cleanup()
    const sessionCleanedCount = sessionCache.cleanup()
    
    if (process.env.NODE_ENV === 'development') {
      const totalCleaned = apiCleanedCount + dataCleanedCount + sessionCleanedCount
      if (totalCleaned > 0) {
        console.log(`Cache cleanup: removed ${totalCleaned} expired entries`)
      }
    }
  }

  // Run cleanup immediately
  cleanup()
  
  // Set up interval
  const intervalId = setInterval(cleanup, interval)
  
  // Return cleanup function
  return () => clearInterval(intervalId)
}

// Export the CacheManager class for custom instances
export { CacheManager }
