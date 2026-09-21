const db = require('../../../app/data')
const { truncate } = require('../../helpers/truncate')
const completeDelivery = require('../../../app/monitoring/complete-delivery')
const { mockDelivery1 } = require('../../mocks/delivery')
const { mockStatement1 } = require('../../mocks/statement')

describe('complete delivery', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await truncate()
    await db.statement().insert([mockStatement1])
    await db.delivery().insert([mockDelivery1])
  })

  afterAll(async () => {
    await truncate()
    await db.close()
  })

  test('sets delivery complete', async () => {
    await completeDelivery(mockDelivery1.deliveryId)
    const delivery = await db.delivery().where({ deliveryId: mockDelivery1.deliveryId }).first()
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })
})
