const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['report'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const completeReport = require('../../../app/reporting/complete-report')

describe('completeReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(1)
  })

  test('should update the report with the current date', async () => {
    const reportId = 1
    const transaction = mockDb.trx
    const mockDate = new Date('2024-12-12T00:00:00Z')
    const lastDeliveryId = 123

    const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

    await completeReport(reportId, lastDeliveryId, transaction)

    dateSpy.mockRestore()

    expect(mockDb.tables.report).toHaveBeenCalledWith(transaction)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ reportId })
    expect(mockDb.builder.update).toHaveBeenCalledWith({
      sent: mockDate,
      lastDeliveryId
    })
  })
})
