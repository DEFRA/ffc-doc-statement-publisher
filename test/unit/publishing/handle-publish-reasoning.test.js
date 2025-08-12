const { EMPTY, INVALID, UNSUCCESSFUL } = require('../../../app/constants/failure-reasons')

const handlePublishReasoning = require('../../../app/publishing/handle-publish-reasoning')

let error

describe('Handle error message from attempting to publish a statement', () => {
  describe('When error is an empty email', () => {
    beforeEach(() => {
      error = { message: 'Email is invalid: Email cannot be empty.' }
    })

    test('returns EMPTY', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(EMPTY)
    })
  })

  describe('When error is an invalid email', () => {
    beforeEach(() => {
      error = { message: 'Email is invalid: The email provided is invalid.' }
    })

    test('returns INVALID', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(INVALID)
    })
  })

  describe('When error is alternative invalid email', () => {
    beforeEach(() => {
      error = { message: 'email_address Not a valid email address' }
    })

    test('returns INVALID', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(INVALID)
    })
  })

  describe('When error is an unrecognised issue', () => {
    beforeEach(() => {
      error = { message: 'Unknown issue' }
    })

    test('returns UNSUCCESSFUL', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
    })
  })

  describe('When error is invalid', () => {
    beforeEach(() => {
      error = {}
    })

    test('returns UNSUCCESSFUL', () => {
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
    })
  })

  describe('When error contains API response data', () => {
    beforeEach(() => {
      console.log = jest.fn()
    })

    test('handles 403 status code and logs API key issue', () => {
      error = {
        response: {
          data: {
            status_code: 403
          }
        }
      }

      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
    })

    test('handles authorization error in errors array and logs API key issue', () => {
      error = {
        response: {
          data: {
            errors: ['Invalid authorization token']
          }
        }
      }

      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
    })

    test('handles API key error in errors array and logs API key issue', () => {
      error = {
        response: {
          data: {
            errors: ['Invalid api key provided']
          }
        }
      }

      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
    })

    test('returns UNSUCCESSFUL with apiError.message', () => {
      error = {
        response: {
          data: {
            message: 'API error occurred'
          }
        }
      }

      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('API Error reason: API error occurred')
    })

    test('returns UNSUCCESSFUL with apiError.errors[0]', () => {
      error = {
        response: {
          data: {
            errors: ['First error message']
          }
        }
      }

      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('API Error reason: First error message')
    })
  })

  describe('When apiError.errors contains various types for .some', () => {
    beforeEach(() => {
      console.log = jest.fn()
    })

    test('handles errors array with string containing "authorization"', () => {
      error = {
        response: {
          data: {
            errors: ['authorization failed']
          }
        }
      }
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
    })

    test('handles errors array with string containing "api key"', () => {
      error = {
        response: {
          data: {
            errors: ['bad api key']
          }
        }
      }
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
    })

    test('handles errors array with object containing message with "authorization"', () => {
      error = {
        response: {
          data: {
            errors: [{ message: 'authorization denied' }]
          }
        }
      }
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
    })

    test('handles errors array with object containing message with "api key"', () => {
      error = {
        response: {
          data: {
            errors: [{ message: 'invalid api key' }]
          }
        }
      }
      const result = handlePublishReasoning(error)
      expect(result).toBe(UNSUCCESSFUL)
      expect(console.log).toHaveBeenCalledWith('Possible API key issue detected')
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
})
