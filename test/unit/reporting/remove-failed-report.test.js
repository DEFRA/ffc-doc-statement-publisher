const db = require('../../../app/data')
const removeFailedReport = require('../../../app/reporting/remove-failed-report')

jest.mock('../../../app/data', () => ({
  report: {
    destroy: jest.fn()
  }
}))

describe('removeFailedReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should call db.report.destroy with correct reportId when valid reportId given', async () => {
    const reportId = 123
    await removeFailedReport(reportId)

    expect(db.report.destroy).toHaveBeenCalledTimes(1)
    expect(db.report.destroy).toHaveBeenCalledWith({
      where: { reportId: 123 }
    })
  })

  test('should not call db.report.destroy when no reportId provided', async () => {
    await removeFailedReport()

    expect(db.report.destroy).not.toHaveBeenCalled()
  })

  test('should handle errors from db.report.destroy', async () => {
    const reportId = 123
    const error = new Error('Database error')
    db.report.destroy.mockRejectedValue(error)

    await expect(removeFailedReport(reportId)).rejects.toThrow('Database error')
    expect(db.report.destroy).toHaveBeenCalledTimes(1)
  })
})
