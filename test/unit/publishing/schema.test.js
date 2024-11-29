const schema = require('../../../app/publishing/schema')

describe('Email Schema', () => {
  test('should validate a valid email', () => {
    const result = schema.validate('test@example.com')
    expect(result.error).toBeUndefined()
  })
  test('should return an error for an invalid email', () => {
    const result = schema.validate('invalid-email')
    expect(result.error).toBeDefined()
    expect(result.error.details[0].message).toEqual('email must be a valid email address')
  })
  test('should allow an empty string without error', () => {
    const result = schema.validate('')
    expect(result.error).toBeUndefined()
  })
  test('should allow null without error', () => {
    const result = schema.validate(null)
    expect(result.error).toBeUndefined()
  })
  test('should allow missing email without error', () => {
    const result = schema.validate(undefined)
    expect(result.error).toBeUndefined()
  })
})
