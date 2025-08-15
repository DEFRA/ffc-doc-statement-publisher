jest.mock('../../../app/data', () => ({
  report: {
    findAll: jest.fn()
  },
  Op: {
    between: Symbol('between'),
    eq: Symbol('eq'),
    or: Symbol('or'),
    and: Symbol('and')
  }
}))

const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')

describe('getTodaysReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should fetch reports with correct query parameters', async () => {
    const schemeName = 'Test Scheme'
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    await getTodaysReport(schemeName)

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
            [db.Op.and]: [
              {
                sent: {
                  [db.Op.eq]: null
                }
              },
              {
                requested: {
                  [db.Op.between]: [startOfDay, endOfDay]
                }
              }
            ]
          }
        ]
      }
    })
  })

  describe('returns correct results for different scenarios', () => {
    const schemeName = 'Test Scheme'
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const mockReports = [
      {
        reportId: 1,
        schemeName,
        sent: new Date(today.setHours(10, 0, 0, 0)),
        requested: yesterday
      },
      {
        reportId: 2,
        schemeName,
        sent: null,
        requested: new Date(today.setHours(15, 0, 0, 0))
      },
      {
        reportId: 3,
        schemeName,
        sent: null,
        requested: yesterday
      }
    ]

    beforeEach(() => {
      db.report.findAll.mockResolvedValue(mockReports.slice(0, 2))
    })

    test('returns reports sent today and null sent but requested today', async () => {
      const result = await getTodaysReport(schemeName)

      expect(result).toHaveLength(2)
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ reportId: 1 }),
        expect.objectContaining({ reportId: 2 })
      ]))
    })

    test('excludes reports with null sent and requested before today', async () => {
      const result = await getTodaysReport(schemeName)

      expect(result).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reportId: 3 })
        ])
      )
    })
  })

  describe('error handling', () => {
    test('throws error when database query fails', async () => {
      const error = new Error('Database error')
      db.report.findAll.mockRejectedValue(error)

      await expect(getTodaysReport('Test Scheme'))
        .rejects
        .toThrow('Database error')
    })
  })
})
