const createReport = require('../../../app/reporting/create-report')
const db = require('../../../app/data')

jest.mock('../../../app/data')

describe('createReport', () => {
  test('should create a report with the given parameters', async () => {
    const schemeName = 'Test Scheme'
    const lastDeliveryId = 123
    const reportStartDate = new Date('2024-12-01')
    const reportEndDate = new Date('2024-12-31')
    const requested = new Date('2024-12-12')
    const transaction = {}

    const mockReport = {
      lastDeliveryId,
      schemeName,
      reportStartDate,
      reportEndDate,
      requested
    }

    // Mock the create method
    db.report.create.mockResolvedValue(mockReport)

    const result = await createReport(schemeName, lastDeliveryId, reportStartDate, reportEndDate, requested, transaction)

    expect(db.report.create).toHaveBeenCalledWith(
      {
        lastDeliveryId,
        schemeName,
        reportStartDate,
        reportEndDate,
        requested
      },
      { transaction }
    )

    expect(result).toEqual(mockReport)
  })
})
