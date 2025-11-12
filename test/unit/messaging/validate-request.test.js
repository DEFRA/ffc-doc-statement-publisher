const validateRequest = require('../../../app/messaging/validate-request')

describe('Validate request', () => {
  const validRequest = JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)).body

  test('returns undefined for a valid statement request', () => {
    const result = validateRequest(validRequest)
    expect(result).toBeUndefined()
  })

  // Invalid request cases
  const invalidValues = [
    { name: 'false', value: false },
    { name: 'true', value: true },
    { name: '0', value: 0 },
    { name: '1', value: 1 },
    { name: 'empty string', value: '' },
    { name: 'empty object', value: {} },
    { name: 'empty array', value: [] }
  ]

  describe.each(invalidValues)('When request is $name', ({ value }) => {
    test('throws an error', () => {
      expect(() => validateRequest(value)).toThrow()
    })

    test('throws an Error instance', () => {
      expect(() => validateRequest(value)).toThrow(Error)
    })

    test('throws an error starting with "Statement request is invalid"', () => {
      expect(() => validateRequest(value)).toThrow(/^Statement request is invalid/)
    })

    test('throws an error with category key', () => {
      try {
        validateRequest(value)
      } catch (error) {
        expect(error).toHaveProperty('category')
      }
    })

    test('throws an error with category value "validation"', () => {
      try {
        validateRequest(value)
      } catch (error) {
        expect(error.category).toBe('validation')
      }
    })
  })
})
