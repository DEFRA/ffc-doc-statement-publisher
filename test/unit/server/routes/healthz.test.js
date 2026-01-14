const { OK } = require('../../../../app/constants/ok')

describe('healthz route', () => {
  let healthzRoute

  beforeEach(() => {
    healthzRoute = require('../../../../app/server/routes/healthz')
  })

  test('exports an object', () => {
    expect(typeof healthzRoute).toBe('object')
  })

  test('has correct method', () => {
    expect(healthzRoute.method).toBe('GET')
  })

  test('has correct path', () => {
    expect(healthzRoute.path).toBe('/healthz')
  })

  test('has a handler function', () => {
    expect(typeof healthzRoute.handler).toBe('function')
  })

  test('handler returns OK with 200 status code', () => {
    const mockResponse = {
      code: jest.fn().mockReturnThis()
    }
    const mockH = {
      response: jest.fn().mockReturnValue(mockResponse)
    }
    const mockRequest = {}

    const result = healthzRoute.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith(OK)
    expect(mockResponse.code).toHaveBeenCalledWith(200)
    expect(result).toBe(mockResponse)
  })
})
