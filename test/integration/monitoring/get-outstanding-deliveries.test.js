const db = require('../../../app/database')
const { truncate } = require('../../helpers/truncate')
const { getOutstandingDeliveries } = require('../../../app/monitoring/get-outstanding-deliveries')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')

describe('getOutstandingDeliveries', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    const testDate = new Date(2022, 7, 5, 15, 30, 10, 120)
    jest.useFakeTimers().setSystemTime(testDate)

    await truncate()
    await db.statement().insert([mockStatement1, mockStatement2])
  })

  afterEach(async () => {
    await truncate()
  })

  afterAll(async () => {
    await db.close()
  })

  test('returns correct number of outstanding deliveries', async () => {
    await db.delivery().insert(mockDelivery1)

    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(1)
  })

  test('returns correct outstanding delivery', async () => {
    await db.delivery().insert(mockDelivery1)

    const result = await getOutstandingDeliveries()
    expect(result[0].deliveryId).toBe(mockDelivery1.deliveryId)
  })

  test('does not return delivery without reference', async () => {
    await db.delivery().insert(mockDelivery1)

    await db.delivery().where({ deliveryId: mockDelivery1.deliveryId }).update({ reference: null })

    const result = await getOutstandingDeliveries()
    expect(result.length).toBe(0)
  })

  test('includes statement data when requested', async () => {
    await db.delivery().insert(mockDelivery1)

    const result = await getOutstandingDeliveries({ includeStatement: true })
    expect(result[0].statement).toBeDefined()
    expect(result[0].statement.statementId).toBe(mockDelivery1.statementId)
  })

  test('respects limit parameter', async () => {
    const deliveries = [
      { ...mockDelivery1 },
      { ...mockDelivery2, completed: null }
    ]

    await db.delivery().insert(deliveries)

    const allResults = await getOutstandingDeliveries()
    expect(allResults.length).toBe(2)

    const limitedResults = await getOutstandingDeliveries({ limit: 1 })
    expect(limitedResults.length).toBe(1)
  })
})
