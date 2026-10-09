const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['delivery'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeDeliveries } = require('../../../app/retention/remove-deliveries')

describe('removeDeliveries', () => {
  const deliveryIds = [100, 200, 300]
  const mockTransaction = mockDb.trx

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(3)
  })

  test('deletes deliveries with deliveryId in the given list, including transaction', async () => {
    await removeDeliveries(deliveryIds, mockTransaction)

    expect(mockDb.tables.delivery).toHaveBeenCalledTimes(1)
    expect(mockDb.tables.delivery).toHaveBeenCalledWith(mockTransaction)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('deliveryId', deliveryIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('passes undefined transaction if not provided', async () => {
    mockDb.builder.resolves(0)

    await removeDeliveries(deliveryIds)

    expect(mockDb.tables.delivery).toHaveBeenCalledWith(undefined)
  })

  test('propagates errors from the delete', async () => {
    const error = new Error('DB failure')
    mockDb.builder.rejects(error)

    await expect(removeDeliveries(deliveryIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
