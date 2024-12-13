const sendReport = require('../../../app/reporting/send-report')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const createReport = require('../../../app/reporting/create-report')
const completeReport = require('../../../app/reporting/complete-report')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const generateReportCsv = require('../../../app/reporting/generate-report-csv')
const db = require('../../../app/data')

jest.mock('../../../app/reporting/get-deliveries-for-report')
jest.mock('../../../app/reporting/create-report')
jest.mock('../../../app/reporting/complete-report')
jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/reporting/generate-report-csv')
jest.mock('../../../app/data')

describe('sendReport', () => {
  let transaction

  beforeEach(() => {
    transaction = { commit: jest.fn(), rollback: jest.fn() }
    db.sequelize.transaction.mockResolvedValue(transaction)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send a report when deliveries are found', async () => {
    const schemeName = 'Test Scheme'
    const template = 'template-id'
    const email = 'test@example.com'
    const startDate = new Date('2024-12-01T00:00:00Z')
    const endDate = new Date('2024-12-31T23:59:59Z')
    const deliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2024-12-01T10:00:00Z'), completed: new Date('2024-12-02T10:00:00Z') }
    ]
    const report = { id: 1 }
    const csvData = { filename: 'test_scheme-2024-12-12T00:00:00.000Z.csv', filedata: Buffer.from('csv content', 'utf-8') }

    getDeliveriesForReport.mockResolvedValue(deliveries)
    createReport.mockResolvedValue(report)
    generateReportCsv.mockReturnValue(csvData)

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, transaction)
    expect(createReport).toHaveBeenCalledWith(schemeName, deliveries[0].deliveryId, startDate, endDate, expect.any(Date))
    expect(generateReportCsv).toHaveBeenCalledWith(deliveries)
    expect(publishByEmail).toHaveBeenCalledWith(template, email, csvData.filedata, { schemeName, startDate, endDate }, csvData.filename)
    expect(completeReport).toHaveBeenCalledWith(report.id, transaction)
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should not send a report when no deliveries are found', async () => {
    const schemeName = 'Test Scheme'
    const template = 'template-id'
    const email = 'test@example.com'
    const startDate = new Date('2024-12-01T00:00:00Z')
    const endDate = new Date('2024-12-31T23:59:59Z')

    getDeliveriesForReport.mockResolvedValue([])

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, transaction)
    expect(createReport).not.toHaveBeenCalled()
    expect(generateReportCsv).not.toHaveBeenCalled()
    expect(publishByEmail).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should rollback transaction on error', async () => {
    const schemeName = 'Test Scheme'
    const template = 'template-id'
    const email = 'test@example.com'
    const startDate = new Date('2024-12-01T00:00:00Z')
    const endDate = new Date('2024-12-31T23:59:59Z')

    getDeliveriesForReport.mockRejectedValue(new Error('Test error'))

    await expect(sendReport(schemeName, template, email, startDate, endDate)).rejects.toThrow('Test error')

    expect(transaction.rollback).toHaveBeenCalled()
  })
})
