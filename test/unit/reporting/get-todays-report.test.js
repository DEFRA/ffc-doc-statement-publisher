const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['report'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

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
    mockDb.builder.resolves()
  })

  test('fetches reports with correct query parameters', async () => {
    await getTodaysReport(schemeName)

    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    expect(mockDb.tables.report).toHaveBeenCalledWith()
    expect(mockDb.builder.where).toHaveBeenCalledWith({ schemeName })

    const rangeModifier = mockDb.builder.where.mock.calls[1][0]
    expect(typeof rangeModifier).toBe('function')

    const innerBuilder = createQueryBuilder()
    rangeModifier.call(innerBuilder)

    expect(innerBuilder.whereBetween).toHaveBeenCalledWith('sent', [startOfDay, endOfDay])
    expect(innerBuilder.orWhere).toHaveBeenCalledWith(expect.any(Function))

    const orWhereModifier = innerBuilder.orWhere.mock.calls[0][0]
    const orInnerBuilder = createQueryBuilder()
    orWhereModifier.call(orInnerBuilder)

    expect(orInnerBuilder.whereNull).toHaveBeenCalledWith('sent')
    expect(orInnerBuilder.whereBetween).toHaveBeenCalledWith('requested', [startOfDay, endOfDay])
  })

  test('returns reports sent today and requested today, excluding others', async () => {
    const yesterday = new Date(mockToday)
    yesterday.setDate(yesterday.getDate() - 1)

    const mockReports = [
      { reportId: 1, schemeName, sent: new Date(mockToday.setHours(10, 0, 0, 0)), requested: yesterday },
      { reportId: 2, schemeName, sent: null, requested: new Date(mockToday.setHours(15, 0, 0, 0)) }
    ]

    mockDb.builder.resolves(mockReports)

    const result = await getTodaysReport(schemeName)

    expect(result).toHaveLength(2)
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ reportId: 1 }),
      expect.objectContaining({ reportId: 2 })
    ]))
  })

  test('throws error if database query fails', async () => {
    mockDb.builder.rejects(new Error('Database error'))
    await expect(getTodaysReport(schemeName)).rejects.toThrow('Database error')
  })
})
