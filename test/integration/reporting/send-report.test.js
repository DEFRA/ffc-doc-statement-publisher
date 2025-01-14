const db = require('../../../app/data')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const createReport = require('../../../app/reporting/create-report')
const { saveReportFile } = require('../../../app/storage')
const completeReport = require('../../../app/reporting/complete-report')
const sendReport = require('../../../app/reporting/send-report')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')

jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/reporting/get-deliveries-for-report')
jest.mock('../../../app/reporting/create-report')
jest.mock('../../../app/storage')
jest.mock('../../../app/reporting/complete-report')

describe('sendReport', () => {
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

  test('should create and send report when deliveries are found', async () => {
    const schemeName = 'TEST'
    const template = 'test-template'
    const email = 'test@test.com'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    const mockDeliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2022-07-01T10:00:00Z'), completed: new Date('2022-07-02T10:00:00Z') },
      { deliveryId: 2, statementId: 102, method: 'sms', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2022-07-03T10:00:00Z'), completed: new Date('2022-07-04T10:00:00Z') }
    ]

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          mockDeliveries.forEach(delivery => callback(delivery))
        }
        if (event === 'end') {
          callback()
        }
        return mockStream
      })
    }

    getDeliveriesForReport.mockResolvedValue(mockStream)
    createReport.mockResolvedValue({ reportId: 1 })
    saveReportFile.mockResolvedValue()
    completeReport.mockResolvedValue()

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).toHaveBeenCalledWith(schemeName, 2, startDate, endDate, expect.any(Date))
    expect(saveReportFile).toHaveBeenCalledWith(expect.stringContaining('test-'), expect.any(Object))
    expect(completeReport).toHaveBeenCalledWith(1, expect.any(Object))
  })

  test('should handle no deliveries found', async () => {
    const schemeName = 'TEST'
    const template = 'test-template'
    const email = 'test@test.com'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'end') {
          callback()
        }
        return mockStream
      })
    }

    getDeliveriesForReport.mockResolvedValue(mockStream)

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).not.toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
  })

  test('should handle errors and rollback transaction', async () => {
    const schemeName = 'TEST'
    const template = 'test-template'
    const email = 'test@test.com'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    getDeliveriesForReport.mockRejectedValue(new Error('Test error'))

    await expect(sendReport(schemeName, template, email, startDate, endDate)).rejects.toThrow('Test error')

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).not.toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
  })
})
