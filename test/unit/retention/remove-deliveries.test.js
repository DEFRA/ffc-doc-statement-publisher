const { removeDeliveries } = require('../../../app/retention/remove-deliveries')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  Sequelize: {
    Op: {
      in: 'IN_OPERATOR'
    }
  },
  delivery: {
    destroy: jest.fn()
  }
}))

describe('removeDeliveries', () => {
  const deliveryIds = [100, 200, 300]
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.delivery.destroy with correct parameters including transaction', async () => {
    db.delivery.destroy.mockResolvedValue(3)

    await removeDeliveries(deliveryIds, mockTransaction)

    expect(db.delivery.destroy).toHaveBeenCalledTimes(1)
    expect(db.delivery.destroy).toHaveBeenCalledWith({
      where: {
        deliveryId: { [db.Sequelize.Op.in]: deliveryIds }
      },
      transaction: mockTransaction
    })
  })

  test('passes undefined transaction if not provided', async () => {
    db.delivery.destroy.mockResolvedValue(0)

    await removeDeliveries(deliveryIds)

    expect(db.delivery.destroy).toHaveBeenCalledWith({
      where: {
        deliveryId: { [db.Sequelize.Op.in]: deliveryIds }
      },
      transaction: undefined
    })
  })

  test('propagates errors from db.delivery.destroy', async () => {
    const error = new Error('DB failure')
    db.delivery.destroy.mockRejectedValue(error)

    await expect(removeDeliveries(deliveryIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
