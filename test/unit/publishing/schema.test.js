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
  test('should return an error for an empty string', () => {
    const result = schema.validate('')
    expect(result.error).toBeDefined()
    expect(result.error.details[0].message).toEqual('email cannot be empty')
  })
  test('should return an error for a missing email', () => {
    const result = schema.validate()
    expect(result.error).toBeDefined()
    expect(result.error.details[0].message).toEqual('email string is missing, but it is required')
  })
})
