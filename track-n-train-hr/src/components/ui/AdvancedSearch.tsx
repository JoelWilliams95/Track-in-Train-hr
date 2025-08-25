"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Save, 
  Download, 
  Clock,
  Star,
  StarOff
} from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterGroup {
  key: string
  label: string
  options: FilterOption[]
  multiSelect?: boolean
  searchable?: boolean
}

export interface SavedFilter {
  id: string
  name: string
  filters: Record<string, string[]>
  searchTerm: string
  createdAt: string
  isFavorite?: boolean
}

export interface AdvancedSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filterGroups: FilterGroup[]
  activeFilters: Record<string, string[]>
  onFiltersChange: (filters: Record<string, string[]>) => void
  onExport?: () => void
  onSaveFilter?: (filter: Omit<SavedFilter, 'id' | 'createdAt'>) => void
  savedFilters?: SavedFilter[]
  onLoadFilter?: (filter: SavedFilter) => void
  onDeleteFilter?: (filterId: string) => void
  resultCount?: number
  isLoading?: boolean
  placeholder?: string
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  onSearchChange,
  filterGroups,
  activeFilters,
  onFiltersChange,
  onExport,
  onSaveFilter,
  savedFilters = [],
  onLoadFilter,
  onDeleteFilter,
  resultCount,
  isLoading = false,
  placeholder = "Search personnel..."
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [saveFilterName, setSaveFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSavedFilters, setShowSavedFilters] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Effect to handle search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      onSearchChange(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, searchTerm, onSearchChange])

  const hasActiveFilters = useMemo(() => 
    Object.values(activeFilters).some(values => values.length > 0),
    [activeFilters]
  )

  const activeFilterCount = useMemo(() => 
    Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0),
    [activeFilters]
  )

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }, [])

  const handleFilterToggle = useCallback((groupKey: string, value: string) => {
    const group = filterGroups.find(g => g.key === groupKey)
    if (!group) return

    const currentValues = activeFilters[groupKey] || []
    let newValues: string[]

    if (group.multiSelect) {
      newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
    } else {
      newValues = currentValues.includes(value) ? [] : [value]
    }

    onFiltersChange({
      ...activeFilters,
      [groupKey]: newValues
    })
  }, [activeFilters, onFiltersChange, filterGroups])

  const clearAllFilters = useCallback(() => {
    onFiltersChange({})
    onSearchChange('')
  }, [onFiltersChange, onSearchChange])

  const saveCurrentFilter = useCallback(() => {
    if (!onSaveFilter || !saveFilterName.trim()) return

    onSaveFilter({
      name: saveFilterName.trim(),
      filters: activeFilters,
      searchTerm,
      isFavorite: false
    })

    setSaveFilterName('')
    setShowSaveDialog(false)
  }, [onSaveFilter, saveFilterName, activeFilters, searchTerm])

  const loadSavedFilter = useCallback((filter: SavedFilter) => {
    onFiltersChange(filter.filters)
    onSearchChange(filter.searchTerm)
    setShowSavedFilters(false)
  }, [onFiltersChange, onSearchChange])

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 py-3 text-lg"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {onSaveFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={!hasActiveFilters && !searchTerm}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Filter
          </Button>
        )}

        {savedFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedFilters(!showSavedFilters)}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Saved ({savedFilters.length})
          </Button>
        )}

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}

        {/* Results Count */}
        {typeof resultCount === 'number' && (
          <span className="text-sm text-gray-500 ml-auto">
            {isLoading ? 'Searching...' : `${resultCount} results`}
          </span>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([groupKey, values]) =>
            values.map(value => {
              const group = filterGroups.find(g => g.key === groupKey)
              const option = group?.options.find(o => o.value === value)
              
              return (
                <span
                  key={`${groupKey}-${value}`}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  <span className="font-medium">{group?.label}:</span>
                  <span className="ml-1">{option?.label || value}</span>
                  <button
                    onClick={() => handleFilterToggle(groupKey, value)}
                    className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterGroups.map(group => (
              <div key={group.key} className="space-y-2">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between w-full text-left font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <span>{group.label}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedGroups.has(group.key) ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {expandedGroups.has(group.key) && (
                  <div className="space-y-1 pl-2">
                    {group.options.map(option => {
                      const isSelected = (activeFilters[group.key] || []).includes(option.value)
                      
                      return (
                        <label
                          key={option.value}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded"
                        >
                          <input
                            type={group.multiSelect ? "checkbox" : "radio"}
                            name={group.multiSelect ? undefined : group.key}
                            checked={isSelected}
                            onChange={() => handleFilterToggle(group.key, option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {option.label}
                            {option.count !== undefined && (
                              <span className="text-gray-500 ml-1">({option.count})</span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Saved Filters Panel */}
      {showSavedFilters && savedFilters.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Saved Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {savedFilters.map(filter => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-2">
                  <button onClick={() => loadSavedFilter(filter)}>
                    {filter.isFavorite ? <Star className="h-4 w-4 text-yellow-500" /> : <StarOff className="h-4 w-4 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => loadSavedFilter(filter)}
                    className="text-left flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {filter.name}
                  </button>
                </div>
                {onDeleteFilter && (
                  <button
                    onClick={() => onDeleteFilter(filter.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Save Current Filter</h3>
          <div className="flex gap-2">
            <Input
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              placeholder="Filter name..."
              className="flex-1"
            />
            <Button onClick={saveCurrentFilter} disabled={!saveFilterName.trim()}>
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false)
                setSaveFilterName('')
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
