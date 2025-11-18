const db = require('../../../app/data')
const createFailure = require('../../../app/monitoring/create-failure')

jest.mock('../../../app/data', () => ({
  failure: {
    create: jest.fn()
  }
}))

describe('processCreateFailure', () => {
  const transaction = {}

  test.each([
    {
      description: 'with full errorObject',
      errorObject: { reason: 'Network Error', statusCode: 500, error: 'Timeout', message: 'Request timed out' },
      expected: { reason: 'Network Error', statusCode: 500, error: 'Timeout', message: 'Request timed out' }
    },
    {
      description: 'with partial errorObject',
      errorObject: { reason: 'Network Error' },
      expected: { reason: 'Network Error', statusCode: null, error: null, message: null }
    },
    {
      description: 'with null errorObject',
      errorObject: null,
      expected: { reason: undefined, statusCode: null, error: null, message: null }
    }
  ])('should call db.failure.create correctly $description', async ({ errorObject, expected }) => {
    const deliveryId = '123'
    const timestamp = new Date()

    await createFailure(deliveryId, errorObject, timestamp, transaction)

    expect(db.failure.create).toHaveBeenCalledWith(
      { deliveryId, failed: timestamp, ...expected },
      { transaction }
    )
  })
})
