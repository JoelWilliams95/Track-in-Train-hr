import React from 'react'

interface SkeletonProps {
  className?: string
  animate?: boolean
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => (
  <div 
    className={`bg-gray-200 dark:bg-gray-700 rounded ${
      animate ? 'animate-pulse' : ''
    } ${className}`} 
  />
)

// Profile Card Skeleton
export const ProfileCardSkeleton: React.FC = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border">
    <div className="flex items-center space-x-4">
      {/* Profile Image */}
      <Skeleton className="w-16 h-16 rounded-full" />
      
      {/* Profile Info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      
      {/* Status Badge */}
      <Skeleton className="w-20 h-6 rounded-full" />
    </div>
    
    {/* Additional Info */}
    <div className="mt-4 space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    
    {/* Action Buttons */}
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-8 w-20 rounded" />
      <Skeleton className="h-8 w-16 rounded" />
    </div>
  </div>
)

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ 
  columns = 5 
}) => (
  <tr>
    {Array.from({ length: columns }, (_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-24'}`} />
      </td>
    ))}
  </tr>
)

// Form Field Skeleton
export const FormFieldSkeleton: React.FC = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full rounded" />
  </div>
)

// Dashboard Stats Skeleton
export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </div>
    ))}
  </div>
)

// Navigation Skeleton
export const NavigationSkeleton: React.FC = () => (
  <nav className="space-y-2">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex items-center space-x-3 px-3 py-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </nav>
)

// Comment Section Skeleton
export const CommentSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="flex space-x-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
)

// Transport Map Skeleton
export const MapSkeleton: React.FC = () => (
  <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
    <div className="absolute inset-0 animate-pulse">
      {/* Map placeholder */}
      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-gray-600 dark:to-gray-700" />
      
      {/* Loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  </div>
)

// Generic List Skeleton
export const ListSkeleton: React.FC<{ 
  items?: number
  showAvatar?: boolean 
}> = ({ 
  items = 5, 
  showAvatar = false 
}) => (
  <div className="space-y-3">
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
        {showAvatar && <Skeleton className="w-10 h-10 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
    ))}
  </div>
)

// Page Loading Skeleton
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-32 rounded" />
    </div>
    
    {/* Stats Cards */}
    <StatsSkeleton />
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <ListSkeleton items={6} showAvatar />
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <CommentSkeleton />
        </div>
      </div>
    </div>
  </div>
)

// Search Results Skeleton
export const SearchSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Search Bar */}
    <div className="flex space-x-2">
      <Skeleton className="flex-1 h-10 rounded" />
      <Skeleton className="w-20 h-10 rounded" />
    </div>
    
    {/* Filters */}
    <div className="flex space-x-2">
      <Skeleton className="w-24 h-8 rounded-full" />
      <Skeleton className="w-20 h-8 rounded-full" />
      <Skeleton className="w-32 h-8 rounded-full" />
    </div>
    
    {/* Results */}
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

export { Skeleton }
