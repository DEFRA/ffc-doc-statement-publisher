const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['report'])

jest.mock('../../../app/data', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const removeFailedReport = require('../../../app/reporting/remove-failed-report')

describe('removeFailedReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('should delete the report with the correct reportId when valid reportId given', async () => {
    const reportId = 123
    await removeFailedReport(reportId)

    expect(mockDb.tables.report).toHaveBeenCalledTimes(1)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ reportId })
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('should not touch the report table when no reportId provided', async () => {
    await removeFailedReport()

    expect(mockDb.tables.report).not.toHaveBeenCalled()
  })

  test('should handle errors from the delete', async () => {
    const reportId = 123
    const error = new Error('Database error')
    mockDb.builder.rejects(error)

    await expect(removeFailedReport(reportId)).rejects.toThrow('Database error')
    expect(mockDb.tables.report).toHaveBeenCalledTimes(1)
  })
})
