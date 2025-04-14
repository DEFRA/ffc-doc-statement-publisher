const db = require('../../../app/data')
const { getOutstandingDeliveries } = require('../../../app/monitoring/get-outstanding-deliveries')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')

describe('get outstanding deliveries', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    const testDate = new Date(2022, 7, 5, 15, 30, 10, 120)
    jest.useFakeTimers().setSystemTime(testDate)

    await db.sequelize.truncate({ cascade: true })

    await db.statement.bulkCreate([mockStatement1, mockStatement2])
  })

  afterEach(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  test('returns correct number of outstanding deliveries', async () => {
    await db.delivery.create(mockDelivery1)

    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(1)
  })

  test('returns correct outstanding delivery', async () => {
    await db.delivery.create(mockDelivery1)

    const result = await getOutstandingDeliveries()
    expect(result[0].deliveryId).toBe(mockDelivery1.deliveryId)
  })

  test('does not return delivery without reference', async () => {
    await db.delivery.create(mockDelivery1)

    await db.delivery.update(
      { reference: null },
      { where: { deliveryId: mockDelivery1.deliveryId } }
    )

    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(0)
  })

  test('includes statement data when requested', async () => {
    await db.delivery.create(mockDelivery1)

    const result = await getOutstandingDeliveries({ includeStatement: true })
    expect(result[0].statement).toBeDefined()
    expect(result[0].statement.statementId).toBe(mockDelivery1.statementId)
  })

  test('respects limit parameter', async () => {
    const outstandingDelivery1 = { ...mockDelivery1 }
    const outstandingDelivery2 = {
      ...mockDelivery2,
      completed: null
    }

    await db.delivery.bulkCreate([outstandingDelivery1, outstandingDelivery2])

    const allResults = await getOutstandingDeliveries()
    expect(allResults.length).toBe(2)

    const limitedResults = await getOutstandingDeliveries({ limit: 1 })
    expect(limitedResults.length).toBe(1)
  })
})
