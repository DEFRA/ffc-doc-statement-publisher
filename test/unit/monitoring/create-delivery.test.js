const createDelivery = require('../../../app/monitoring/create-delivery')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  delivery: {
    create: jest.fn()
  }
}))

describe('processCreateDelivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    {
      description: 'with a transaction',
      transaction: { commit: jest.fn(), rollback: jest.fn() }
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

    db.delivery.create.mockResolvedValue({
      id: 456,
      statementId,
      method,
      reference,
      requested
    })

    await createDelivery(statementId, method, reference, requested, transaction)

    expect(db.delivery.create).toHaveBeenCalledTimes(1)
    expect(db.delivery.create).toHaveBeenCalledWith(
      { statementId, method, reference, requested },
      { transaction }
    )
  })

  test('throws an error if the database operation fails', async () => {
    const statementId = 123
    const method = 'email'
    const reference = 'REF-123-ABC'
    const requested = new Date('2025-04-14T12:00:00Z')
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() }

    const dbError = new Error('Database connection failed')
    db.delivery.create.mockRejectedValue(dbError)

    await expect(createDelivery(statementId, method, reference, requested, mockTransaction))
      .rejects
      .toThrow(dbError)
  })
})
