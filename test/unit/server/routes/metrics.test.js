const metricsRoutes = require('../../../../app/server/routes/metrics')

jest.mock('../../../../app/data', () => ({
  sequelize: {
    fn: jest.fn((fnName, col) => `${fnName}(${col})`),
    col: jest.fn((col) => col)
  },
  metric: {
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}))

jest.mock('../../../../app/metrics/metrics-calculator', () => ({
  calculateMetricsForPeriod: jest.fn()
}))

const db = require('../../../../app/data')
const { calculateMetricsForPeriod } = require('../../../../app/metrics/metrics-calculator')

describe('metrics routes', () => {
  let mockRequest
  let mockH
  let mockResponse
  let consoleErrorSpy
  let route

  beforeEach(() => {
    jest.clearAllMocks()

    mockResponse = {
      code: jest.fn().mockReturnThis()
    }

    mockH = {
      response: jest.fn().mockReturnValue(mockResponse)
    }

    mockRequest = {
      query: {}
    }

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    db.metric.findOne.mockResolvedValue({
      maxDate: '2024-06-15'
    })

    db.metric.findAll.mockResolvedValue([])
    calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })

    route = metricsRoutes[0]
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('exports an array', () => {
    expect(Array.isArray(metricsRoutes)).toBe(true)
  })

  test('has one route', () => {
    expect(metricsRoutes).toHaveLength(1)
  })

  describe('GET /metrics route', () => {
    test('has correct method', () => {
      expect(route.method).toBe('GET')
    })

    test('has correct path', () => {
      expect(route.path).toBe('/metrics')
    })

    test('has a handler function', () => {
      expect(typeof route.handler).toBe('function')
    })

    describe('handler', () => {
      describe('period validation', () => {
        test('returns 400 for invalid period', async () => {
          mockRequest.query.period = 'invalid'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Invalid period type',
            message: 'Period must be one of: all, ytd, year, monthInYear, month, week, day'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test.each([
          ['all'], ['ytd'], ['year'], ['monthInYear'], ['month'], ['week'], ['day']
        ])('accepts valid period: %s', async (period) => {
          mockRequest.query.period = period
          db.metric.findAll.mockResolvedValue([])

          if (period === 'year') {
            mockRequest.query.schemeYear = '2024'
          }
          if (period === 'monthInYear') {
            mockRequest.query.schemeYear = '2024'
            mockRequest.query.month = '6'
            calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          }
          if (period === 'week' || period === 'day' || period === 'month' || period === 'ytd') {
            calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          }

          await route.handler(mockRequest, mockH)

          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })

        test('defaults to "all" period when not provided', async () => {
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'all'
            },
            raw: true
          })
          expect(db.metric.findAll).toHaveBeenCalledWith({
            where: {
              snapshotDate: '2024-06-15',
              periodType: 'all'
            },
            order: [['schemeName', 'ASC']],
            raw: true
          })
        })
      })

      describe('monthInYear validation', () => {
        beforeEach(() => {
          mockRequest.query.period = 'monthInYear'
        })

        test('returns 400 when schemeYear is missing', async () => {
          mockRequest.query.month = '6'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Missing required parameters',
            message: 'schemeYear and month are required for monthInYear period'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('returns 400 when month is missing', async () => {
          mockRequest.query.schemeYear = '2024'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Missing required parameters',
            message: 'schemeYear and month are required for monthInYear period'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('returns 400 when month is 0', async () => {
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '0'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Invalid month',
            message: 'Month must be between 1 and 12'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('returns 400 when month is less than 1', async () => {
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '-1'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Invalid month',
            message: 'Month must be between 1 and 12'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('returns 400 when month is greater than 12', async () => {
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '13'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Invalid month',
            message: 'Month must be between 1 and 12'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('returns 400 when schemeYear is less than 2000', async () => {
          mockRequest.query.schemeYear = '1999'
          mockRequest.query.month = '6'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Invalid schemeYear',
            message: expect.stringContaining('schemeYear must be between 2000 and')
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('returns 400 when schemeYear is more than 10 years in future', async () => {
          mockRequest.query.schemeYear = '2040'
          mockRequest.query.month = '6'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Invalid schemeYear',
            message: expect.stringContaining('schemeYear must be between 2000 and')
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('calls calculateMetricsForPeriod with correct parameters', async () => {
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '6'
          calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(calculateMetricsForPeriod).toHaveBeenCalledWith('monthInYear', 2024, 6)
        })

        test('returns 500 when calculateMetricsForPeriod throws error', async () => {
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '6'
          const error = new Error('Calculation failed')
          calculateMetricsForPeriod.mockRejectedValue(error)

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Metrics calculation failed',
            message: 'Calculation failed'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(500)
        })

        test('accepts valid month boundaries', async () => {
          const testCases = ['1', '6', '12']

          for (const month of testCases) {
            mockRequest.query.schemeYear = '2024'
            mockRequest.query.month = month
            calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
            db.metric.findAll.mockResolvedValue([])

            await route.handler(mockRequest, mockH)

            expect(mockResponse.code).toHaveBeenCalledWith(200)
            jest.clearAllMocks()
            mockResponse.code.mockReturnThis()
          }
        })
      })

      describe('year validation', () => {
        test('returns 400 when period is year and schemeYear is missing', async () => {
          mockRequest.query.period = 'year'

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Missing required parameter',
            message: 'schemeYear is required for year period'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(400)
        })

        test('accepts year period with valid schemeYear', async () => {
          mockRequest.query.period = 'year'
          mockRequest.query.schemeYear = '2024'
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })
      })

      describe('relative period calculations', () => {
        test.each([
          ['week'], ['day'], ['month'], ['ytd']
        ])('calls calculateMetricsForPeriod for %s period', async (period) => {
          mockRequest.query.period = period
          calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(calculateMetricsForPeriod).toHaveBeenCalledWith(period)
          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })

        test.each([
          ['week'], ['day'], ['month'], ['ytd']
        ])('returns 500 when calculateMetricsForPeriod fails for %s', async (period) => {
          mockRequest.query.period = period
          const error = new Error('Calculation error')
          calculateMetricsForPeriod.mockRejectedValue(error)

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Metrics calculation failed',
            message: 'Calculation error'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(500)
        })

        test.each([
          ['week'], ['day'], ['month'], ['ytd']
        ])('ignores schemeYear and month for %s period', async (period) => {
          mockRequest.query.period = period
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '6'
          calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: period
            },
            raw: true
          })
        })
      })

      describe('successful metrics fetch', () => {
        beforeEach(() => {
          mockRequest.query.period = 'all'
        })

        test('fetches metrics with correct where clause for default period', async () => {
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'all'
            },
            raw: true
          })
          expect(db.metric.findAll).toHaveBeenCalledWith({
            where: {
              snapshotDate: '2024-06-15',
              periodType: 'all'
            },
            order: [['schemeName', 'ASC']],
            raw: true
          })
        })

        test('includes schemeYear in where clause when provided', async () => {
          mockRequest.query.schemeYear = '2024'
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'all',
              schemeYear: 2024
            },
            raw: true
          })
          expect(db.metric.findAll).toHaveBeenCalledWith({
            where: {
              snapshotDate: '2024-06-15',
              periodType: 'all',
              schemeYear: 2024
            },
            order: [['schemeName', 'ASC']],
            raw: true
          })
        })

        test('includes month in where clause for monthInYear', async () => {
          mockRequest.query.period = 'monthInYear'
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '6'
          calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'monthInYear',
              schemeYear: 2024,
              monthInYear: 6
            },
            raw: true
          })
          expect(db.metric.findAll).toHaveBeenCalledWith({
            where: {
              snapshotDate: '2024-06-15',
              periodType: 'monthInYear',
              schemeYear: 2024,
              monthInYear: 6
            },
            order: [['schemeName', 'ASC']],
            raw: true
          })
        })

        test('returns empty response when no snapshot found', async () => {
          db.metric.findOne.mockResolvedValue({ maxDate: null })

          await route.handler(mockRequest, mockH)

          expect(db.metric.findAll).not.toHaveBeenCalled()
          expect(mockH.response).toHaveBeenCalledWith({
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            totalFailures: 0,
            statementsByScheme: []
          })
        })

        test('returns formatted response with metrics data', async () => {
          db.metric.findAll.mockResolvedValue([
            {
              schemeName: 'SFI',
              schemeYear: '2024',
              totalStatements: 100,
              printPostCount: 50,
              printPostCost: '3850',
              printPostUnitCost: 77,
              emailCount: 50,
              failureCount: 0
            },
            {
              schemeName: 'DP',
              schemeYear: '2024',
              totalStatements: 200,
              printPostCount: 100,
              printPostCost: '7700',
              printPostUnitCost: 77,
              emailCount: 100,
              failureCount: 10
            }
          ])

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            totalStatements: 300,
            totalPrintPost: 150,
            totalPrintPostCost: 11550,
            totalEmail: 150,
            totalFailures: 10,
            statementsByScheme: [
              {
                schemeName: 'SFI',
                schemeYear: '2024',
                totalStatements: 100,
                printPostCount: 50,
                printPostCost: '3850',
                printPostUnitCost: 77,
                emailCount: 50,
                failureCount: 0
              },
              {
                schemeName: 'DP',
                schemeYear: '2024',
                totalStatements: 200,
                printPostCount: 100,
                printPostCost: '7700',
                printPostUnitCost: 77,
                emailCount: 100,
                failureCount: 10
              }
            ]
          })
          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })

        test('filters out null schemeName entries', async () => {
          db.metric.findAll.mockResolvedValue([
            {
              schemeName: 'SFI',
              schemeYear: '2024',
              totalStatements: 100,
              printPostCount: 50,
              printPostCost: '3850',
              printPostUnitCost: 77,
              emailCount: 50,
              failureCount: 0
            },
            {
              schemeName: null,
              schemeYear: '2024',
              totalStatements: 50,
              printPostCount: 25,
              printPostCost: '1925',
              printPostUnitCost: 77,
              emailCount: 25,
              failureCount: 0
            }
          ])

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            totalStatements: 100,
            totalPrintPost: 50,
            totalPrintPostCost: 3850,
            totalEmail: 50,
            totalFailures: 0,
            statementsByScheme: [{
              schemeName: 'SFI',
              schemeYear: '2024',
              totalStatements: 100,
              printPostCount: 50,
              printPostCost: '3850',
              printPostUnitCost: 77,
              emailCount: 50,
              failureCount: 0
            }]
          })
        })

        test('handles empty metrics array', async () => {
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            totalStatements: 0,
            totalPrintPost: 0,
            totalPrintPostCost: 0,
            totalEmail: 0,
            totalFailures: 0,
            statementsByScheme: []
          })
          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })
      })

      describe('error handling', () => {
        test('handles database errors during findOne', async () => {
          const error = new Error('Database error')
          db.metric.findOne.mockRejectedValue(error)

          await route.handler(mockRequest, mockH)

          expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching metrics:', error)
          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Internal server error',
            message: 'An error occurred while fetching metrics'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(500)
        })

        test('handles database errors during findAll', async () => {
          const error = new Error('Query failed')
          db.metric.findAll.mockRejectedValue(error)

          await route.handler(mockRequest, mockH)

          expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching metrics:', error)
          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Internal server error',
            message: 'An error occurred while fetching metrics'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(500)
        })

        test('handles errors during metrics processing', async () => {
          db.metric.findAll.mockImplementation(() => {
            throw new Error('Processing failed')
          })

          await route.handler(mockRequest, mockH)

          expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching metrics:', expect.any(Error))
          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Internal server error',
            message: 'An error occurred while fetching metrics'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(500)
        })
      })

      describe('query parameter parsing', () => {
        test('parses schemeYear as integer', async () => {
          mockRequest.query.period = 'year'
          mockRequest.query.schemeYear = '2023'
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'year',
              schemeYear: 2023
            },
            raw: true
          })
        })

        test('parses month as integer', async () => {
          mockRequest.query.period = 'monthInYear'
          mockRequest.query.schemeYear = '2024'
          mockRequest.query.month = '6'
          calculateMetricsForPeriod.mockResolvedValue({ inserted: 0, updated: 0 })
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'monthInYear',
              schemeYear: 2024,
              monthInYear: 6
            },
            raw: true
          })
        })

        test('handles null schemeYear correctly', async () => {
          mockRequest.query.period = 'all'
          mockRequest.query.schemeYear = null
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'all'
            },
            raw: true
          })
        })

        test('handles falsy schemeYear string', async () => {
          mockRequest.query.period = 'all'
          mockRequest.query.schemeYear = ''
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findOne).toHaveBeenCalledWith({
            attributes: [['MAX(snapshot_date)', 'maxDate']],
            where: {
              periodType: 'all'
            },
            raw: true
          })
        })
      })

      describe('totals calculation', () => {
        test('calculates totals correctly', async () => {
          db.metric.findAll.mockResolvedValue([
            {
              schemeName: 'A',
              schemeYear: '2024',
              totalStatements: 50,
              printPostCount: 25,
              printPostCost: '1925',
              printPostUnitCost: 77,
              emailCount: 25,
              failureCount: 2
            },
            {
              schemeName: 'B',
              schemeYear: '2024',
              totalStatements: 150,
              printPostCount: 75,
              printPostCost: '5775',
              printPostUnitCost: 77,
              emailCount: 75,
              failureCount: 8
            }
          ])

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith(
            expect.objectContaining({
              totalStatements: 200,
              totalPrintPost: 100,
              totalPrintPostCost: 7700,
              totalEmail: 100,
              totalFailures: 10
            })
          )
        })

        test('handles zero values in totals', async () => {
          db.metric.findAll.mockResolvedValue([
            {
              schemeName: 'A',
              schemeYear: '2024',
              totalStatements: 0,
              printPostCount: 0,
              printPostCost: '0',
              printPostUnitCost: 77,
              emailCount: 0,
              failureCount: 0
            }
          ])

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith(
            expect.objectContaining({
              totalStatements: 0,
              totalPrintPost: 0,
              totalPrintPostCost: 0,
              totalEmail: 0,
              totalFailures: 0
            })
          )
        })
      })
    })
  })
})
