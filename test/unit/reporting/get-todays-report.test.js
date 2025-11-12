jest.mock('../../../app/data', () => ({
  report: { findAll: jest.fn() },
  Op: { between: Symbol('between'), eq: Symbol('eq'), or: Symbol('or'), and: Symbol('and') }
}))

const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')

describe('getTodaysReport', () => {
  const schemeName = 'Test Scheme'
  const mockToday = new Date('2025-11-12T12:00:00Z')

  beforeAll(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockToday)
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('fetches reports with correct query parameters', async () => {
    await getTodaysReport(schemeName)

    const startOfDay = new Date(mockToday)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(mockToday)
    endOfDay.setHours(23, 59, 59, 999)

    expect(db.report.findAll).toHaveBeenCalledWith({
      where: {
        schemeName,
        [db.Op.or]: [
          { sent: { [db.Op.between]: [startOfDay, endOfDay] } },
          {
            [db.Op.and]: [
              { sent: { [db.Op.eq]: null } },
              { requested: { [db.Op.between]: [startOfDay, endOfDay] } }
            ]
          }
        ]
      }
    })
  })

  test('returns reports sent today and requested today, excluding others', async () => {
    const yesterday = new Date(mockToday)
    yesterday.setDate(yesterday.getDate() - 1)

    const mockReports = [
      { reportId: 1, schemeName, sent: new Date(mockToday.setHours(10, 0, 0, 0)), requested: yesterday },
      { reportId: 2, schemeName, sent: null, requested: new Date(mockToday.setHours(15, 0, 0, 0)) },
      { reportId: 3, schemeName, sent: null, requested: yesterday }
    ]

    db.report.findAll.mockResolvedValue(mockReports.slice(0, 2))

    const result = await getTodaysReport(schemeName)

    expect(result).toHaveLength(2)
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ reportId: 1 }),
      expect.objectContaining({ reportId: 2 })
    ]))
    expect(result).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ reportId: 3 })
    ]))
  })

  test('throws error if database query fails', async () => {
    db.report.findAll.mockRejectedValue(new Error('Database error'))
    await expect(getTodaysReport(schemeName)).rejects.toThrow('Database error')
  })
})
