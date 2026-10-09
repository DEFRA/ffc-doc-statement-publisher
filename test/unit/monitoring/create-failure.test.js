const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['failure'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const createFailure = require('../../../app/monitoring/create-failure')

describe('processCreateFailure', () => {
  const transaction = mockDb.trx

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

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
  ])('should insert the failure row correctly $description', async ({ errorObject, expected }) => {
    const deliveryId = '123'
    const timestamp = new Date()

    await createFailure(deliveryId, errorObject, timestamp, transaction)

    expect(mockDb.tables.failure).toHaveBeenCalledWith(transaction)
    expect(mockDb.builder.insert).toHaveBeenCalledWith({ deliveryId, failed: timestamp, ...expected })
  })
})
