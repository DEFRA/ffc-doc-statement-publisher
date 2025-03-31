const db = require('../../../app/data')
const createReport = require('../../../app/reporting/create-report')
const { mockReport1 } = require('../../mocks/report')

describe('createReport', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('creates a new report', async () => {
    const transaction = await db.sequelize.transaction()
    const result = await createReport(
      mockReport1.schemeName,
      mockReport1.lastDeliveryId,
      mockReport1.reportStartDate,
      mockReport1.reportEndDate,
      new Date(),
      transaction
    )

    await transaction.commit()

    expect(result).toMatchObject({
      schemeName: mockReport1.schemeName,
      lastDeliveryId: mockReport1.lastDeliveryId,
      reportStartDate: mockReport1.reportStartDate,
      reportEndDate: mockReport1.reportEndDate,
      requested: new Date(2022, 7, 5, 15, 30, 10, 120),
      sent: null
    })
  })
})
