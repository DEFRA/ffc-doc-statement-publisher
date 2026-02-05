const db = require('../../../app/data')
const completeReport = require('../../../app/reporting/complete-report')
const { mockReport1, mockReport2 } = require('../../mocks/report')

describe('completeReport', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.report.bulkCreate([mockReport1, mockReport2])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  test('marks the report as sent', async () => {
    const transaction = await db.sequelize.transaction()
    const lastDeliveryId = 1234
    await completeReport(mockReport1.reportId, lastDeliveryId, transaction)
    const updatedReport = await db.report.findByPk(mockReport1.reportId)
    expect(updatedReport.sent).toEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })
})
