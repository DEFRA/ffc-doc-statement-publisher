const standardErrorObject = require('../../../app/publishing/standard-error-object')

describe('standardErrorObject', () => {
  test.each([
    {
      err: {
        status: 404,
        data: { errors: [{ message: 'Resource not found' }] },
        message: 'The requested resource could not be found'
      },
      reason: 'Resource Error',
      expected: {
        reason: 'Resource Error',
        statusCode: 404,
        error: 'Resource not found',
        message: 'The requested resource could not be found'
      }
    },
    {
      err: {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      },
      reason: 'Server Error',
      expected: {
        reason: 'Server Error',
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }
    }
  ])('should transform error object correctly for %o', ({ err, reason, expected }) => {
    const result = standardErrorObject(err, reason)
    expect(result).toEqual(expected)
  })
})
