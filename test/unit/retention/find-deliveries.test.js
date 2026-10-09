const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { findDeliveries } = require('../../../app/retention/find-deliveries')

describe('findDeliveries', () => {
  const statementIds = [10, 20, 30]
  const mockTransaction = mockDb.trx

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('selects deliveryId with statementId in the given list, including transaction', async () => {
    const mockResult = [
      { deliveryId: 101 },
      { deliveryId: 102 }
    ]
    mockDb.builder.resolves(mockResult)

    const result = await findDeliveries(statementIds, mockTransaction)

    expect(mockDb.tables.delivery).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.delivery).toHaveBeenCalledWith(mockTransaction)
    expect(mockDb.builder.select).toHaveBeenCalledWith('deliveryId')
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('statementId', statementIds)
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided', async () => {
    const mockResult = []
    mockDb.builder.resolves(mockResult)

    const result = await findDeliveries(statementIds)

    expect(mockDb.tables.delivery).toHaveBeenCalledWith(undefined)
    expect(result).toBe(mockResult)
  })

  test('propagates errors from the query', async () => {
    const error = new Error('DB failure')
    mockDb.builder.rejects(error)

    await expect(findDeliveries(statementIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
