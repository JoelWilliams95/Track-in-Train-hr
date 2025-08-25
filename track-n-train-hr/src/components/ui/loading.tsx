"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className, 
  variant = 'default', 
  width, 
  height, 
  animation = 'pulse' 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: '',
  };
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading table">
      {/* Header skeleton */}
      <div className="flex space-x-4 py-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-1/4' : colIndex === columns - 1 ? 'w-1/6' : 'flex-1'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ProfileCardSkeletonProps {
  className?: string;
}

export function ProfileCardSkeleton({ className }: ProfileCardSkeletonProps) {
  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)} role="status">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  retryButton?: React.ReactNode;
}

export function LoadingState({
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  retryButton,
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        {loadingComponent || (
          <div className="text-center space-y-2">
            <LoadingSpinner size="lg" className="mx-auto text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        {errorComponent || (
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-full">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
            </div>
            
            {retryButton}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface InlineLoadingProps {
  size?: 'sm' | 'md';
  text?: string;
  className?: string;
}

export function InlineLoading({ size = 'sm', text = 'Loading...', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
}

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
}

export function ButtonLoading({ 
  loading, 
  children, 
  loadingText = 'Loading...', 
  className,
  disabled,
  ...props 
}: ButtonLoadingProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center space-x-2',
        loading && 'cursor-not-allowed opacity-75',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}

interface PageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export function PageLoading({ message = 'Loading...', showLogo = true }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        {showLogo && (
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        <LoadingSpinner size="lg" className="mx-auto text-blue-600" />
        
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Track-IN-Train HR
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default {
  Spinner: LoadingSpinner,
  Skeleton,
  TableSkeleton,
  ProfileCardSkeleton,
  LoadingState,
  InlineLoading,
  ButtonLoading,
  PageLoading,
};
