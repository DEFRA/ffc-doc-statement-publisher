const db = require('../../../../app/data')
const { calculateMetricsForPeriod } = require('../../../../app/metrics-calculator')

jest.mock('../../../../app/data', () => ({
  metric: {
    findAll: jest.fn()
  }
}))

jest.mock('../../../../app/metrics-calculator', () => ({
  calculateMetricsForPeriod: jest.fn()
}))

describe('metrics routes', () => {
  let metricsRoutes
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
    metricsRoutes = require('../../../../app/server/routes/metrics')
    jest.useFakeTimers().setSystemTime(new Date('2024-06-15'))
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    jest.useRealTimers()
  })

  test('exports an array', () => {
    expect(Array.isArray(metricsRoutes)).toBe(true)
  })

  test('has one route', () => {
    expect(metricsRoutes).toHaveLength(1)
  })

  describe('GET /metrics route', () => {
    let route

    beforeEach(() => {
      route = metricsRoutes[0]
    })

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
      let mockResponse
      let mockH
      let mockRequest

      beforeEach(() => {
        mockResponse = {
          code: jest.fn().mockReturnThis()
        }
        mockH = {
          response: jest.fn().mockReturnValue(mockResponse)
        }
        mockRequest = {
          query: {}
        }
      })

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
          'all', 'ytd', 'year', 'monthInYear', 'month', 'week', 'day'
        ])('accepts valid period: %s', async (period) => {
          mockRequest.query.period = period
          db.metric.findAll.mockResolvedValue([])

          if (period === 'year') {
            mockRequest.query.schemeYear = '2024'
          } else if (period === 'monthInYear') {
            mockRequest.query.schemeYear = '2024'
            mockRequest.query.month = '6'
          }

          await route.handler(mockRequest, mockH)

          expect(mockResponse.code).toHaveBeenCalledWith(200)
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
            error: 'Missing required parameters',
            message: 'schemeYear and month are required for monthInYear period'
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
          mockRequest.query.schemeYear = '2036'
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
          calculateMetricsForPeriod.mockResolvedValue()
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
      })

      describe('successful metrics fetch', () => {
        beforeEach(() => {
          mockRequest.query.period = 'all'
        })

        test('fetches metrics with correct where clause for default period', async () => {
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findAll).toHaveBeenCalledWith({
            where: {
              snapshotDate: '2024-06-15',
              periodType: 'all'
            },
            order: [['schemeName', 'ASC']]
          })
        })

        test('includes schemeYear in where clause when provided', async () => {
          mockRequest.query.schemeYear = '2024'
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(db.metric.findAll).toHaveBeenCalledWith({
            where: {
              snapshotDate: '2024-06-15',
              periodType: 'all',
              schemeYear: 2024
            },
            order: [['schemeName', 'ASC']]
          })
        })

        test('filters out null schemeName and calculates totals', async () => {
          const mockMetrics = [
            {
              schemeName: 'Scheme A',
              schemeYear: '2024',
              totalStatements: 10,
              printPostCount: 5,
              printPostCost: '100',
              printPostUnitCost: '20',
              emailCount: 5,
              failureCount: 0
            },
            {
              schemeName: 'Scheme B',
              schemeYear: '2024',
              totalStatements: 20,
              printPostCount: 10,
              printPostCost: '200',
              printPostUnitCost: '20',
              emailCount: 10,
              failureCount: 2
            },
            {
              schemeName: null,
              schemeYear: '2024',
              totalStatements: 5,
              printPostCount: 2,
              printPostCost: '50',
              printPostUnitCost: '25',
              emailCount: 3,
              failureCount: 1
            }
          ]
          db.metric.findAll.mockResolvedValue(mockMetrics)

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            payload: {
              totalStatements: 30,
              totalPrintPost: 15,
              totalPrintPostCost: 300,
              totalEmail: 15,
              totalFailures: 2,
              statementsByScheme: [
                {
                  schemeName: 'Scheme A',
                  schemeYear: '2024',
                  totalStatements: 10,
                  printPostCount: 5,
                  printPostCost: '100',
                  printPostUnitCost: '20',
                  emailCount: 5,
                  failureCount: 0
                },
                {
                  schemeName: 'Scheme B',
                  schemeYear: '2024',
                  totalStatements: 20,
                  printPostCount: 10,
                  printPostCost: '200',
                  printPostUnitCost: '20',
                  emailCount: 10,
                  failureCount: 2
                }
              ]
            }
          })
          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })

        test('returns zeros when no metrics found', async () => {
          db.metric.findAll.mockResolvedValue([])

          await route.handler(mockRequest, mockH)

          expect(mockH.response).toHaveBeenCalledWith({
            payload: {
              totalStatements: 0,
              totalPrintPost: 0,
              totalPrintPostCost: 0,
              totalEmail: 0,
              totalFailures: 0,
              statementsByScheme: []
            }
          })
          expect(mockResponse.code).toHaveBeenCalledWith(200)
        })
      })

      describe('error handling', () => {
        test('returns 500 when database query fails', async () => {
          const error = new Error('Database error')
          db.metric.findAll.mockRejectedValue(error)

          await route.handler(mockRequest, mockH)

          expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching metrics:', error)
          expect(mockH.response).toHaveBeenCalledWith({
            error: 'Internal server error',
            message: 'An error occurred while fetching metrics'
          })
          expect(mockResponse.code).toHaveBeenCalledWith(500)
        })
      })
    })
  })
})
