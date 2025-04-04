jest.mock('../../../app/data', () => ({
  report: {
    findAll: jest.fn()
  },
  Op: {
    gte: Symbol('gte'),
    lt: Symbol('lt'),
    between: Symbol('between'),
    ne: Symbol('ne')
  }
}))

const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')

describe('getTodaysReport', () => {
  test('should fetch reports for the given scheme name and today\'s date', async () => {
    const schemeName = 'Test Scheme'
    const today = new Date()
    const startOfDay = new Date(today.getTime())
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today.getTime())
    endOfDay.setHours(23, 59, 59, 999)

    const report1SentDate = new Date()
    report1SentDate.setHours(10, 0, 0, 0)
    const report2SentDate = new Date()
    report2SentDate.setHours(15, 0, 0, 0)

    const mockReports = [
      { reportId: 1, schemeName: 'Test Scheme', sentDate: report1SentDate },
      { reportId: 2, schemeName: 'Test Scheme', sentDate: report2SentDate }
    ]

    db.report.findAll.mockResolvedValue(mockReports)

    const result = await getTodaysReport(schemeName)

    expect(db.report.findAll).toHaveBeenCalledWith({
      where: {
        schemeName,
        [db.Op.or]: [
          {
            sent: {
              [db.Op.between]: [startOfDay, endOfDay]
            }
          },
          {
            sent: {
              [db.Op.eq]: null
            }
          }
        ]
      }
    })

    expect(result).toEqual(mockReports)
  })
})
