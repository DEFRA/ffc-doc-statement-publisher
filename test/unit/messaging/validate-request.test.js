const validateRequest = require('../../../app/messaging/validate-request')
const mockRequest = require('../../mocks/request')

describe('validate message body can be processed as request', () => {
  test('does not throw on valid request', async () => {
    expect(() => validateRequest(mockRequest)).not.toThrow()
  })

  test('throws on undefined request', async () => {
    expect(() => validateRequest(undefined)).toThrow()
  })

  test('throws on missing request', async () => {
    expect(() => validateRequest()).toThrow()
  })

  test('throws on empty request', async () => {
    expect(() => validateRequest({})).toThrow()
  })

  test('throws on array request', async () => {
    expect(() => validateRequest([])).toThrow()
  })

  test('throws on true request', async () => {
    expect(() => validateRequest(true)).toThrow()
  })

  test('throws on false request', async () => {
    expect(() => validateRequest(false)).toThrow()
  })

  test('throws on 0 request', async () => {
    expect(() => validateRequest(0)).toThrow()
  })

  test('throws on 1 request', async () => {
    expect(() => validateRequest(1)).toThrow()
  })

  test('throws on empty string request', async () => {
    expect(() => validateRequest('')).toThrow()
  })

  test('throws on string request', async () => {
    expect(() => validateRequest('request')).toThrow()
  })
})
