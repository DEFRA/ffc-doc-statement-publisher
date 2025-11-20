const { sendReport, getDataRow } = require('../../../app/reporting/send-report')
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
  let mockStream

  beforeAll(() => {
    console.log = jest.fn()
    console.error = jest.fn()
    console.debug = jest.fn()
  })

  beforeEach(() => {
    transaction = { commit: jest.fn(), rollback: jest.fn() }
    db.sequelize.transaction.mockResolvedValue(transaction)

    mockStream = {
      on: jest.fn(),
      end: jest.fn(),
      write: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should create and send report when deliveries are found', async () => {
    const schemeName = 'TEST'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    const mockDeliveries = [
      { deliveryId: 1, statementId: 101, method: 'email', reference: '123e4567-e89b-12d3-a456-426614174000', requested: new Date('2022-07-01T10:00:00Z'), completed: new Date('2022-07-02T10:00:00Z') },
      { deliveryId: 2, statementId: 102, method: 'sms', reference: '123e4567-e89b-12d3-a456-426614174001', requested: new Date('2022-07-03T10:00:00Z'), completed: new Date('2022-07-04T10:00:00Z') },
      { deliveryId: 3, statementId: 103, method: 'letter', reference: '123e4567-e89b-12d3-a456-426614174002', requested: new Date('2022-07-03T10:00:00Z'), completed: new Date('2022-07-04T10:00:00Z'), statusCode: 500, reason: 'Server Error', error: 'Internal Server Error', message: 'Failed to deliver', failed: new Date('2022-07-04T12:00:00Z') }
    ]

    mockStream.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        mockDeliveries.forEach(d => callback(d))
      }
      if (event === 'end') {
        callback()
      }
      return mockStream
    })

    getDeliveriesForReport.mockResolvedValue(mockStream)
    createReport.mockResolvedValue({ reportId: 1 })

    saveReportFile.mockImplementation((filename, stream) => {
      const pass = new PassThrough()
      stream.pipe(pass)

      return new Promise(resolve => {
        let data = ''
        pass.on('data', chunk => (data += chunk.toString()))
        pass.on('end', () => {
          // Minimal assertions instead of snapshot
          expect(data.length).toBeGreaterThan(0)
          expect(data).toContain('email')
          expect(data).toContain('sms')
          expect(data).toContain('letter')
          resolve()
        })
      })
    })

    completeReport.mockResolvedValue()

    await sendReport(schemeName, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalled()
    expect(createReport).toHaveBeenCalled()
    expect(saveReportFile).toHaveBeenCalled()
    expect(completeReport).toHaveBeenCalledWith(1, 3, expect.any(Object))
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should handle no deliveries found', async () => {
    mockStream.on.mockImplementation((event, cb) => {
      if (event === 'end') {
        cb()
      }

      return mockStream
    })

    getDeliveriesForReport.mockResolvedValue(mockStream)

    await sendReport('TEST', new Date(), new Date())

    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalled()
  })

  test('should handle errors and rollback transaction', async () => {
    getDeliveriesForReport.mockRejectedValue(new Error('Test error'))

    await expect(sendReport('TEST', new Date(), new Date())).rejects.toThrow('Test error')

    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalled()
  })

  test('should rollback transaction on stream error', async () => {
    const error = new Error('Stream error')
    mockStream.on.mockImplementation((event, callback) => {
      if (event === 'error') {
        process.nextTick(() => callback(error))
      }

      return mockStream
    })
    getDeliveriesForReport.mockResolvedValue(mockStream)

    await expect(sendReport('TEST', new Date(), new Date())).rejects.toThrow('Stream error')
    expect(transaction.rollback).toHaveBeenCalled()
  })

  test('should rollback transaction when no data is received', async () => {
    mockStream.on.mockImplementation((event, callback) => {
      if (event === 'end') {
        process.nextTick(callback)
      }
      
      return mockStream
    })
    getDeliveriesForReport.mockResolvedValue(mockStream)

    await sendReport('TEST', new Date(), new Date())

    expect(transaction.rollback).toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })
})

describe('getDataRow', () => {
  test('FAILED status', () => {
    const data = {
      failureId: 1,
      frn: 1234567890,
      sbi: 123456789,
      PaymentReference: 'PR123',
      schemeName: 'Scheme Name',
      schemeShortName: 'Scheme Short Name',
      schemeYear: 2022,
      method: 'Email',
      businessName: 'Business Name',
      addressLine1: 'Address Line 1',
      addressLine2: 'Address Line 2',
      addressLine3: 'Address Line 3',
      addressLine4: 'Address Line 4',
      addressLine5: 'Address Line 5',
      postcode: 'AB12 3CD',
      email: 'email@example.com',
      filename: 'filename.pdf',
      deliveryId: '12345',
      received: '2022-07-01T00:00:00Z',
      requested: '2022-07-01T01:00:00Z',
      failed: '2022-07-01T02:00:00Z',
      completed: '2022-07-01T03:00:00Z',
      statusCode: 400,
      reason: 'Bad Request',
      error: 'Invalid data',
      message: 'Data validation failed'
    }

    const row = getDataRow(
      data,
      'FAILED',
      'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD',
      'Status Code: 400, Reason: Bad Request, Error: Invalid data, Message: Data validation failed'
    )

    expect(row.Status).toBe('FAILED')
    expect(row['Error(s)']).toContain('400')
    expect(row['Business Address']).toContain('Address Line 1')
  })

  test('SUCCESS status', () => {
    const row = getDataRow(
      { completed: '2022-07-01T03:00:00Z' },
      'SUCCESS',
      'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD',
      ''
    )

    expect(row.Status).toBe('SUCCESS')
    expect(row['Error(s)']).toBe('')
  })

  test('PENDING status', () => {
    const row = getDataRow(
      { requested: '2022-07-01T01:00:00Z' },
      'PENDING',
      'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD',
      ''
    )

    expect(row.Status).toBe('PENDING')
    expect(row['Error(s)']).toBe('')
    expect(row['Business Address']).toContain('Address Line 1')
  })

  test('missing fields', () => {
    const row = getDataRow({}, 'PENDING', '', '')
    expect(row.Status).toBe('PENDING')
    expect(row['Business Address']).toBe('')
    expect(row['Error(s)']).toBe('')
  })
})
