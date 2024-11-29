const db = require('../../../app/data')
const createFailure = require('../../../app/monitoring/create-failure')

jest.mock('../../../app/data', () => ({
  failure: {
    create: jest.fn()
  }
}))

describe('createFailure', () => {
  const transaction = {}

  test('should call db.failure.create with correct parameters', async () => {
    const deliveryId = '123'
    const errorObject = { reason: 'Network Error', statusCode: 500, error: 'Timeout', message: 'Request timed out' }
    const timestamp = new Date()

    await createFailure(deliveryId, errorObject, timestamp, transaction)

    expect(db.failure.create).toHaveBeenCalledWith({
      deliveryId,
      reason: 'Network Error',
      failed: timestamp,
      statusCode: 500,
      error: 'Timeout',
      message: 'Request timed out'
    }, { transaction })
  })

  test('should handle missing optional fields in errorObject', async () => {
    const deliveryId = '123'
    const errorObject = { reason: 'Network Error' }
    const timestamp = new Date()

    await createFailure(deliveryId, errorObject, timestamp, transaction)

    expect(db.failure.create).toHaveBeenCalledWith({
      deliveryId,
      reason: 'Network Error',
      failed: timestamp,
      statusCode: null,
      error: null,
      message: null
    }, { transaction })
  })

  test('should handle null errorObject', async () => {
    const deliveryId = '123'
    const errorObject = null
    const timestamp = new Date()

    await createFailure(deliveryId, errorObject, timestamp, transaction)

    expect(db.failure.create).toHaveBeenCalledWith({
      deliveryId,
      reason: undefined,
      failed: timestamp,
      statusCode: null,
      error: null,
      message: null
    }, { transaction })
  })
})
