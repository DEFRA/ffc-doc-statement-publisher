const db = require('../../../app/data')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')

describe('getDeliveriesForReport', () => {
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

  test('returns deliveries within the specified date range and scheme name', async () => {
    const transaction = await db.sequelize.transaction()
    const result = await getDeliveriesForReport(
      mockStatement1.schemeName,
      new Date(2022, 6, 1),
      new Date(2022, 8, 1),
      transaction
    )
    await transaction.commit()

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ deliveryId: mockDelivery1.deliveryId }),
        expect.objectContaining({ deliveryId: mockDelivery2.deliveryId })
      ])
    )
  })

  test('does not return deliveries outside the specified date range', async () => {
    const transaction = await db.sequelize.transaction()
    const result = await getDeliveriesForReport(
      mockStatement1.schemeName,
      new Date(2022, 8, 2),
      new Date(2022, 8, 3),
      transaction
    )
    await transaction.commit()

    expect(result.length).toBe(0)
  })

  test('does not return deliveries for a different scheme name', async () => {
    const transaction = await db.sequelize.transaction()
    const result = await getDeliveriesForReport(
      'DifferentSchemeName',
      new Date(2022, 6, 1),
      new Date(2022, 8, 1),
      transaction
    )
    await transaction.commit()

    expect(result.length).toBe(0)
  })
})
