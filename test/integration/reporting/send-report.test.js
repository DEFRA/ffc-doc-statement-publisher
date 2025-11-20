const db = require('../../../app/data')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const createReport = require('../../../app/reporting/create-report')
const { saveReportFile } = require('../../../app/storage')
const completeReport = require('../../../app/reporting/complete-report')
const { sendReport } = require('../../../app/reporting/send-report')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')

jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/reporting/get-deliveries-for-report')
jest.mock('../../../app/reporting/create-report')
jest.mock('../../../app/storage')
jest.mock('../../../app/reporting/complete-report')

describe('sendReport', () => {
  const schemeName = 'TEST'
  const startDate = new Date('2022-07-01T00:00:00Z')
  const endDate = new Date('2022-07-31T23:59:59Z')

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))
    await db.sequelize.truncate({ cascade: true })
    await db.statement.bulkCreate([mockStatement1, mockStatement2])
    await db.delivery.bulkCreate([mockDelivery1, mockDelivery2])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  const createMockStream = (deliveries = []) => ({
    on: jest.fn((event, callback) => {
      if (event === 'data') {
        deliveries.forEach(d => callback(d))
      }
      else if (event === 'end') {
        callback()
      }
      
      return this
    })
  })

  test('creates and sends report when deliveries are found', async () => {
    const mockDeliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123', requested: new Date(), completed: new Date() },
      { deliveryId: 2, statementId: 102, method: 'sms', reference: '124', requested: new Date(), completed: new Date() }
    ]
    const mockStream = createMockStream(mockDeliveries)

    getDeliveriesForReport.mockResolvedValue(mockStream)
    createReport.mockResolvedValue({ reportId: 1 })
    saveReportFile.mockResolvedValue()
    completeReport.mockResolvedValue()

    await sendReport(schemeName, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).toHaveBeenCalledWith(schemeName, null, startDate, endDate, expect.any(Date))
    expect(saveReportFile).toHaveBeenCalledWith(expect.stringContaining('test-'), expect.any(Object))
    expect(completeReport).toHaveBeenCalledWith(1, 2, expect.any(Object))
  })

  test('skips report creation when no deliveries found', async () => {
    const mockStream = createMockStream()
    getDeliveriesForReport.mockResolvedValue(mockStream)

    await sendReport(schemeName, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
  })

  test('handles errors and rolls back transaction', async () => {
    getDeliveriesForReport.mockRejectedValue(new Error('Test error'))

    await expect(sendReport(schemeName, startDate, endDate)).rejects.toThrow('Test error')
    expect(getDeliveriesForReport).toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
  })
})
