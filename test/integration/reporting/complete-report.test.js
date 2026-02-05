const db = require('../../../app/data')
const completeReport = require('../../../app/reporting/complete-report')
const { mockReport1, mockReport2 } = require('../../mocks/report')

describe('completeReport', () => {
  let transaction

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.report.bulkCreate([mockReport1, mockReport2])

    transaction = await db.sequelize.transaction()
  })

  afterEach(async () => {
    if (transaction && !transaction.finished) {
      await transaction.rollback()
    }
    jest.useRealTimers()
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  test('marks the report as sent', async () => {
    const lastDeliveryId = 1234
    await completeReport(mockReport1.reportId, lastDeliveryId, transaction)
    await transaction.commit()

    const updatedReport = await db.report.findByPk(mockReport1.reportId)
    expect(updatedReport).not.toBeNull()
    expect(updatedReport.sent).toEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })
})
