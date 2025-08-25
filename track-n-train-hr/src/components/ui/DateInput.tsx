"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, X } from 'lucide-react'
import { FieldValidationState } from '@/lib/form-validation'

export interface DateInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  fieldState?: FieldValidationState
  helpText?: string
  minDate?: string
  maxDate?: string
  showTime?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  fieldState,
  helpText,
  minDate,
  maxDate,
  showTime = false,
  required = false,
  disabled = false,
  className = '',
  id
}) => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const calendarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      if (showTime) {
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      }
    } catch {
      return dateString
    }
  }

  const parseDate = (input: string): string => {
    if (!input) return ''
    
    // Try to parse various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    ]

    for (const format of formats) {
      if (format.test(input)) {
        const date = new Date(input)
        if (!isNaN(date.getTime())) {
          return showTime ? date.toISOString() : date.toISOString().split('T')[0]
        }
      }
    }

    return input
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Parse and validate the input
    const parsedValue = parseDate(newValue)
    if (parsedValue !== newValue) {
      onChange(parsedValue)
    }
  }

  const handleInputBlur = () => {
    const parsedValue = parseDate(inputValue)
    if (parsedValue !== inputValue) {
      setInputValue(parsedValue)
      onChange(parsedValue)
    }
    onBlur?.()
  }

  const handleCalendarDateSelect = (date: Date) => {
    const dateValue = showTime ? date.toISOString() : date.toISOString().split('T')[0]
    onChange(dateValue)
    setInputValue(dateValue)
    setShowCalendar(false)
  }

  const clearDate = () => {
    onChange('')
    setInputValue('')
  }

  const getStatusColor = () => {
    if (!fieldState) return ''
    
    switch (fieldState.status) {
      case 'invalid': return 'border-red-500 dark:border-red-400'
      case 'valid': return 'border-green-500 dark:border-green-400'
      case 'warning': return 'border-yellow-500 dark:border-yellow-400'
      default: return ''
    }
  }

  const displayValue = formatDate(inputValue)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="font-semibold text-gray-800 dark:text-gray-200">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder || (showTime ? 'MM/DD/YYYY HH:MM' : 'MM/DD/YYYY')}
          disabled={disabled}
          className={`pr-20 ${getStatusColor()}`}
          aria-invalid={fieldState?.status === 'invalid'}
          aria-describedby={fieldState?.showMessage ? `${id}-message` : undefined}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearDate}
              disabled={disabled}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            disabled={disabled}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            {showTime ? <Clock className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
          </Button>
        </div>

        {/* Simple Calendar Dropdown */}
        {showCalendar && (
          <div
            ref={calendarRef}
            className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4"
          >
            <input
              type={showTime ? 'datetime-local' : 'date'}
              value={inputValue}
              onChange={(e) => {
                const date = new Date(e.target.value)
                if (!isNaN(date.getTime())) {
                  handleCalendarDateSelect(date)
                }
              }}
              min={minDate}
              max={maxDate}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>

      {fieldState?.showMessage && fieldState.message && (
        <p 
          id={`${id}-message`} 
          className={`text-sm ${
            fieldState.status === 'invalid' 
              ? 'text-red-600 dark:text-red-400'
              : fieldState.status === 'valid'
              ? 'text-green-600 dark:text-green-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}
        >
          {fieldState.message}
        </p>
      )}
      
      {!fieldState?.showMessage && helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  )
}

// Date range picker component
export interface DateRangeInputProps {
  label?: string
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  startLabel?: string
  endLabel?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export const DateRangeInput: React.FC<DateRangeInputProps> = ({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'From',
  endLabel = 'To',
  helpText,
  required = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <Label className="font-semibold text-gray-800 dark:text-gray-200">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateInput
          label={startLabel}
          value={startDate}
          onChange={onStartDateChange}
          maxDate={endDate || undefined}
          disabled={disabled}
          placeholder="Start date"
        />
        
        <DateInput
          label={endLabel}
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDate || undefined}
          disabled={disabled}
          placeholder="End date"
        />
      </div>
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  )
}

// Relative date helpers
export const getRelativeDate = (date: string): string => {
  if (!date) return ''
  
  try {
    const inputDate = new Date(date)
    const now = new Date()
    const diffTime = now.getTime() - inputDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays === -1) return 'Tomorrow'
    if (diffDays < -1) return `In ${Math.abs(diffDays)} days`
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    
    return `${Math.floor(diffDays / 365)} years ago`
  } catch {
    return date
  }
}
