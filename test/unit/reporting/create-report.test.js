const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['report'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const createReport = require('../../../app/reporting/create-report')

describe('createReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create a report with the given parameters', async () => {
    const schemeName = 'Test Scheme'
    const lastDeliveryId = 123
    const reportStartDate = new Date('2024-12-01')
    const reportEndDate = new Date('2024-12-31')
    const requested = new Date('2024-12-12')

    const mockReport = {
      reportId: 1,
      lastDeliveryId,
      schemeName,
      reportStartDate,
      reportEndDate,
      requested
    }

    mockDb.builder.resolves([mockReport])

    const result = await createReport(schemeName, lastDeliveryId, reportStartDate, reportEndDate, requested)

    expect(mockDb.tables.report).toHaveBeenCalledWith()
    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      lastDeliveryId,
      schemeName,
      reportStartDate,
      reportEndDate,
      requested
    })
    expect(mockDb.builder.returning).toHaveBeenCalledWith('*')
    expect(result).toEqual(mockReport)
  })
})
