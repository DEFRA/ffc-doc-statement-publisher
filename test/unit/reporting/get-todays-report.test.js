const getTodaysReport = require('../../../app/reporting/get-todays-report')
const db = require('../../../app/data')

jest.mock('../../../app/data')

describe('getTodaysReport', () => {
  test('should fetch reports for the given scheme name and today\'s date', async () => {
    const schemeName = 'Test Scheme'
    const today = new Date('2024-12-13T00:00:00Z')
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    const mockReports = [
      { reportId: 1, schemeName: 'Test Scheme', sentDate: new Date('2024-12-13T10:00:00Z') },
      { reportId: 2, schemeName: 'Test Scheme', sentDate: new Date('2024-12-13T15:00:00Z') }
    ]

    db.reports.findAll.mockResolvedValue(mockReports)

    const result = await getTodaysReport(schemeName)

    expect(db.reports.findAll).toHaveBeenCalledWith({
      where: {
        schemeName,
        sentDate: {
          [db.Sequelize.Op.gte]: startOfDay,
          [db.Sequelize.Op.lt]: endOfDay
        }
      }
    })

    expect(result).toEqual(mockReports)
  })
})
