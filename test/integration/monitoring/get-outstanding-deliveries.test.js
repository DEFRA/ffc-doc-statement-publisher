jest.mock('../../../app/data', () => ({
  sequelize: {
    truncate: jest.fn(),
    close: jest.fn()
  },
  statement: {
    bulkCreate: jest.fn()
  },
  delivery: {
    bulkCreate: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn()
  },
  Sequelize: {
    Op: {
      ne: Symbol('ne')
    }
  }
}))

const getOutstandingDeliveries = require('../../../app/monitoring/get-outstanding-deliveries')
const db = require('../../../app/data')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')

describe('get outstanding deliveries', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.statement.bulkCreate([mockStatement1, mockStatement2])
    await db.delivery.bulkCreate([mockDelivery1, mockDelivery2])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('returns correct number of outstanding deliveries', async () => {
    require('../../../app/data').delivery.findAll.mockResolvedValue([mockDelivery1])
    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(1)
  })

  test('returns correct outstanding delivery', async () => {
    require('../../../app/data').delivery.findAll.mockResolvedValue([mockDelivery1])
    const result = await getOutstandingDeliveries()
    expect(result[0].deliveryId).toBe(mockDelivery1.deliveryId)
  })

  test('does not return delivery without reference', async () => {
    require('../../../app/data').delivery.findAll.mockResolvedValue([])

    await db.delivery.update({ reference: null }, { where: { deliveryId: mockDelivery1.deliveryId } })
    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(0)
  })
})
