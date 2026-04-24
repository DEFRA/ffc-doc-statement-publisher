// BEGIN GENERATED CODE BY ATOS POLARIS AI FOR DEVELOPMENT ON 4/24/2026, 2:48:56 PM

const { findDeliveries } = require('../../../app/retention/find-deliveries')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  Sequelize: {
    Op: {
      in: 'IN_OPERATOR'
    }
  },
  delivery: {
    findAll: jest.fn()
  }
}))

describe('findDeliveries', () => {
  const statementIds = [10, 20, 30]
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.delivery.findAll with correct parameters including transaction', async () => {
    const mockResult = [
      { deliveryId: 101 },
      { deliveryId: 102 }
    ]
    db.delivery.findAll.mockResolvedValue(mockResult)

    const result = await findDeliveries(statementIds, mockTransaction)

    expect(db.delivery.findAll).toHaveBeenCalledTimes(1)
    expect(db.delivery.findAll).toHaveBeenCalledWith({
      attributes: ['deliveryId'],
      where: {
        statementId: { [db.Sequelize.Op.in]: statementIds }
      },
      transaction: mockTransaction
    })
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided', async () => {
    const mockResult = []
    db.delivery.findAll.mockResolvedValue(mockResult)

    const result = await findDeliveries(statementIds)

    expect(db.delivery.findAll).toHaveBeenCalledWith({
      attributes: ['deliveryId'],
      where: {
        statementId: { [db.Sequelize.Op.in]: statementIds }
      },
      transaction: undefined
    })
    expect(result).toBe(mockResult)
  })

  test('propagates errors from db.delivery.findAll', async () => {
    const error = new Error('DB failure')
    db.delivery.findAll.mockRejectedValue(error)

    await expect(findDeliveries(statementIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
