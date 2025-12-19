describe('errors plugin', () => {
  let errorsPlugin

  beforeEach(() => {
    errorsPlugin = require('../../../../app/server/plugins/errors')
  })

  test('exports an object', () => {
    expect(typeof errorsPlugin).toBe('object')
  })

  test('has plugin property', () => {
    expect(errorsPlugin).toHaveProperty('plugin')
  })

  test('plugin has name property', () => {
    expect(errorsPlugin.plugin.name).toBe('errors')
  })

  test('plugin has register function', () => {
    expect(typeof errorsPlugin.plugin.register).toBe('function')
  })

  describe('register function', () => {
    let mockServer
    let mockRequest
    let mockH

    beforeEach(() => {
      mockServer = {
        ext: jest.fn()
      }
      mockRequest = {
        response: {},
        log: jest.fn()
      }
      mockH = {
        continue: Symbol('continue')
      }
    })

    test('registers onPreResponse extension', () => {
      errorsPlugin.plugin.register(mockServer)

      expect(mockServer.ext).toHaveBeenCalledTimes(1)
      expect(mockServer.ext).toHaveBeenCalledWith('onPreResponse', expect.any(Function))
    })

    test('logs error and returns response when response is Boom error', () => {
      errorsPlugin.plugin.register(mockServer)
      const handler = mockServer.ext.mock.calls[0][1]

      mockRequest.response = {
        isBoom: true,
        output: {
          statusCode: 400
        },
        message: 'Bad Request',
        data: null
      }

      const result = handler(mockRequest, mockH)

      expect(mockRequest.log).toHaveBeenCalledWith('error', {
        statusCode: 400,
        message: 'Bad Request',
        payloadMessage: ''
      })
      expect(result).toBe(mockRequest.response)
    })

    test('logs error with payload message when response data exists', () => {
      errorsPlugin.plugin.register(mockServer)
      const handler = mockServer.ext.mock.calls[0][1]

      mockRequest.response = {
        isBoom: true,
        output: {
          statusCode: 422
        },
        message: 'Validation Error',
        data: {
          payload: {
            message: 'Invalid field'
          }
        }
      }

      handler(mockRequest, mockH)

      expect(mockRequest.log).toHaveBeenCalledWith('error', {
        statusCode: 422,
        message: 'Validation Error',
        payloadMessage: 'Invalid field'
      })
    })

    test('continues when response is not a Boom error', () => {
      errorsPlugin.plugin.register(mockServer)
      const handler = mockServer.ext.mock.calls[0][1]

      mockRequest.response = {
        isBoom: false
      }

      const result = handler(mockRequest, mockH)

      expect(mockRequest.log).not.toHaveBeenCalled()
      expect(result).toBe(mockH.continue)
    })
  })
})
