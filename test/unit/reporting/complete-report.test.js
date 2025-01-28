const completeReport = require('../../../app/reporting/complete-report')
const db = require('../../../app/data')

jest.mock('../../../app/data')

describe('completeReport', () => {
  test('should update the report with the current date', async () => {
    const reportId = 1
    const transaction = {}
    const mockDate = new Date('2024-12-12T00:00:00Z')

    // Mock the Date object
    global.Date = jest.fn(() => mockDate)

    // Mock the update method
    db.report.update.mockResolvedValue([1])

    await completeReport(reportId, transaction)

    expect(db.report.update).toHaveBeenCalledWith(
      { sent: mockDate },
      { where: { reportId } },
      { transaction }
    )
  })
})
