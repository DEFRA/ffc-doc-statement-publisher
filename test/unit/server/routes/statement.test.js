const HTTP_INTERNAL_SERVER_ERROR = require('../../../../app/constants/statuses').HTTP_INTERNAL_SERVER_ERROR

describe('statements route', () => {
  afterEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
  })

  test('returns payload with parsed values', async () => {
    jest.doMock('../../../../app/data/models/statement', () => ({
      filename: 'file.csv',
      schemeId: '1',
      marketingYear: '2023',
      frn: '123',
      timestamp: '2020-01-01T00:00:00Z'
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const result = await handler()

    expect(result).toEqual({
      filename: 'file.csv',
      schemeId: 1,
      marketingYear: 2023,
      frn: 123,
      timestamp: '2020-01-01T00:00:00Z'
    })
  })

  test('returns payload with null values when properties are missing', async () => {
    jest.doMock('../../../../app/data/models/statement', () => ({
      filename: null,
      schemeId: null,
      marketingYear: null,
      frn: null,
      timestamp: '2020-01-01T00:00:00Z'
    }))

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const result = await handler()

    expect(result).toEqual({
      filename: null,
      schemeId: null,
      marketingYear: null,
      frn: null,
      timestamp: '2020-01-01T00:00:00Z'
    })
  })

  test('returns h.response on error', async () => {
    const throwing = new Proxy({}, { get: () => { throw new Error('boom') } })
    jest.doMock('../../../../app/data/models/statement', () => throwing)

    const routes = require('../../../../app/server/routes/statements')
    const handler = routes[0].handler

    const mockH = {
      response: (body) => ({
        code: (code) => ({ body, code })
      })
    }

    const result = await handler(undefined, mockH)

    expect(result).toEqual({
      body: {
        error: 'Internal server error',
        message: 'An error occurred while fetching statement'
      },
      code: HTTP_INTERNAL_SERVER_ERROR
    })
  })
})
