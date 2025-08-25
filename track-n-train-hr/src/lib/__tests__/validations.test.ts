import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  cinSchema,
  addressSchema,
  personnelFormSchema,
  loginSchema,
  userFormSchema,
  commentSchema,
  searchFiltersSchema,
  personnelStatusSchema,
  testResultSchema,
} from '../validations'

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@company.org',
        'support@123.com'
      ]

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'a'.repeat(101) + '@domain.com' // Too long
      ]

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'Password123',
        'StrongPass1',
        'MySecure123',
        'Complex1Pass'
      ]

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow()
      })
    })

    it('rejects weak passwords', () => {
      const invalidPasswords = [
        'weak',           // Too short
        'password',       // No uppercase/numbers
        'PASSWORD123',    // No lowercase
        'Password',       // No numbers
        '12345678',       // No letters
        '',               // Empty
        'a'.repeat(101)   // Too long
      ]

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow()
      })
    })
  })

  describe('phoneSchema', () => {
    it('validates correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+33123456789',
        '123456789012345', // Max length
        ''                  // Optional, empty allowed
      ]

      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow()
      })
    })

    it('rejects invalid phone numbers', () => {
      const invalidPhones = [
        'abc123',          // Contains letters
        '123',             // Too short
        '1'.repeat(16),    // Too long
        '+abc123456789'    // Invalid characters
      ]

      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow()
      })
    })
  })

  describe('nameSchema', () => {
    it('validates correct names', () => {
      const validNames = [
        'John Doe',
        'Marie-Claire Dubois',
        'José García',
        'François Müller',
        'Anna-Maria'
      ]

      validNames.forEach(name => {
        expect(() => nameSchema.parse(name)).not.toThrow()
      })
    })

    it('rejects invalid names', () => {
      const invalidNames = [
        'J',              // Too short
        'a'.repeat(51),   // Too long
        'John123',        // Contains numbers
        'John@Doe',       // Special characters
        '',               // Empty
        '  ',             // Only spaces
      ]

      invalidNames.forEach(name => {
        expect(() => nameSchema.parse(name)).toThrow()
      })
    })
  })

  describe('cinSchema', () => {
    it('validates correct CIN numbers', () => {
      const validCINs = [
        'AB123456',
        'CIN12345',
        'ID1234567890',
        'a'.repeat(20) // Max length
      ]

      validCINs.forEach(cin => {
        expect(() => cinSchema.parse(cin)).not.toThrow()
      })
    })

    it('rejects invalid CIN numbers', () => {
      const invalidCINs = [
        'AB12',           // Too short
        'a'.repeat(21),   // Too long
        'AB-123456',      // Special characters
        'AB 123456',      // Spaces
        '',               // Empty
      ]

      invalidCINs.forEach(cin => {
        expect(() => cinSchema.parse(cin)).toThrow()
      })
    })
  })

  describe('personnelFormSchema', () => {
    const validPersonnelData = {
      fullName: 'John Doe',
      cin: 'CIN123456',
      address: '123 Main Street, City, Country',
      zone: 'Textile',
      poste: 'Operator',
      status: 'Recruit' as const,
      phoneNumber: '+1234567890'
    }

    it('validates complete personnel form data', () => {
      expect(() => personnelFormSchema.parse(validPersonnelData)).not.toThrow()
    })

    it('validates personnel form with optional fields missing', () => {
      const minimalData = {
        fullName: 'John Doe',
        cin: 'CIN123456',
        address: '123 Main Street, City, Country',
        zone: 'Textile',
        poste: 'Operator',
        status: 'Recruit' as const
      }

      expect(() => personnelFormSchema.parse(minimalData)).not.toThrow()
    })

    it('rejects personnel form with missing required fields', () => {
      const incompleteData = {
        fullName: 'John Doe',
        // Missing cin, address, zone, poste, status
      }

      expect(() => personnelFormSchema.parse(incompleteData)).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'any-password-here' // No strength requirement for login
      }

      expect(() => loginSchema.parse(validLogin)).not.toThrow()
    })

    it('rejects login with missing fields', () => {
      const incompleteLogins = [
        { email: 'user@example.com' }, // Missing password
        { password: 'password' },       // Missing email
        {}                              // Missing both
      ]

      incompleteLogins.forEach(login => {
        expect(() => loginSchema.parse(login)).toThrow()
      })
    })
  })

  describe('commentSchema', () => {
    it('validates correct comment data', () => {
      const validComment = {
        text: 'This is a valid comment with some content.',
        fullName: 'John Doe'
      }

      expect(() => commentSchema.parse(validComment)).not.toThrow()
    })

    it('rejects invalid comment data', () => {
      const invalidComments = [
        {
          text: '', // Empty text
          fullName: 'John Doe'
        },
        {
          text: 'a'.repeat(1001), // Too long
          fullName: 'John Doe'
        },
        {
          text: 'Valid comment' // Missing fullName
        }
      ]

      invalidComments.forEach(comment => {
        expect(() => commentSchema.parse(comment)).toThrow()
      })
    })
  })

  describe('searchFiltersSchema', () => {
    it('validates empty search filters', () => {
      expect(() => searchFiltersSchema.parse({})).not.toThrow()
    })

    it('validates complete search filters', () => {
      const validFilters = {
        searchTerm: 'John',
        status: ['Employed', 'Recruit'],
        zone: ['Textile', 'Manufacturing'],
        poste: ['Operator', 'Supervisor'],
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      }

      expect(() => searchFiltersSchema.parse(validFilters)).not.toThrow()
    })

    it('rejects invalid date ranges', () => {
      const invalidFilters = {
        dateRange: {
          start: 'invalid-date',
          end: '2024-12-31'
        }
      }

      expect(() => searchFiltersSchema.parse(invalidFilters)).toThrow()
    })
  })

  describe('personnelStatusSchema', () => {
    it('validates all valid personnel statuses', () => {
      const validStatuses = ['Recruit', 'In-Training', 'Waiting for test', 'Employed', 'Departed']

      validStatuses.forEach(status => {
        expect(() => personnelStatusSchema.parse(status)).not.toThrow()
      })
    })

    it('rejects invalid personnel statuses', () => {
      const invalidStatuses = ['Active', 'Inactive', 'Pending', 'Unknown', '']

      invalidStatuses.forEach(status => {
        expect(() => personnelStatusSchema.parse(status)).toThrow()
      })
    })
  })

  describe('testResultSchema', () => {
    it('validates all valid test results', () => {
      const validResults = ['Pass', 'Fail but Promising', 'Fail']

      validResults.forEach(result => {
        expect(() => testResultSchema.parse(result)).not.toThrow()
      })
    })

    it('rejects invalid test results', () => {
      const invalidResults = ['Success', 'Failure', 'Pending', 'Unknown', '']

      invalidResults.forEach(result => {
        expect(() => testResultSchema.parse(result)).toThrow()
      })
    })
  })
})
