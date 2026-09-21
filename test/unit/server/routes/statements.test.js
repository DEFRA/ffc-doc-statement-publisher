const HTTP_INTERNAL_SERVER_ERROR = require('../../../../app/constants/statuses').HTTP_INTERNAL_SERVER_ERROR
const { createKnexMock, createQueryBuilder } = require('../../../helpers/mock-knex')

const mockDb = createKnexMock(['statement', 'requests'])

jest.mock('../../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const statementsModule = require('../../../../app/server/routes/statements')
const { routes, buildQueryCriteria, buildReceivedRange, getOffset, formatStatementTimestamp, formatStatement, parseTimestampToRange } = statementsModule

// executeQuery runs a count query then a rows query against the `statement` table,
// both via fresh `statement()` calls. This queues the pair of builders that a single
// GET /statements handler invocation (for one pass, exact-minute or widened) consumes.
const mockStatementQuery = (count, rows) => {
  const countBuilder = createQueryBuilder().resolves({ count })
  const rowsBuilder = createQueryBuilder().resolves(rows)
  mockDb.tables.statement.mockReturnValueOnce(countBuilder).mockReturnValueOnce(rowsBuilder)
  return { countBuilder, rowsBuilder }
}

describe('statements route', () => {
  let consoleInfoSpy

  const createResponseToolkit = () => ({
    response: jest.fn().mockImplementation(obj => ({
      code: jest.fn().mockReturnValue(obj)
    }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('module exports', () => {
    test('should export a GET route for /statements', () => {
      expect(Array.isArray(routes)).toBe(true)
      expect(routes).toHaveLength(2)
      expect(routes[0].method).toBe('POST')
      expect(routes[0].path).toBe('/requests')
      expect(typeof routes[0].handler).toBe('function')
      expect(routes[1].method).toBe('GET')
      expect(routes[1].path).toBe('/statements')
      expect(typeof routes[1].handler).toBe('function')
    })

    test('should export helper functions for testing', () => {
      expect(typeof buildQueryCriteria).toBe('function')
      expect(typeof buildReceivedRange).toBe('function')
      expect(typeof getOffset).toBe('function')
      expect(typeof formatStatementTimestamp).toBe('function')
      expect(typeof formatStatement).toBe('function')
      expect(typeof parseTimestampToRange).toBe('function')
    })
  })

  describe('POST /requests route', () => {
    const handler = routes.find(r => r.path === '/requests').handler

    beforeEach(() => {
      mockDb.builder.resolves([{ id: 123 }])
    })

    test('should return 201 and success true when log entry is created', async () => {
      const request = {
        payload: {
          username: 'bob',
          searchTerms: { filename: 'FFC_Statement.pdf' },
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

      expect(mockDb.tables.requests).toHaveBeenCalledWith()
      expect(mockDb.builder.insert).toHaveBeenCalledWith({
        username: 'bob',
        searchTerms: { filename: 'FFC_Statement.pdf' },
        type: 'UPLOAD',
        timestamp: '2024-01-01T00:00:00Z'
      })
      expect(mockDb.builder.returning).toHaveBeenCalledWith('id')

      expect(result.status).toBe(201)
      expect(result.obj).toEqual({ success: true, id: 123 })
    })

    test('should return 500 when db insert throws', async () => {
      mockDb.builder.rejects(new Error('DB failed'))

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

  describe('buildQueryCriteria', () => {
    test('should build empty criteria when no query provided', () => {
      const result = buildQueryCriteria({})
      expect(result).toEqual({})
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] buildQueryCriteria called with:', {})
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Final criteria:', {})
    })

    test('should parse FRN as integer', () => {
      const result = buildQueryCriteria({ frn: '1234567890' })
      expect(result.frn).toBe(1234567890)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Parsed FRN:', {
        input: '1234567890',
        output: 1234567890
      })
    })

    test('should set schemeShortName', () => {
      const result = buildQueryCriteria({ schemeshortname: 'SFI' })
      expect(result.schemeShortName).toBe('SFI')
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Set schemeShortName:', 'SFI')
    })

    test('should set schemeYear as string', () => {
      const result = buildQueryCriteria({ schemeyear: '2023' })
      expect(result.schemeYear).toBe('2023')
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Set schemeYear (keeping as string):', '2023')
    })

    test('should set filename', () => {
      const filename = 'FFC_PaymentDelinkedStatement_DP_2024_1234000541_2026061108582129.pdf'
      const result = buildQueryCriteria({ filename })
      expect(result.filename).toBe(filename)
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Set filename:', filename)
    })

    test('should not include a received range; that is buildReceivedRange\'s job', () => {
      const result = buildQueryCriteria({ timestamp: '2026020510450842' })
      expect(result.received).toBeUndefined()
    })

    test('should build complete criteria with all filters except timestamp', () => {
      const result = buildQueryCriteria({
        frn: '1234567890',
        schemeshortname: 'SFI',
        schemeyear: '2023',
        timestamp: '2026020510450842'
      })

      expect(result.frn).toBe(1234567890)
      expect(result.schemeShortName).toBe('SFI')
      expect(result.schemeYear).toBe('2023')
      expect(result.received).toBeUndefined()
    })

    test('should log final criteria', () => {
      buildQueryCriteria({ frn: '123' })
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Final criteria:', expect.any(Object))
    })
  })

  describe('buildReceivedRange', () => {
    test('should return null when no timestamp provided', () => {
      const result = buildReceivedRange({})
      expect(result).toBeNull()
    })

    test('should build range for 16-digit timestamp', () => {
      const result = buildReceivedRange({ timestamp: '2026020510450842' })
      expect(result).toEqual({
        from: new Date('2026-02-05T10:45:08.000Z'),
        to: new Date('2026-02-05T10:45:08.999Z')
      })
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Adding timestamp range criteria to query on received:', expect.any(Object))
    })

    test('should build range for DD-MM-YYYY HH:MM timestamp', () => {
      const result = buildReceivedRange({ timestamp: '04-06-2026 11:45' })
      expect(result).toEqual({
        from: new Date('2026-06-04T11:40:00.000Z'),
        to: new Date('2026-06-04T11:50:00.999Z')
      })
    })

    test('should build range for DD-MM-YYYY date-only timestamp', () => {
      const result = buildReceivedRange({ timestamp: '04-06-2026' })
      expect(result).toEqual({
        from: new Date('2026-06-04T00:00:00.000Z'),
        to: new Date('2026-06-04T23:59:59.999Z')
      })
    })

    test('should return null and log for unrecognised format', () => {
      const result = buildReceivedRange({ timestamp: 'not-a-date' })
      expect(result).toBeNull()
      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Timestamp format not recognised, skipping filter:', 'not-a-date')
    })
  })

  describe('getOffset', () => {
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
    test.each([
      ['2026-02-15T10:09:23.450Z', '2026021510092345'],
      ['2026-01-01T00:00:00.000Z', '2026010100000000'],
      ['2026-02-15T10:09:23.567Z', '2026021510092356'],
      ['2026-02-15T10:09:23.999Z', '2026021510092399'],
      ['2026-02-15T10:09:23.001Z', '2026021510092300']
    ])('formats %s to %s', (inputIsoString, expectedTimestamp) => {
      const date = new Date(inputIsoString)
      const result = formatStatementTimestamp(date)
      expect(result).toBe(expectedTimestamp)
    })
  })

  describe('formatStatement', () => {
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
    const handler = routes.find(r => r.path === '/statements').handler

    test('returns payload with parsed values', async () => {
      mockStatementQuery(1, [{
        filename: 'file.csv',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2020-01-01T00:00:00.000Z'
      }])

      const result = await handler({ query: {} }, createResponseToolkit())

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
      mockStatementQuery(1, [{
        filename: null,
        schemeId: null,
        marketingYear: null,
        frn: null,
        received: '2020-01-01T00:00:00.000Z'
      }])

      const result = await handler({ query: {} }, createResponseToolkit())

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
      const { countBuilder, rowsBuilder } = mockStatementQuery(0, [])

      await handler({ query: { frn: '123', schemeshortname: 'SFI', schemeyear: '2023', filename: 'my-file.pdf', timestamp: '2026020510450842' } }, createResponseToolkit())

      const criteria = {
        frn: 123,
        schemeShortName: 'SFI',
        schemeYear: '2023',
        filename: 'my-file.pdf'
      }
      const range = buildReceivedRange({ timestamp: '2026020510450842' })

      expect(countBuilder.where).toHaveBeenCalledWith(criteria)
      expect(countBuilder.whereBetween).toHaveBeenCalledWith('received', [range.from, range.to])
      expect(rowsBuilder.where).toHaveBeenCalledWith(criteria)
      expect(rowsBuilder.whereBetween).toHaveBeenCalledWith('received', [range.from, range.to])
      expect(rowsBuilder.limit).toHaveBeenCalledWith(100)
      expect(rowsBuilder.offset).toHaveBeenCalledWith(0)
    })

    test('uses exact minute results when timestamp includes time and exact matches exist', async () => {
      mockStatementQuery(1, [{
        filename: 'file.pdf',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2026-06-04T11:45:20.000Z'
      }])

      await handler({ query: { timestamp: '04-06-2026 11:45' } }, createResponseToolkit())

      expect(mockDb.tables.statement).toHaveBeenCalledTimes(2)
    })

    test('falls back to widened window when exact minute has no matches', async () => {
      mockStatementQuery(0, [])
      mockStatementQuery(1, [{
        filename: 'file.pdf',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2026-06-04T11:46:00.000Z'
      }])

      const result = await handler({ query: { timestamp: '04-06-2026 11:45' } }, createResponseToolkit())

      expect(mockDb.tables.statement).toHaveBeenCalledTimes(4)
      expect(result.total).toBe(1)
      expect(result.statements).toHaveLength(1)
    })

    test('uses offset parameter when provided', async () => {
      const { rowsBuilder } = mockStatementQuery(0, [])

      await handler({ query: { offset: '10' } }, createResponseToolkit())

      expect(rowsBuilder.offset).toHaveBeenCalledWith(10)
      expect(rowsBuilder.limit).toHaveBeenCalledWith(100)
    })

    test('prioritizes continuationToken over offset', async () => {
      const { rowsBuilder } = mockStatementQuery(0, [])

      await handler({ query: { continuationToken: '20', offset: '10' } }, createResponseToolkit())

      expect(rowsBuilder.offset).toHaveBeenCalledWith(20)
    })

    test('uses custom limit when provided', async () => {
      const { rowsBuilder } = mockStatementQuery(0, [])

      await handler({ query: { limit: '25' } }, createResponseToolkit())

      expect(rowsBuilder.limit).toHaveBeenCalledWith(25)
      expect(rowsBuilder.offset).toHaveBeenCalledWith(0)
    })

    test('returns continuation token when more results available', async () => {
      const mockResults = new Array(100).fill({
        filename: 'file.pdf',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2020-01-01T00:00:00.000Z'
      })
      mockStatementQuery(150, mockResults)

      const result = await handler({ query: {} }, createResponseToolkit())

      expect(result.continuationToken).toBe('100')
    })

    test('returns null continuation token when no more results', async () => {
      mockStatementQuery(1, [{
        filename: 'file.pdf',
        schemeId: '1',
        marketingYear: '2023',
        frn: '123',
        received: '2020-01-01T00:00:00.000Z'
      }])

      const result = await handler({ query: {} }, createResponseToolkit())

      expect(result.continuationToken).toBeNull()
    })

    test('returns error response when database query fails', async () => {
      const countBuilder = createQueryBuilder().rejects(new Error('DB error'))
      mockDb.tables.statement.mockReturnValueOnce(countBuilder)

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

      await handler({ query: {} }, h)

      expect(h.response).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An error occurred while fetching statements'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_INTERNAL_SERVER_ERROR)
    })

    test('logs handler invocation with query parameters', async () => {
      mockStatementQuery(0, [])

      await handler({ query: { frn: '123' } }, createResponseToolkit())

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Handler called with query:', { frn: '123' })
    })

    test('logs query execution details', async () => {
      mockStatementQuery(0, [])

      await handler({ query: { limit: '10', offset: '5' } }, createResponseToolkit())

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Executing query with:', {
        criteria: {},
        limit: 10,
        offset: 5
      })
    })

    test('logs result count', async () => {
      mockStatementQuery(2, [{}, {}])

      await handler({ query: {} }, createResponseToolkit())

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Query returned', 2, 'results')
    })

    test('logs response details', async () => {
      mockStatementQuery(1, [{}])

      await handler({ query: {} }, createResponseToolkit())

      expect(consoleInfoSpy).toHaveBeenCalledWith('[STATEMENTS] Returning response with:', {
        statementCount: 1,
        total: 1,
        totalPages: 1,
        hasMore: false,
        nextContinuationToken: null
      })
    })

    test('applies combined filters with pagination', async () => {
      const { rowsBuilder } = mockStatementQuery(0, [])

      await handler({ query: { frn: '123', limit: '10', continuationToken: '20' } }, createResponseToolkit())

      expect(rowsBuilder.where).toHaveBeenCalledWith({ frn: 123 })
      expect(rowsBuilder.limit).toHaveBeenCalledWith(10)
      expect(rowsBuilder.offset).toHaveBeenCalledWith(20)
    })
  })
})
