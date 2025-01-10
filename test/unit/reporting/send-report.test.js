const sendReport = require('../../../app/reporting/send-report')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const createReport = require('../../../app/reporting/create-report')
const completeReport = require('../../../app/reporting/complete-report')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const generateReportCsv = require('../../../app/reporting/generate-report-csv')
const { saveReportFile } = require('../../../app/storage')
const db = require('../../../app/data')

jest.mock('../../../app/reporting/get-deliveries-for-report')
jest.mock('../../../app/reporting/create-report')
jest.mock('../../../app/reporting/complete-report')
jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/reporting/generate-report-csv')
jest.mock('../../../app/storage')
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

  test('should create, save, and send report if deliveries are found', async () => {
    const schemeName = 'Test Scheme'
    const template = 'test-template'
    const email = 'test@example.com'
    const startDate = new Date('2022-01-01')
    const endDate = new Date('2022-01-31')
    const deliveries = [{ deliveryId: 1 }]
    const report = { reportId: 1 }
    const filename = 'test-scheme-2022-01-31.csv'
    const filedata = Buffer.from('test data', 'utf-8')

    getDeliveriesForReport.mockResolvedValue(deliveries)
    createReport.mockResolvedValue(report)
    generateReportCsv.mockReturnValue({ filename, filedata })
    publishByEmail.mockResolvedValue()
    completeReport.mockResolvedValue()

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, transaction)
    expect(createReport).toHaveBeenCalledWith(schemeName, deliveries[0].deliveryId, startDate, endDate, expect.any(Date))
    expect(generateReportCsv).toHaveBeenCalledWith(schemeName, expect.any(Date), deliveries)
    expect(saveReportFile).toHaveBeenCalledWith(filename, filedata)
    expect(publishByEmail).toHaveBeenCalledWith(template, email, filedata, { schemeName, startDate, endDate }, filename)
    expect(completeReport).toHaveBeenCalledWith(report.reportId, transaction)
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should not create, save, or send report if no deliveries are found', async () => {
    const schemeName = 'Test Scheme'
    const template = 'test-template'
    const email = 'test@example.com'
    const startDate = new Date('2022-01-01')
    const endDate = new Date('2022-01-31')

    getDeliveriesForReport.mockResolvedValue([])

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, transaction)
    expect(createReport).not.toHaveBeenCalled()
    expect(generateReportCsv).not.toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(publishByEmail).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalled()
  })
})
