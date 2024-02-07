const validateRequest = require('../../../app/messaging/validate-request')

let request

describe('Validate request', () => {
  describe.each([
    { name: 'statement', value: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)).body, expected: undefined },
    { name: 'schedule', value: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').SCHEDULE_MESSAGE)).body, expected: undefined }
  ])('When request is $name', ({ name, value, expected }) => {
    test(`returns ${expected}`, async () => {
      const result = validateRequest(value)
      expect(result).toBe(expected)
    })
  })

  describe.each([
    { name: 'false' },
    { name: 'true' },
    { name: '0' },
    { name: '1' },
    { name: '""' },
    { name: '{}' },
    { name: '[]' }
  ])('When request is $name', ({ name }) => {
    test('throws', async () => {
      expect(() => validateRequest(request)).toThrow()
    })

    test('throws Error', async () => {
      expect(() => validateRequest(request)).toThrow(Error)
    })

    test('throws error which starts "Statement request is invalid"', async () => {
      expect(() => validateRequest(request)).toThrow(/^Statement request is invalid/)
    })

    test('throws error with category key', async () => {
      try {
        validateRequest(request)
      } catch (error) {
        expect(error).toHaveProperty('category')
      }
    })

    test('throws error with category value "validation"', async () => {
      try {
        validateRequest(request)
      } catch (error) {
        expect(error.category).toBe('validation')
      }
    })
  })
})
