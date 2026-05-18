const { removeFailures } = require('../../../app/retention/remove-failures')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  Sequelize: {
    Op: {
      in: 'IN_OPERATOR'
    }
  },
  failure: {
    destroy: jest.fn()
  }
}))

describe('removeFailures', () => {
  const deliveryIds = [100, 200, 300]
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.failure.destroy with correct parameters including transaction', async () => {
    db.failure.destroy.mockResolvedValue(3) // optional: number of rows deleted

    await removeFailures(deliveryIds, mockTransaction)

    expect(db.failure.destroy).toHaveBeenCalledTimes(1)
    expect(db.failure.destroy).toHaveBeenCalledWith({
      where: {
        deliveryId: { [db.Sequelize.Op.in]: deliveryIds }
      },
      transaction: mockTransaction
    })
  })

  test('passes undefined transaction if not provided', async () => {
    db.failure.destroy.mockResolvedValue(0)

    await removeFailures(deliveryIds)

    expect(db.failure.destroy).toHaveBeenCalledWith({
      where: {
        deliveryId: { [db.Sequelize.Op.in]: deliveryIds }
      },
      transaction: undefined
    })
  })

  test('propagates errors from db.failure.destroy', async () => {
    const error = new Error('DB failure')
    db.failure.destroy.mockRejectedValue(error)

    await expect(removeFailures(deliveryIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
