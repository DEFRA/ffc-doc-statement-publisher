const db = require('../../../app/data')
const { truncate } = require('../../helpers/truncate')
const completeReport = require('../../../app/reporting/complete-report')
const { mockReport1, mockReport2 } = require('../../mocks/report')

describe('completeReport', () => {
  let transaction

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await truncate()
    await db.report().insert([mockReport1, mockReport2])

    transaction = await db.transaction()
  })

  afterEach(async () => {
    if (transaction && !transaction.isCompleted()) {
      await transaction.rollback()
    }
    jest.useRealTimers()
  })

  afterAll(async () => {
    await truncate()
  })

  test('marks the report as sent', async () => {
    const lastDeliveryId = 1234
    await completeReport(mockReport1.reportId, lastDeliveryId, transaction)
    await transaction.commit()

    const updatedReport = await db.report().where({ reportId: mockReport1.reportId }).first()
    expect(updatedReport).not.toBeUndefined()
    expect(updatedReport.sent).toEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })
})
