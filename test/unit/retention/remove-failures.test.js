const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['failure'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeFailures } = require('../../../app/retention/remove-failures')

describe('removeFailures', () => {
  const deliveryIds = [100, 200, 300]
  const mockTransaction = mockDb.trx

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(3)
  })

  test('deletes failures with deliveryId in the given list, including transaction', async () => {
    await removeFailures(deliveryIds, mockTransaction)

    expect(mockDb.tables.failure).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.failure).toHaveBeenCalledWith(mockTransaction)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('deliveryId', deliveryIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('passes undefined transaction if not provided', async () => {
    mockDb.builder.resolves(0)

    await removeFailures(deliveryIds)

    expect(mockDb.tables.failure).toHaveBeenCalledWith(undefined)
  })

  test('propagates errors from the delete', async () => {
    const error = new Error('DB failure')
    mockDb.builder.rejects(error)

    await expect(removeFailures(deliveryIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
