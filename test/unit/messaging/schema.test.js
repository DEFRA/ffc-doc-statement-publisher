const schema = require('../../../app/messaging/schema')

let messagingMockRequest

describe('request schema', () => {
  beforeEach(() => {
    messagingMockRequest = structuredClone(require('../../mocks/messaging-schema'))
  })

  test('validates success if all present', () => {
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  describe('filename validation', () => {
    test('should not validate an object with incorrect filename', () => {
      messagingMockRequest.filename = 'not a valid filename'
      const { error } = schema.validate(messagingMockRequest)
      expect(error).toBeDefined()
      expect(error.details[0].message).toEqual('filename must match the required pattern')
    })

    test('validates fail if missing filename', () => {
      delete messagingMockRequest.filename
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('FRN and SBI validation - datatype checks', () => {
    test.each([
      { field: 'frn', value: undefined },
      { field: 'frn', value: 10000000000 },
      { field: 'frn', value: 100 },
      { field: 'frn', value: '1234567890' },
      { field: 'sbi', value: undefined },
      { field: 'sbi', value: 10000000000 },
      { field: 'sbi', value: 100 },
      { field: 'sbi', value: '123456789' }
    ])('validates fail if $field is $value', ({ field, value }) => {
      if (value === undefined) {
        delete messagingMockRequest[field]
      } else {
        messagingMockRequest[field] = value
      }

      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('businessName validation', () => {
    test('validates fail if missing businessName', () => {
      delete messagingMockRequest.businessName
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates fail if businessName exceeds max length', () => {
      messagingMockRequest.businessName = 'a'.repeat(161)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success if businessName at max length', () => {
      messagingMockRequest.businessName = 'a'.repeat(160)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })
  })

  describe('address validation', () => {
    const addressLines = ['line1', 'line2', 'line3', 'line4', 'line5']

    test.each(addressLines)('validates success if address.%s is missing', (line) => {
      delete messagingMockRequest.address[line]
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test.each(addressLines)('validates success if address.%s is empty', (line) => {
      messagingMockRequest.address[line] = ''
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if missing address object', () => {
      delete messagingMockRequest.address
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates fail if address line exceeds max length', () => {
      messagingMockRequest.address.line1 = 'a'.repeat(241)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success if address line at max length', () => {
      messagingMockRequest.address.line1 = 'a'.repeat(240)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test.each([
      { desc: 'missing postcode', action: () => delete messagingMockRequest.address.postcode },
      { desc: 'empty postcode', action: () => { messagingMockRequest.address.postcode = '' } }
    ])('validates success if $desc', ({ action }) => {
      action()
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if postcode exceeds max length', () => {
      messagingMockRequest.address.postcode = 'a'.repeat(9)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('email validation', () => {
    test.each([
      { desc: 'missing email', action: () => delete messagingMockRequest.email },
      { desc: 'empty email', action: () => { messagingMockRequest.email = '' } },
      { desc: 'null email', action: () => { messagingMockRequest.email = null } }
    ])('validates success if $desc', ({ action }) => {
      action()
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if email exceeds max length', () => {
      messagingMockRequest.email = 'a'.repeat(261)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('scheme validation', () => {
    test.each([
      { field: 'name', value: undefined },
      { field: 'name', value: '' },
      { field: 'shortName', value: undefined },
      { field: 'shortName', value: '' },
      { field: 'year', value: undefined },
      { field: 'year', value: '' },
      { field: 'year', value: 2024 }
    ])('validates fail if scheme.$field is invalid', ({ field, value }) => {
      messagingMockRequest.scheme[field] = value
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates fail if scheme.name exceeds max length', () => {
      messagingMockRequest.scheme.name = 'a'.repeat(101)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates fail if scheme.shortName exceeds max length', () => {
      messagingMockRequest.scheme.shortName = 'a'.repeat(11)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates fail if scheme.year is not exactly 4 characters', () => {
      messagingMockRequest.scheme.year = '202'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success if scheme.year is exactly 4 characters', () => {
      messagingMockRequest.scheme.year = '2024'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test.each([
      { desc: 'missing', value: undefined },
      { desc: 'empty', value: '' },
      { desc: 'null', value: null }
    ])('validates success if scheme frequency is $desc', ({ value }) => {
      messagingMockRequest.scheme.frequency = value
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if scheme.frequency exceeds max length', () => {
      messagingMockRequest.scheme.frequency = 'a'.repeat(11)
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success if scheme.agreementNumber is a valid number', () => {
      messagingMockRequest.scheme.agreementNumber = 123456789
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test.each([
      { desc: 'missing', value: undefined },
      { desc: 'null', value: null },
      { desc: 'empty string', value: '' }
    ])('validates success if scheme.agreementNumber is $desc', ({ value }) => {
      messagingMockRequest.scheme.agreementNumber = value
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if scheme.agreementNumber is a string instead of number', () => {
      messagingMockRequest.scheme.agreementNumber = 'ABC123'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('documentReference validation', () => {
    test('validates success with valid documentReference', () => {
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if missing documentReference', () => {
      delete messagingMockRequest.documentReference
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('conditional DP scheme fields', () => {
    beforeEach(() => {
      messagingMockRequest.scheme.shortName = 'DP'
    })

    test('validates success with paymentBand for DP scheme', () => {
      messagingMockRequest.paymentBand1 = 'Band A'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if paymentBand is missing for DP scheme', () => {
      delete messagingMockRequest.paymentBand1
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates fail if paymentBand is wrong type for DP scheme', () => {
      messagingMockRequest.paymentBand1 = 123
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success with percentageReduction matching pattern for DP scheme', () => {
      messagingMockRequest.percentageReduction1 = '12.50'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if percentageReduction does not match pattern for DP scheme', () => {
      messagingMockRequest.percentageReduction1 = '12.5'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success with monetaryPattern for progressiveReductions for DP scheme', () => {
      messagingMockRequest.progressiveReductions1 = '100.50'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if progressiveReductions does not match pattern for DP scheme', () => {
      messagingMockRequest.progressiveReductions1 = '100.5'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success with valid referenceAmount for DP scheme', () => {
      messagingMockRequest.referenceAmount = '500.00'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates success with valid paymentPeriod for DP scheme', () => {
      messagingMockRequest.paymentPeriod = 'Q1 2024'
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if paymentPeriod is missing for DP scheme', () => {
      delete messagingMockRequest.paymentPeriod
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })

    test('validates success with valid transactionDate for DP scheme', () => {
      messagingMockRequest.transactionDate = new Date('2024-01-15').toISOString()
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates fail if transactionDate is missing for DP scheme', () => {
      delete messagingMockRequest.transactionDate
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeDefined()
    })
  })

  describe('optional fields for non-DP schemes', () => {
    test('validates success with missing paymentBand for non-DP scheme', () => {
      messagingMockRequest.scheme.shortName = 'TS'
      delete messagingMockRequest.paymentBand1
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates success with missing percentageReduction for non-DP scheme', () => {
      messagingMockRequest.scheme.shortName = 'TS'
      delete messagingMockRequest.percentageReduction1
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates success with missing paymentPeriod for non-DP scheme', () => {
      messagingMockRequest.scheme.shortName = 'TS'
      delete messagingMockRequest.paymentPeriod
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })

    test('validates success with missing transactionDate for non-DP scheme', () => {
      messagingMockRequest.scheme.shortName = 'TS'
      delete messagingMockRequest.transactionDate
      const result = schema.validate(messagingMockRequest)
      expect(result.error).toBeUndefined()
    })
  })
})
