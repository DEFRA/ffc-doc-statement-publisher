const { OK } = require('../../../../app/constants/ok')

describe('healthy route', () => {
  let healthyRoute

  beforeEach(() => {
    healthyRoute = require('../../../../app/server/routes/healthy')
  })

  test('exports an object', () => {
    expect(typeof healthyRoute).toBe('object')
  })

  test('has correct method', () => {
    expect(healthyRoute.method).toBe('GET')
  })

  test('has correct path', () => {
    expect(healthyRoute.path).toBe('/healthy')
  })

  test('has a handler function', () => {
    expect(typeof healthyRoute.handler).toBe('function')
  })

  test('handler returns OK with 200 status code', () => {
    const mockResponse = {
      code: jest.fn().mockReturnThis()
    }
    const mockH = {
      response: jest.fn().mockReturnValue(mockResponse)
    }
    const mockRequest = {}

    const result = healthyRoute.handler(mockRequest, mockH)

    expect(mockH.response).toHaveBeenCalledWith(OK)
    expect(mockResponse.code).toHaveBeenCalledWith(200)
    expect(result).toBe(mockResponse)
  })
})
