const schema = require('../../../app/messaging/schema')

let messagingMockRequest

describe('request schema', () => {
  beforeEach(() => {
    messagingMockRequest = structuredClone(require('../../mocks/messaging-schema'))
  })

  // --- Valid cases ---
  test('validates success if all present', () => {
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  // --- Invalid filename ---
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

  // --- FRN & SBI validations ---
  test.each([
    { field: 'frn', value: undefined },
    { field: 'frn', value: 10000000000 },
    { field: 'frn', value: 100 },
    { field: 'sbi', value: undefined },
    { field: 'sbi', value: 10000000000 },
    { field: 'sbi', value: 100 }
  ])('validates $field with value $value', ({ field, value }) => {
    if (value === undefined) delete messagingMockRequest[field]
    else messagingMockRequest[field] = value
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeDefined()
  })

  // --- Business name ---
  test('validates fail if missing businessName', () => {
    delete messagingMockRequest.businessName
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeDefined()
  })

  // --- Address validations ---
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

  test('validates fail if missing address', () => {
    delete messagingMockRequest.address
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeDefined()
  })

  // --- Postcode ---
  test.each([
    { desc: 'missing postcode', action: () => delete messagingMockRequest.address.postcode },
    { desc: 'empty postcode', action: () => { messagingMockRequest.address.postcode = '' } }
  ])('validates success if $desc', ({ action }) => {
    action()
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  // --- Email validations ---
  test.each([
    { desc: 'missing email', action: () => delete messagingMockRequest.email },
    { desc: 'invalid email', action: () => { messagingMockRequest.email = 'This is not an email' } }
  ])('validates success if $desc', ({ action }) => {
    action()
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })

  // --- Scheme validations ---
  test.each([
    { field: 'name', value: undefined },
    { field: 'name', value: '' },
    { field: 'shortName', value: undefined },
    { field: 'shortName', value: '' },
    { field: 'year', value: undefined },
    { field: 'year', value: '' }
  ])('validates fail if scheme.$field is invalid', ({ field, value }) => {
    messagingMockRequest.scheme[field] = value
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeDefined()
  })

  // --- Scheme frequency (optional) ---
  test.each([
    { desc: 'missing', value: undefined },
    { desc: 'empty', value: '' },
    { desc: 'null', value: null }
  ])('validates success if scheme frequency is $desc', ({ value }) => {
    messagingMockRequest.scheme.frequency = value
    const result = schema.validate(messagingMockRequest)
    expect(result.error).toBeUndefined()
  })
})
