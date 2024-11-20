const standardErrorObject = require('../../../app/publishing/standard-error-object')

test('should transform error object correctly', () => {
  const err = {
    status: 404,
    data: {
      errors: [{ message: 'Resource not found' }]
    },
    message: 'The requested resource could not be found'
  }
  const reason = 'Resource Error'
  const expectedErrorObject = {
    reason,
    statusCode: 404,
    error: 'Resource not found',
    message: 'The requested resource could not be found'
  }

  const result = standardErrorObject(err, reason)

  expect(result).toEqual(expectedErrorObject)
})

test('should handle error object without errors array', () => {
  const err = {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }
  const reason = 'Server Error'
  const expectedErrorObject = {
    reason,
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }

  const result = standardErrorObject(err, reason)

  expect(result).toEqual(expectedErrorObject)
})
