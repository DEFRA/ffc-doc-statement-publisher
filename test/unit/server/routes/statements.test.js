const HTTP_INTERNAL_SERVER_ERROR = require('../../../../app/constants/statuses').HTTP_INTERNAL_SERVER_ERROR

jest.mock('../../../../app/data', () => ({
  statement: {},
  sequelize: { Op: { like: Symbol('like'), between: Symbol('between') } }
}))

const statementsModule = require('../../../../app/server/routes/statements')

describe('statements route', () => {
  let consoleInfoSpy
  let consoleErrorSpy

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
    jest.useRealTimers()
    consoleInfoSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('module exports', () => {
    test('should export a GET route for /statements', () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      expect(Array.isArray(routes)).toBe(true)
      expect(routes).toHaveLength(2)
      expect(routes[0].method).toBe('POST')
      expect(routes[0].path).toBe('/requests')
      expect(typeof routes[0].handler).toBe('function')
      expect(routes[1].method).toBe('GET')
      expect(routes[1].path).toBe('/statements')
      expect(typeof routes[1].handler).toBe('function')
    })

    describe('POST /requests route', () => {
      let handler
      let mockCreate

      beforeEach(() => {
        mockCreate = jest.fn().mockResolvedValue({ id: 123 })

        jest.doMock('../../../../app/data', () => ({
          requests: { create: mockCreate }
        }))

        const routesModule = require('../../../../app/server/routes/statements')
        handler = routesModule.routes.find(r => r.path === '/requests').handler
      })

      test('should return 201 and success true when log entry is created', async () => {
        const request = {
          payload: {
            username: 'bob',
            filename: 'file.txt',
            type: 'UPLOAD',
            timestamp: '2024-01-01T00:00:00Z'
          }
        }

        const h = {
          response: (obj) => ({
            code: (status) => ({ status, obj })
          })
        }

        const result = await handler(request, h)

        expect(mockCreate).toHaveBeenCalledWith({
          username: 'bob',
          filename: 'file.txt',
          type: 'UPLOAD',
          timestamp: '2024-01-01T00:00:00Z'
        })

        expect(result.status).toBe(201)
        expect(result.obj).toEqual({ success: true, id: 123 })
      })

      test('should return 500 when db create throws', async () => {
        const error = new Error('DB failed')
        mockCreate.mockRejectedValue(error)

        const request = {
          payload: {
            username: 'bob',
            filename: 'file.txt',
            type: 'UPLOAD',
            timestamp: '2024-01-01T00:00:00Z'
          }
        }

        const h = {
          response: (obj) => ({
            code: (status) => ({ status, obj })
          })
        }

        const result = await handler(request, h)

        expect(result.status).toBe(HTTP_INTERNAL_SERVER_ERROR)
        expect(result.obj).toEqual({
          error: 'Internal server error',
          message: 'Failed to write requests log'
        })
      })
    })

    test('should export helper functions for testing', () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      expect(typeof statementsModule.buildQueryCriteria).toBe('function')
      expect(typeof statementsModule.getOffset).toBe('function')
      expect(typeof statementsModule.formatStatementTimestamp).toBe('function')
      expect(typeof statementsModule.formatStatement).toBe('function')
      expect(typeof statementsModule.parseTimestampToRange).toBe('function')
    })
  })

  describe('buildQueryCriteria', () => {
    let buildQueryCriteria

    beforeEach(() => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))
      buildQueryCriteria = statementsModule.buildQueryCriteria
    })

    test('should build empty criteria when no query provided', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({}, db)
      expect(result).toEqual({})
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] buildQueryCriteria called with:', {})
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Final criteria:', {})
    })

    test('should parse FRN as integer', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ frn: '1234567890' }, db)
      expect(result.frn).toBe(1234567890)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Parsed FRN:', {
        input: '1234567890',
        output: 1234567890
      })
    })

    test('should set schemeShortName', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ schemeshortname: 'SFI' }, db)
      expect(result.schemeShortName).toBe('SFI')
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Set schemeShortName:', 'SFI')
    })

    test('should set schemeYear as string', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ schemeyear: '2023' }, db)
      expect(result.schemeYear).toBe('2023')
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Set schemeYear (keeping as string):', '2023')
    })

    test('should set filename', () => {
      const db = require('../../../../app/data')
      const filename = 'FFC_PaymentDelinkedStatement_DP_2024_1234000541_2026061108582129.pdf'
      const result = buildQueryCriteria({ filename }, db)
      expect(result.filename).toBe(filename)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Set filename:', filename)
    })
    test('should add received between criteria for 16-digit timestamp', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ timestamp: '2026020510450842' }, db)
      expect(result.received).toEqual({
        [db.sequelize.Op.between]: [
          new Date('2026-02-05T10:45:08.000Z'),
          new Date('2026-02-05T10:45:08.999Z')
        ]
      })
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Adding timestamp range criteria to query on received:', expect.any(Object))
    })

    test('should add received between criteria for DD-MM-YYYY HH:MM timestamp', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ timestamp: '04-06-2026 11:45' }, db)
      expect(result.received).toEqual({
        [db.sequelize.Op.between]: [
          new Date('2026-06-04T11:40:00.000Z'),
          new Date('2026-06-04T11:50:00.999Z')
        ]
      })
    })

    test('should add received between criteria for DD-MM-YYYY date-only timestamp', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ timestamp: '04-06-2026' }, db)
      expect(result.received).toEqual({
        [db.sequelize.Op.between]: [
          new Date('2026-06-04T00:00:00.000Z'),
          new Date('2026-06-04T23:59:59.999Z')
        ]
      })
    })

    test('should skip timestamp filter for unrecognised format', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ timestamp: 'not-a-date' }, db)
      expect(result.received).toBeUndefined()
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Timestamp format not recognised, skipping filter:', 'not-a-date')
    })

    test('should build complete criteria with all filters', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({
        frn: '1234567890',
        schemeshortname: 'SFI',
        schemeyear: '2023',
        timestamp: '2026020510450842'
      }, db)

      expect(result.frn).toBe(1234567890)
      expect(result.schemeShortName).toBe('SFI')
      expect(result.schemeYear).toBe('2023')
      expect(result.received).toEqual({ [db.sequelize.Op.between]: expect.any(Array) })
    })

    test('should log final criteria', () => {
      const db = require('../../../../app/data')
      buildQueryCriteria({ frn: '123' }, db)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Final criteria:', expect.any(Object))
    })
  })

  describe('getOffset', () => {
    let getOffset

    beforeEach(() => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))
      getOffset = statementsModule.getOffset
    })

    test('should use continuationToken when valid', () => {
      const result = getOffset('100', '50')
      expect(result).toBe(100)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Using continuationToken as offset:', 100)
    })

    test('should use offset when continuationToken is invalid', () => {
      const result = getOffset('invalid', '75')
      expect(result).toBe(75)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Using offset parameter:', 75)
    })

    test('should use offset when continuationToken is null', () => {
      const result = getOffset(null, '50')
      expect(result).toBe(50)
    })

    test('should return 0 when neither continuationToken nor offset provided', () => {
      const result = getOffset(null, null)
      expect(result).toBe(0)
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[STATEMENTS] No valid offset or continuationToken, using default: 0'
      )
    })

    test('should return 0 when both are invalid', () => {
      const result = getOffset('abc', 'def')
      expect(result).toBe(0)
    })

    test('should prioritize continuationToken over offset', () => {
      const result = getOffset('100', '50')
      expect(result).toBe(100)
    })

    test('should handle string number continuationToken', () => {
      const result = getOffset('200', '25')
      expect(result).toBe(200)
    })

    test('should handle numeric continuationToken', () => {
      const result = getOffset(300, '25')
      expect(result).toBe(300)
    })
  })

  describe('formatStatementTimestamp', () => {
    let formatStatementTimestamp

    beforeEach(() => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))
      formatStatementTimestamp = statementsModule.formatStatementTimestamp
    })

    test('should format Date to 16-digit timestamp', () => {
      const date = new Date('2026-02-15T10:09:23.450Z')
      const result = formatStatementTimestamp(date)
      expect(result).toBe('2026021510092345')
    })

    test('should handle dates with leading zeros', () => {
      const date = new Date('2026-01-01T00:00:00.000Z')
      const result = formatStatementTimestamp(date)
      expect(result).toBe('2026010100000000')
    })

    test('should round milliseconds to centiseconds correctly', () => {
      const date = new Date('2026-02-15T10:09:23.567Z')
      const result = formatStatementTimestamp(date)
      expect(result).toBe('2026021510092356')
    })

    test('should handle high millisecond values', () => {
      const date = new Date('2026-02-15T10:09:23.999Z')
      const result = formatStatementTimestamp(date)
      expect(result).toBe('2026021510092399')
    })

    test('should handle low millisecond values', () => {
      const date = new Date('2026-02-15T10:09:23.001Z')
      const result = formatStatementTimestamp(date)
      expect(result).toBe('2026021510092300')
    })
  })

  describe('formatStatement', () => {
    let formatStatement

    beforeEach(() => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))
      formatStatement = statementsModule.formatStatement
    })

    test('should format statement with all fields', () => {
      const statement = {
        filename: 'FFC_Statement.pdf',
        schemeId: '123',
        marketingYear: '2023',
        frn: '987654321',
        received: '2026-02-15T10:09:23.450Z'
      }
      const result = formatStatement(statement)

      expect(result).toEqual({
        filename: 'FFC_Statement.pdf',
        schemeId: 123,
        marketingYear: 2023,
        frn: 987654321,
        timestamp: '2026021510092345'
      })
    })

    test('should handle null values', () => {
      const statement = {
        filename: null,
        schemeId: null,
        marketingYear: null,
        frn: null,
        received: '2026-02-15T10:09:23.450Z'
      }
      const result = formatStatement(statement)

      expect(result).toEqual({
        filename: null,
        schemeId: null,
        marketingYear: null,
        frn: null,
        timestamp: '2026021510092345'
      })
    })

    test('should parse numeric strings correctly', () => {
      const statement = {
        filename: 'file.pdf',
        schemeId: '999',
        marketingYear: '2025',
        frn: '111111111',
        received: '2026-01-01T00:00:00.000Z'
      }
      const result = formatStatement(statement)

      expect(typeof result.schemeId).toBe('number')
      expect(typeof result.marketingYear).toBe('number')
      expect(typeof result.frn).toBe('number')
    })

    test('should handle undefined fields', () => {
      const statement = {
        filename: undefined,
        schemeId: undefined,
        marketingYear: undefined,
        frn: undefined,
        received: '2026-02-15T10:09:23.450Z'
      }
      const result = formatStatement(statement)

      expect(result.filename).toBeNull()
      expect(result.schemeId).toBeNull()
      expect(result.marketingYear).toBeNull()
      expect(result.frn).toBeNull()
    })
  })

  describe('handler', () => {
    test('returns payload with parsed values', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({
            count: 1,
            rows: [{
              filename: 'file.csv',
              schemeId: '1',
              marketingYear: '2023',
              frn: '123',
              received: '2020-01-01T00:00:00.000Z'
            }]
          })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      const result = await handler({ query: {} })

      expect(result).toEqual({
        statements: [{
          filename: 'file.csv',
          schemeId: 1,
          marketingYear: 2023,
          frn: 123,
          timestamp: '2020010100000000'
        }],
        continuationToken: null,
        total: 1,
        totalPages: 1
      })
    })

    test('returns payload with null values when properties are missing', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({
            count: 1,
            rows: [{
              filename: null,
              schemeId: null,
              marketingYear: null,
              frn: null,
              received: '2020-01-01T00:00:00.000Z'
            }]
          })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      const result = await handler({ query: {} })

      expect(result).toEqual({
        statements: [{
          filename: null,
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: '2020010100000000'
        }],
        continuationToken: null,
        total: 1,
        totalPages: 1
      })
    })

    test('applies query filters correctly', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { frn: '123', schemeshortname: 'SFI', schemeyear: '2023', filename: 'my-file.pdf', timestamp: '2026020510450842' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: {
          frn: 123,
          schemeShortName: 'SFI',
          schemeYear: '2023',
          filename: 'my-file.pdf',
          received: expect.any(Object)
        },
        limit: 100,
        offset: 0
      })
    })

    test('uses exact minute results when timestamp includes time and exact matches exist', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({
        count: 1,
        rows: [{
          filename: 'file.pdf',
          schemeId: '1',
          marketingYear: '2023',
          frn: '123',
          received: '2026-06-04T11:45:20.000Z'
        }]
      })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { timestamp: '04-06-2026 11:45' } })

      expect(mockFindAll).toHaveBeenCalledTimes(1)
      const where = mockFindAll.mock.calls[0][0].where
      const receivedOpSymbol = Object.getOwnPropertySymbols(where.received)[0]
      expect(where.received[receivedOpSymbol]).toEqual([
        new Date('2026-06-04T11:45:00.000Z'),
        new Date('2026-06-04T11:45:59.999Z')
      ])
    })

    test('falls back to widened window when exact minute has no matches', async () => {
      const mockFindAll = jest.fn()
        .mockResolvedValueOnce({ count: 0, rows: [] })
        .mockResolvedValueOnce({
          count: 1,
          rows: [{
            filename: 'file.pdf',
            schemeId: '1',
            marketingYear: '2023',
            frn: '123',
            received: '2026-06-04T11:46:00.000Z'
          }]
        })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { timestamp: '04-06-2026 11:45' } })

      expect(mockFindAll).toHaveBeenCalledTimes(2)

      const exactWhere = mockFindAll.mock.calls[0][0].where
      const exactReceivedOpSymbol = Object.getOwnPropertySymbols(exactWhere.received)[0]
      expect(exactWhere.received[exactReceivedOpSymbol]).toEqual([
        new Date('2026-06-04T11:45:00.000Z'),
        new Date('2026-06-04T11:45:59.999Z')
      ])

      const fallbackWhere = mockFindAll.mock.calls[1][0].where
      const fallbackReceivedOpSymbol = Object.getOwnPropertySymbols(fallbackWhere.received)[0]
      expect(fallbackWhere.received[fallbackReceivedOpSymbol]).toEqual([
        new Date('2026-06-04T11:40:00.000Z'),
        new Date('2026-06-04T11:50:00.999Z')
      ])
    })

    test('uses offset parameter when provided', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { offset: '10' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 100,
        offset: 10
      })
    })

    test('prioritizes continuationToken over offset', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { continuationToken: '20', offset: '10' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 100,
        offset: 20
      })
    })

    test('uses custom limit when provided', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { limit: '25' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 25,
        offset: 0
      })
    })

    test('returns continuation token when more results available', async () => {
      const mockResults = new Array(100).fill({
        filename: 'file.pdf',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2020-01-01T00:00:00.000Z'
      })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({ count: 150, rows: mockResults })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      const result = await handler({ query: {} })

      expect(result.continuationToken).toBe('100')
    })

    test('returns null continuation token when no more results', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({
            count: 1,
            rows: [{
              filename: 'file.pdf',
              schemeId: '1',
              marketingYear: '2023',
              frn: '123',
              received: '2020-01-01T00:00:00.000Z'
            }]
          })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      const result = await handler({ query: {} })

      expect(result.continuationToken).toBeNull()
    })

    test('returns error response when database query fails', async () => {
      const mockResponse = {
        code: jest.fn().mockReturnValue({
          output: {
            statusCode: HTTP_INTERNAL_SERVER_ERROR,
            payload: {
              error: 'Internal server error',
              message: 'An error occurred while fetching statements'
            }
          }
        })
      }
      const h = {
        response: jest.fn().mockReturnValue(mockResponse)
      }

      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockRejectedValue(new Error('DB error'))
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: {} }, h)

      expect(h.response).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An error occurred while fetching statements'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_INTERNAL_SERVER_ERROR)
    })

    test('logs handler invocation with query parameters', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({ count: 0, rows: [] })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { frn: '123' } })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Handler called with query:', { frn: '123' })
    })

    test('logs query execution details', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { limit: '10', offset: '5' } })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Executing query with:', {
        criteria: {},
        limit: 10,
        offset: 5
      })
    })

    test('logs result count', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({ count: 2, rows: [{}, {}] })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: {} })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Query returned', 2, 'results')
    })

    test('logs response details', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: jest.fn().mockResolvedValue({ count: 1, rows: [{}] })
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: {} })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Returning response with:', {
        statementCount: 1,
        total: 1,
        totalPages: 1,
        hasMore: false,
        nextContinuationToken: null
      })
    })

    test('applies combined filters with pagination', async () => {
      const mockFindAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAndCountAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like'),
            between: Symbol('between')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[1].handler

      await handler({ query: { frn: '123', limit: '10', continuationToken: '20' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: { frn: 123 },
        limit: 10,
        offset: 20
      })
    })
  })
})
