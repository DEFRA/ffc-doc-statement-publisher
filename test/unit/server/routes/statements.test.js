const HTTP_INTERNAL_SERVER_ERROR = require('../../../../app/constants/statuses').HTTP_INTERNAL_SERVER_ERROR

describe('statements route', () => {
  afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
  })

  test('should export a GET route for /statements', () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {},
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    expect(routes).toHaveLength(1)
    expect(routes[0].method).toBe('GET')
    expect(routes[0].path).toBe('/statements')
    expect(typeof routes[0].handler).toBe('function')
  })

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
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
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
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
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

  test('returns payload with NaN for invalid numeric strings', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([{
          filename: 'file.csv',
          schemeId: 'invalid',
          marketingYear: 'not-a-year',
          frn: 'abc',
          received: '2020-01-01T00:00:00.000Z'
        }])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const result = await handler({ query: {} })

    expect(result).toEqual({
      statements: [{
        filename: 'file.csv',
        schemeId: NaN,
        marketingYear: NaN,
        frn: NaN,
        timestamp: '2020010100000000'
      }],
      continuationToken: null
    })
  })

  test('returns statements with query filters applied', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([{
          filename: 'file.csv',
          schemeId: '1',
          marketingYear: '2023',
          frn: '1234567890',
          received: '2020-01-01T00:00:00.000Z'
        }])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    const result = await handler({ query: { frn: '1234567890', schemeshortname: 'DP', schemeyear: '2023' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: {
        frn: 1234567890,
        schemeShortName: 'DP',
        schemeYear: 2023
      },
      limit: 50,
      offset: 0
    })

    expect(result).toEqual({
      statements: [{
        filename: 'file.csv',
        schemeId: 1,
        marketingYear: 2023,
        frn: 1234567890,
        timestamp: '2020010100000000'
      }],
      continuationToken: null
    })
  })

  test('filters by timestamp with operators when db.sequelize.Op is available', async () => {
    const gteSymbol = Symbol('gte')
    const ltSymbol = Symbol('lt')

    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([{
          filename: 'file.csv',
          schemeId: '1',
          marketingYear: '2023',
          frn: '123',
          received: '2026-01-16T10:09:24.670Z'
        }])
      },
      sequelize: {
        Op: {
          gte: gteSymbol,
          lt: ltSymbol
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { timestamp: '2026011610092467' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: {
        received: {
          [gteSymbol]: new Date('2026-01-16T10:09:24.670Z'),
          [ltSymbol]: new Date('2026-01-16T10:09:24.680Z')
        }
      },
      limit: 50,
      offset: 0
    })
  })

  test('filters by timestamp with exact match when db.sequelize.Op is not available', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: null
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { timestamp: '2026011610092467' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: {
        received: new Date('2026-01-16T10:09:24.670Z')
      },
      limit: 50,
      offset: 0
    })
  })

  test('ignores timestamp filter when timestamp is not 16 digits', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { timestamp: '12345' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: undefined,
      limit: 50,
      offset: 0
    })
  })

  test('uses offset parameter when provided', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { offset: '25' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: undefined,
      limit: 50,
      offset: 25
    })
  })

  test('prioritizes continuationToken over offset', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { continuationToken: '100', offset: '25' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: undefined,
      limit: 50,
      offset: 100
    })
  })

  test('ignores invalid continuationToken and uses offset', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { continuationToken: 'invalid', offset: '25' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: undefined,
      limit: 50,
      offset: 25
    })
  })

  test('uses custom limit when provided', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { limit: '100' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: undefined,
      limit: 100,
      offset: 0
    })
  })

  test('returns error response when database query fails', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const mockH = {
      response: (body) => ({
        code: (code) => ({ body, code })
      })
    }

    const result = await handler({ query: {} }, mockH)

    expect(result).toEqual({
      body: {
        error: 'Internal server error',
        message: 'An error occurred while fetching statements'
      },
      code: HTTP_INTERNAL_SERVER_ERROR
    })
  })

  test('handles empty result set', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const result = await handler({ query: {} })

    expect(result).toEqual({
      statements: [],
      continuationToken: null
    })
  })

  test('returns continuation token when more results available', async () => {
    const mockStatements = new Array(50).fill(null).map((_, i) => ({
      filename: `file${i}.csv`,
      schemeId: '1',
      marketingYear: '2023',
      frn: '123',
      received: '2020-01-01T00:00:00.000Z'
    }))

    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue(mockStatements)
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const result = await handler({ query: {} })

    expect(result.continuationToken).toBe('50')
    expect(result.statements).toHaveLength(50)
  })

  test('uses continuationToken for offset', async () => {
    jest.doMock('../../../../app/data', () => ({
      statement: {
        findAll: jest.fn().mockResolvedValue([])
      },
      sequelize: {
        Op: {
          gte: Symbol('gte'),
          lt: Symbol('lt')
        }
      }
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler
    const db = require('../../../../app/data')

    await handler({ query: { continuationToken: '100' } })

    expect(db.statement.findAll).toHaveBeenCalledWith({
      where: undefined,
      limit: 50,
      offset: 100
    })
  })
})
