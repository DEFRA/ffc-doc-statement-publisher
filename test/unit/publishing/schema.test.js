const schema = require('../../../app/publishing/schema')

describe('Email Schema', () => {
  test.each([
    { email: 'test@example.com', valid: true },
    { email: 'invalid-email', valid: false, errorMessage: 'email must be a valid email address' },
    { email: '', valid: true },
    { email: null, valid: true },
    { email: undefined, valid: true }
  ])('should validate email: $email', ({ email, valid, errorMessage }) => {
    const result = schema.validate(email)
    if (valid) {
      expect(result.error).toBeUndefined()
    } else {
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toBe(errorMessage)
    }
  })
})
