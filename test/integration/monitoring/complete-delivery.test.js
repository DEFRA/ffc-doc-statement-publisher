const db = require('../../../app/data')
const completeDelivery = require('../../../app/monitoring/complete-delivery')
const { mockDelivery1 } = require('../../mocks/delivery')
const { mockStatement1 } = require('../../mocks/statement')

describe('complete delivery', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.statement.bulkCreate([mockStatement1])
    await db.delivery.bulkCreate([mockDelivery1])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('sets delivery complete', async () => {
    await completeDelivery(mockDelivery1.deliveryId)
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })
})
