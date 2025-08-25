import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { FieldValidationState } from '@/lib/form-validation'

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  fieldState?: FieldValidationState
  helpText?: string
  containerClassName?: string
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  fieldState = { status: 'idle', message: '', showMessage: false },
  helpText,
  containerClassName = '',
  ...props
}) => {
  const { status, message, showMessage } = fieldState

  const getStatusColor = () => {
    switch (status) {
      case 'invalid': return 'text-red-600 dark:text-red-400'
      case 'valid': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getBorderColor = () => {
    switch (status) {
      case 'invalid': return 'border-red-500 dark:border-red-400'
      case 'valid': return 'border-green-500 dark:border-green-400'
      case 'warning': return 'border-yellow-500 dark:border-yellow-400'
      default: return '' // Default border
    }
  }

  const StatusIcon = () => {
    switch (status) {
      case 'invalid': return <AlertCircle className="w-5 h-5" />
      case 'valid': return <CheckCircle className="w-5 h-5" />
      case 'validating': return <Loader className="w-5 h-5 animate-spin" />
      default: return null
    }
  }

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <Label htmlFor={props.id} className="font-semibold text-gray-800 dark:text-gray-200">
        {label}
      </Label>
      <div className="relative">
        <Input
          {...props}
          className={`pr-10 ${getBorderColor()}`}
          aria-invalid={status === 'invalid'}
          aria-describedby={showMessage ? `${props.id}-message` : undefined}
        />
        <div className={`absolute inset-y-0 right-0 pr-3 flex items-center ${getStatusColor()}`}>
          <StatusIcon />
        </div>
      </div>
      {showMessage && message && (
        <p id={`${props.id}-message`} className={`text-sm ${getStatusColor()}`}>
          {message}
        </p>
      )}
      {!showMessage && helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  )
}
