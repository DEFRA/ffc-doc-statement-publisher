const db = require('../../../app/data')
const getOutstandingDeliveries = require('../../../app/monitoring/get-outstanding-deliveries')
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
    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(1)
  })

  test('returns correct outstanding delivery', async () => {
    const result = await getOutstandingDeliveries()
    expect(result[0].deliveryId).toBe(mockDelivery1.deliveryId)
  })

  test('does not return delivery without reference', async () => {
    await db.delivery.update({ reference: null }, { where: { deliveryId: mockDelivery1.deliveryId } })
    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(0)
  })
})
