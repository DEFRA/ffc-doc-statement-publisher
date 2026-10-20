const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const createDelivery = require('../../../app/monitoring/create-delivery')

describe('processCreateDelivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test.each([
    {
      description: 'with a transaction',
      transaction: mockDb.trx
    },
    {
      description: 'without a transaction',
      transaction: undefined
    }
  ])('creates a delivery record $description', async ({ transaction }) => {
    const statementId = 123
    const method = 'email'
    const reference = 'REF-123-ABC'
    const requested = new Date('2025-04-14T12:00:00Z')

    await createDelivery(statementId, method, reference, requested, transaction)

    expect(mockDb.tables.delivery).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.delivery).toHaveBeenCalledWith(transaction)
    expect(mockDb.builder.insert).toHaveBeenCalledWith({ statementId, method, reference, requested })
  })

  test('throws an error if the database operation fails', async () => {
    const statementId = 123
    const method = 'email'
    const reference = 'REF-123-ABC'
    const requested = new Date('2025-04-14T12:00:00Z')

    const dbError = new Error('Database connection failed')
    mockDb.builder.rejects(dbError)

    await expect(createDelivery(statementId, method, reference, requested, mockDb.trx))
      .rejects
      .toThrow(dbError)
  })
})
