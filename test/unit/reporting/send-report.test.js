const sendReport = require('../../../app/reporting/send-report')
const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
const createReport = require('../../../app/reporting/create-report')
const completeReport = require('../../../app/reporting/complete-report')
const { saveReportFile } = require('../../../app/storage')
const db = require('../../../app/data')
const { PassThrough } = require('stream')

jest.mock('../../../app/reporting/get-deliveries-for-report')
jest.mock('../../../app/reporting/create-report')
jest.mock('../../../app/reporting/complete-report')
jest.mock('../../../app/publishing/publish-by-email')
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

  test('should create and send report when deliveries are found', async () => {
    const schemeName = 'TEST'
    const template = 'test-template'
    const email = 'test@test.com'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    const mockDeliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2022-07-01T10:00:00Z'), completed: new Date('2022-07-02T10:00:00Z') },
      { deliveryId: 2, statementId: 102, method: 'sms', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2022-07-03T10:00:00Z'), completed: new Date('2022-07-04T10:00:00Z') },
      { deliveryId: 3, statementId: 103, method: 'letter', reference: '123e4567-e89b-12d3-a456-426614174002', requested: new Date('2022-07-03T10:00:00Z'), completed: new Date('2022-07-04T10:00:00Z'), statusCode: 500, reason: 'Server Error', error: 'Internal Server Error', message: 'Failed to deliver', failed: new Date('2022-07-04T12:00:00Z') }
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
    saveReportFile.mockImplementation((filename, stream) => {
      const passThrough = new PassThrough()
      stream.pipe(passThrough)
      let data = ''
      passThrough.on('data', chunk => {
        data += chunk.toString()
      })
      passThrough.on('end', () => {
        expect(data).toMatchSnapshot()
      })
    })
    completeReport.mockResolvedValue()

    await sendReport(schemeName, template, email, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).toHaveBeenCalledWith(schemeName, 3, startDate, endDate, expect.any(Date), transaction)
    expect(saveReportFile).toHaveBeenCalledWith(expect.stringContaining('test-'), expect.any(Object))
    expect(completeReport).toHaveBeenCalledWith(1, expect.any(Object))
    expect(transaction.commit).toHaveBeenCalled()
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
    expect(transaction.rollback).toHaveBeenCalled()
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
    expect(transaction.rollback).toHaveBeenCalled()
  })
})
