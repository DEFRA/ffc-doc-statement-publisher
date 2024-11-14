const schema = require('../../../app/messaging/schema')
let messagingMockRequest
let mockRequest

describe('request schema', () => {
  beforeEach(() => {
    mockRequest = JSON.parse(JSON.stringify(require('../../mocks/request')))
    messagingMockRequest = JSON.parse(JSON.stringify(require('../../mocks/messaging-schema')))
  })

  test('validates success if all present', () => {
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('should not validate an object with incorrect filename', () => {
    messagingMockRequest.filename = 'not a valid filename'
    const { error } = schema.validate(messagingMockRequest)
    expect(error).toBeDefined()
    expect(error.details[0].message).toEqual('filename must match the required pattern')
  })

  test('validates fail if missing frn', () => {
    delete mockRequest.frn
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if frn too high', () => {
    mockRequest.frn = 10000000000
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if frn too low', () => {
    mockRequest.frn = 100
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if missing sbi', () => {
    delete mockRequest.sbi
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if sbi too high', () => {
    mockRequest.sbi = 10000000000
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if sbi too low', () => {
    mockRequest.sbi = 100
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if missing business name', () => {
    delete mockRequest.businessName
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if missing address', () => {
    delete mockRequest.address
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates success if missing postcode', () => {
    delete mockRequest.address.postcode
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty postcode', () => {
    mockRequest.address.postcode = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if missing line 1', () => {
    delete mockRequest.address.line1
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty line 1', () => {
    mockRequest.address.line1 = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if missing line 2', () => {
    delete mockRequest.address.line2
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty line 2', () => {
    mockRequest.address.line2 = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if missing line 3', () => {
    delete mockRequest.address.line3
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty line 3', () => {
    mockRequest.address.line3 = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if missing line 4', () => {
    delete mockRequest.address.line4
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty line 4', () => {
    mockRequest.address.line4 = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if missing line 5', () => {
    delete mockRequest.address.line5
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty line 5', () => {
    mockRequest.address.line5 = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if missing email', () => {
    delete mockRequest.email
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if invalid email', () => {
    mockRequest.email = 'This is not an email'
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates fail if missing filename', () => {
    delete mockRequest.filename
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if missing scheme name', () => {
    delete mockRequest.scheme.name
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if empty scheme name', () => {
    mockRequest.scheme.name = ''
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if missing scheme short name', () => {
    delete mockRequest.scheme.shortName
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if empty scheme short name', () => {
    mockRequest.scheme.shortName = ''
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if missing scheme year', () => {
    delete mockRequest.scheme.year
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates fail if empty scheme year', () => {
    mockRequest.scheme.year = ''
    const result = schema.validate(mockRequest)
    expect(result.error).toBeDefined()
  })

  test('validates success if missing scheme frequency', () => {
    delete mockRequest.scheme.frequency
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if empty scheme frequency', () => {
    mockRequest.scheme.frequency = ''
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  test('validates success if scheme frequency is null', () => {
    mockRequest.scheme.frequency = null
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })
})
