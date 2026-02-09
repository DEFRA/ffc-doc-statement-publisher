const HTTP_INTERNAL_SERVER_ERROR = require('../../../../app/constants/statuses').HTTP_INTERNAL_SERVER_ERROR

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
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      expect(Array.isArray(routes)).toBe(true)
      expect(routes).toHaveLength(1)
      expect(routes[0].method).toBe('GET')
      expect(routes[0].path).toBe('/statements')
      expect(typeof routes[0].handler).toBe('function')
    })

    test('should export helper functions for testing', () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      expect(typeof statementsModule.buildQueryCriteria).toBe('function')
      expect(typeof statementsModule.getOffset).toBe('function')
      expect(typeof statementsModule.formatStatementTimestamp).toBe('function')
      expect(typeof statementsModule.formatStatement).toBe('function')
    })
  })

  describe('buildQueryCriteria', () => {
    let buildQueryCriteria

    beforeEach(() => {
      jest.doMock('../../../../app/data', () => ({
        statement: {},
        sequelize: {
          Op: {
            like: Symbol('like')
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

    test('should add filename LIKE criteria for timestamp', () => {
      const db = require('../../../../app/data')
      const result = buildQueryCriteria({ timestamp: '2026020510450842' }, db)
      expect(result.filename).toEqual({ [db.sequelize.Op.like]: '%2026020510450842%' })
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Adding timestamp criteria to query on filename')
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
      expect(result.filename).toEqual({ [db.sequelize.Op.like]: '%2026020510450842%' })
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
            like: Symbol('like')
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
            like: Symbol('like')
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
            like: Symbol('like')
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
          findAll: jest.fn().mockResolvedValue([{
            filename: 'file.csv',
            schemeId: '1',
            marketingYear: '2023',
            frn: '123',
            received: '2020-01-01T00:00:00.000Z'
          }])
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      const result = await handler({ query: {} })

      expect(result).toEqual({
        statements: [{
          filename: 'file.csv',
          schemeId: 1,
          marketingYear: 2023,
          frn: 123,
          timestamp: '2020010100000000'
        }],
        continuationToken: null
      })
    })

    test('returns payload with null values when properties are missing', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: jest.fn().mockResolvedValue([{
            filename: null,
            schemeId: null,
            marketingYear: null,
            frn: null,
            received: '2020-01-01T00:00:00.000Z'
          }])
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      const result = await handler({ query: {} })

      expect(result).toEqual({
        statements: [{
          filename: null,
          schemeId: null,
          marketingYear: null,
          frn: null,
          timestamp: '2020010100000000'
        }],
        continuationToken: null
      })
    })

    test('applies query filters correctly', async () => {
      const mockFindAll = jest.fn().mockResolvedValue([])
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { frn: '123', schemeshortname: 'SFI', schemeyear: '2023', timestamp: '2026020510450842' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: {
          frn: 123,
          schemeShortName: 'SFI',
          schemeYear: '2023',
          filename: expect.any(Object)
        },
        limit: 50,
        offset: 0
      })
    })

    test('uses offset parameter when provided', async () => {
      const mockFindAll = jest.fn().mockResolvedValue([])
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { offset: '10' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 50,
        offset: 10
      })
    })

    test('prioritizes continuationToken over offset', async () => {
      const mockFindAll = jest.fn().mockResolvedValue([])
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { continuationToken: '20', offset: '10' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 50,
        offset: 20
      })
    })

    test('uses custom limit when provided', async () => {
      const mockFindAll = jest.fn().mockResolvedValue([])
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { limit: '25' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: undefined,
        limit: 25,
        offset: 0
      })
    })

    test('returns continuation token when more results available', async () => {
      const mockResults = new Array(50).fill({
        filename: 'file.pdf',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2020-01-01T00:00:00.000Z'
      })
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: jest.fn().mockResolvedValue(mockResults)
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      const result = await handler({ query: {} })

      expect(result.continuationToken).toBe('50')
    })

    test('returns null continuation token when no more results', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: jest.fn().mockResolvedValue([{
            filename: 'file.pdf',
            schemeId: '1',
            marketingYear: '2023',
            frn: '123',
            received: '2020-01-01T00:00:00.000Z'
          }])
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

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
          findAll: jest.fn().mockRejectedValue(new Error('DB error'))
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

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
          findAll: jest.fn().mockResolvedValue([])
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { frn: '123' } })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Handler called with query:', { frn: '123' })
    })

    test('logs query execution details', async () => {
      const mockFindAll = jest.fn().mockResolvedValue([])
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

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
          findAll: jest.fn().mockResolvedValue([{}, {}])
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: {} })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Query returned', 2, 'results')
    })

    test('logs response details', async () => {
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: jest.fn().mockResolvedValue([{}])
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: {} })

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Returning response with:', {
        statementCount: 1,
        hasMore: false,
        nextContinuationToken: null
      })
    })

    test('applies combined filters with pagination', async () => {
      const mockFindAll = jest.fn().mockResolvedValue([])
      jest.doMock('../../../../app/data', () => ({
        statement: {
          findAll: mockFindAll
        },
        sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }))

      const { routes } = require('../../../../app/server/routes/statements')
      const handler = routes[0].handler

      await handler({ query: { frn: '123', limit: '10', continuationToken: '20' } })

      expect(mockFindAll).toHaveBeenCalledWith({
        where: { frn: 123 },
        limit: 10,
        offset: 20
      })
    })
  })
})
