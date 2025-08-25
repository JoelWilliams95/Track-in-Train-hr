import { z } from 'zod'
import { useState, useEffect } from 'react'

// Enhanced validation result type
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  fieldTouched: Record<string, boolean>
}

// Field validation status
export type FieldStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'warning'

export interface FieldValidationState {
  status: FieldStatus
  message: string
  showMessage: boolean
}

// Enhanced form validation hook
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: Partial<T> = {},
  options: {
    validateOnChange?: boolean
    validateOnBlur?: boolean
    debounceMs?: number
  } = {}
) {
  const { validateOnChange = true, validateOnBlur = true, debounceMs = 300 } = options

  const [values, setValues] = useState<Partial<T>>(initialValues)
  const [fieldStates, setFieldStates] = useState<Record<string, FieldValidationState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Debounced validation
  useEffect(() => {
    if (!validateOnChange || !submitAttempted) return

    const timer = setTimeout(() => {
      validateFields(values)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [values, validateOnChange, debounceMs, submitAttempted])

  const validateField = async (fieldName: keyof T, value: any): Promise<FieldValidationState> => {
    try {
      // Set validating state
      setFieldStates(prev => ({
        ...prev,
        [fieldName]: { status: 'validating', message: '', showMessage: false }
      }))

      // Create a partial schema for the field
      const fieldSchema = schema.pick({ [fieldName]: true } as any)
      await fieldSchema.parseAsync({ [fieldName]: value })

      const newState: FieldValidationState = {
        status: 'valid',
        message: '',
        showMessage: false
      }

      setFieldStates(prev => ({ ...prev, [fieldName]: newState }))
      return newState

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path.includes(fieldName as string))
        const message = fieldError?.message || 'Invalid value'

        const newState: FieldValidationState = {
          status: 'invalid',
          message,
          showMessage: true
        }

        setFieldStates(prev => ({ ...prev, [fieldName]: newState }))
        return newState
      }

      const newState: FieldValidationState = {
        status: 'invalid',
        message: 'Validation error',
        showMessage: true
      }

      setFieldStates(prev => ({ ...prev, [fieldName]: newState }))
      return newState
    }
  }

  const validateFields = async (fieldsToValidate: Partial<T>): Promise<ValidationResult> => {
    try {
      await schema.parseAsync(fieldsToValidate)
      
      // Update all field states to valid
      const updatedStates: Record<string, FieldValidationState> = {}
      Object.keys(fieldsToValidate).forEach(field => {
        updatedStates[field] = {
          status: 'valid',
          message: '',
          showMessage: false
        }
      })
      setFieldStates(prev => ({ ...prev, ...updatedStates }))

      return {
        isValid: true,
        errors: {},
        warnings: {},
        fieldTouched: {}
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {}
        const updatedStates: Record<string, FieldValidationState> = {}

        error.errors.forEach(err => {
          const field = err.path[0] as string
          if (!errors[field]) errors[field] = []
          errors[field].push(err.message)

          updatedStates[field] = {
            status: 'invalid',
            message: err.message,
            showMessage: true
          }
        })

        setFieldStates(prev => ({ ...prev, ...updatedStates }))

        return {
          isValid: false,
          errors,
          warnings: {},
          fieldTouched: {}
        }
      }

      return {
        isValid: false,
        errors: { general: ['Validation failed'] },
        warnings: {},
        fieldTouched: {}
      }
    }
  }

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))

    if (validateOnChange && (submitAttempted || fieldStates[field as string]?.showMessage)) {
      validateField(field, value)
    }
  }

  const handleBlur = (field: keyof T) => {
    if (validateOnBlur) {
      const value = values[field]
      validateField(field, value)
    }
  }

  const handleSubmit = async (onSubmit: (data: T) => void | Promise<void>) => {
    setIsSubmitting(true)
    setSubmitAttempted(true)

    try {
      const validationResult = await validateFields(values)
      
      if (validationResult.isValid) {
        await onSubmit(values as T)
      }
      
      return validationResult
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = (newValues: Partial<T> = {}) => {
    setValues(newValues)
    setFieldStates({})
    setIsSubmitting(false)
    setSubmitAttempted(false)
  }

  const getFieldProps = (field: keyof T) => {
    const fieldState = fieldStates[field as string]
    
    return {
      value: values[field] || '',
      onChange: (value: any) => setValue(field, value),
      onBlur: () => handleBlur(field),
      error: fieldState?.status === 'invalid' ? fieldState.message : undefined,
      isValid: fieldState?.status === 'valid',
      isValidating: fieldState?.status === 'validating'
    }
  }

  return {
    values,
    fieldStates,
    isSubmitting,
    submitAttempted,
    setValue,
    handleBlur,
    handleSubmit,
    validateField,
    validateFields,
    reset,
    getFieldProps,
    isFormValid: Object.values(fieldStates).every(state => state.status === 'valid') && 
                 Object.keys(values).length > 0
  }
}

// Input formatting helpers
export const formatters = {
  phone: (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as international: +XX XXX XXX XXXX
    if (digits.length >= 10) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`
    } else if (digits.length >= 7) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    } else if (digits.length >= 4) {
      return `+${digits.slice(0, 2)} ${digits.slice(2)}`
    } else if (digits.length >= 2) {
      return `+${digits}`
    } else {
      return digits
    }
  },

  cin: (value: string): string => {
    // Convert to uppercase and remove spaces/special chars except alphanumeric
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  },

  name: (value: string): string => {
    // Capitalize first letter of each word
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  },

  address: (value: string): string => {
    // Capitalize first letter of each word and clean up spaces
    return value
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
}

// Validation message helpers
export const validationMessages = {
  required: (fieldName: string) => `${fieldName} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number (10-15 digits)',
  minLength: (min: number) => `Must be at least ${min} characters long`,
  maxLength: (max: number) => `Must be no more than ${max} characters long`,
  alphanumeric: 'Only letters and numbers are allowed',
  lettersOnly: 'Only letters and spaces are allowed',
  numbersOnly: 'Only numbers are allowed',
  strongPassword: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
}

// Field validation rules for common use cases
export const fieldRules = {
  email: z.string().email(validationMessages.email),
  
  phone: z.string()
    .min(10, validationMessages.phone)
    .max(15, validationMessages.phone)
    .regex(/^[\+]?[0-9]{10,15}$/, validationMessages.phone),
  
  strongPassword: z.string()
    .min(8, validationMessages.minLength(8))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, validationMessages.strongPassword),
    
  name: z.string()
    .min(2, validationMessages.minLength(2))
    .max(50, validationMessages.maxLength(50))
    .regex(/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF-']+$/, validationMessages.lettersOnly),
    
  cin: z.string()
    .min(5, validationMessages.minLength(5))
    .max(20, validationMessages.maxLength(20))
    .regex(/^[a-zA-Z0-9]+$/, validationMessages.alphanumeric)
}
