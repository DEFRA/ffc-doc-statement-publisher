const createDelivery = require('../../../app/monitoring/create-delivery')

jest.mock('../../../app/data', () => ({
  delivery: {
    create: jest.fn()
  }
}))

const db = require('../../../app/data')

describe('createDelivery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.delivery.create.mockResolvedValue({})
  })

  test('creates a delivery record with the provided parameters', async () => {
    const statementId = 123
    const method = 'email'
    const reference = 'REF-123-ABC'
    const requested = new Date('2025-04-14T12:00:00Z')
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() }

    db.delivery.create.mockResolvedValue({
      id: 456,
      statementId,
      method,
      reference,
      requested
    })

    await createDelivery(statementId, method, reference, requested, mockTransaction)

    expect(db.delivery.create).toHaveBeenCalledTimes(1)
    expect(db.delivery.create).toHaveBeenCalledWith({
      statementId,
      method,
      reference,
      requested
    }, { transaction: mockTransaction })
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

  test('works without a transaction parameter', async () => {
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

    await createDelivery(statementId, method, reference, requested)

    expect(db.delivery.create).toHaveBeenCalledTimes(1)
    expect(db.delivery.create).toHaveBeenCalledWith({
      statementId,
      method,
      reference,
      requested
    }, { transaction: undefined })
  })
})
