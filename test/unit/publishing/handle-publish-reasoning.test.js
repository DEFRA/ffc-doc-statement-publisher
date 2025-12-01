const { EMPTY, INVALID, UNSUCCESSFUL } = require('../../../app/constants/failure-reasons')
const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')

let error

describe('handlePublishReasoning', () => {
  describe('empty or invalid email errors', () => {
    const cases = [
      [{ message: 'Email is invalid: Email cannot be empty.' }, EMPTY],
      [{ message: 'Email is invalid: The email provided is invalid.' }, INVALID],
      [{ message: 'email_address Not a valid email address' }, INVALID],
      [{}, UNSUCCESSFUL],
      [{ message: 'Unknown issue' }, UNSUCCESSFUL]
    ]

    test.each(cases)('returns correct reason for error %o', (err, expected) => {
      const result = handlePublishReasoning(err)
      expect(result).toBe(expected)
    })
  })

  describe('API response errors', () => {
    beforeEach(() => {
      console.log = jest.fn()
      console.error = jest.fn()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test.each([
      [{ response: { data: { status_code: 403 } } }, 'Possible API key issue detected'],
      [{ response: { data: { errors: ['Invalid authorization token'] } } }, 'Possible API key issue detected'],
      [{ response: { data: { errors: ['Invalid api key provided'] } } }, 'Possible API key issue detected'],
      [{ response: { data: { errors: ['authorization failed'] } } }, 'Possible API key issue detected'],
      [{ response: { data: { errors: ['bad api key'] } } }, 'Possible API key issue detected'],
      [{ response: { data: { errors: [{ message: 'authorization denied' }] } } }, 'Possible API key issue detected'],
      [{ response: { data: { errors: [{ message: 'invalid api key' }] } } }, 'Possible API key issue detected']
    ])('logs API key message and returns UNSUCCESSFUL for %o', (err, logMsg) => {
      const result = handlePublishReasoning(err)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith(logMsg)
    })

    test.each([
      [{ response: { data: { message: 'API error occurred' } } }, 'API Error reason: API error occurred'],
      [{ response: { data: { errors: ['First error message'] } } }, 'API Error reason: First error message']
    ])('logs API error reason and returns UNSUCCESSFUL for %o', (err, logMsg) => {
      const result = handlePublishReasoning(err)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.error).toHaveBeenCalledWith(logMsg)
    })

    test('does not log API key issue if errors array does not match', () => {
      error = {
        response: {
          data: {
            errors: ['some other error', { message: 'another error' }]
          }
        }
      }
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).not.toHaveBeenCalledWith('Possible API key issue detected')
    })
  })

  describe('errorDetails logging', () => {
    beforeEach(() => {
      console.error = jest.fn()
      process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
      jest.restoreAllMocks()
      process.env.NODE_ENV = 'test'
    })

    test('logs errorDetails with message, code, and statusCode', () => {
      const err = new Error('Test error')
      err.code = 'TEST_CODE'
      err.statusCode = 500

      const result = handlePublishReasoning(err)

      expect(result).toBe(UNSUCCESSFUL)
      expect(console.error).toHaveBeenCalledWith('Publish failure details:', {
        message: 'Test error',
        code: 'TEST_CODE',
        statusCode: 500,
        stack: err.stack
      })
    })

    test('includes stack in errorDetails when not in production and code is not BLOB_NOT_FOUND', () => {
      const err = new Error('Test error')
      err.code = 'SOME_CODE'

      handlePublishReasoning(err)

      const callArgs = console.error.mock.calls.find(call => call[0] === 'Publish failure details:')
      expect(callArgs[1].stack).toBeDefined()
    })

    test('excludes stack from errorDetails when in production', () => {
      process.env.NODE_ENV = 'production'
      const err = new Error('Test error')
      err.code = 'SOME_CODE'

      handlePublishReasoning(err)

      const callArgs = console.error.mock.calls.find(call => call[0] === 'Publish failure details:')
      expect(callArgs[1].stack).toBeUndefined()
    })

    test('excludes stack from errorDetails when code is BLOB_NOT_FOUND', () => {
      const err = new Error('Test error')
      err.code = 'BLOB_NOT_FOUND'

      handlePublishReasoning(err)

      const callArgs = console.error.mock.calls.find(call => call[0] === 'Publish failure details:')
      expect(callArgs[1].stack).toBeUndefined()
    })

    test('logs errorDetails with undefined values when error properties are missing', () => {
      const err = new Error('Test error')

      handlePublishReasoning(err)

      const callArgs = console.error.mock.calls.find(call => call[0] === 'Publish failure details:')
      expect(callArgs[1].code).toBeUndefined()
      expect(callArgs[1].statusCode).toBeUndefined()
    })
  })
})
