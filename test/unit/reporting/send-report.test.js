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

    await sendReport(schemeName, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).toHaveBeenCalledWith(schemeName, 3, startDate, endDate, expect.any(Date), transaction)
    expect(saveReportFile).toHaveBeenCalledWith(expect.stringContaining('test-'), expect.any(Object))
    expect(completeReport).toHaveBeenCalledWith(1, expect.any(Object))
    expect(transaction.commit).toHaveBeenCalled()
  })

  test('should handle no deliveries found', async () => {
    const schemeName = 'TEST'
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

    await sendReport(schemeName, startDate, endDate)

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).not.toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalled()
  })

  test('should handle errors and rollback transaction', async () => {
    const schemeName = 'TEST'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    getDeliveriesForReport.mockRejectedValue(new Error('Test error'))

    await expect(sendReport(schemeName, startDate, endDate)).rejects.toThrow('Test error')

    expect(getDeliveriesForReport).toHaveBeenCalledWith(schemeName, startDate, endDate, expect.any(Object))
    expect(createReport).not.toHaveBeenCalled()
    expect(saveReportFile).not.toHaveBeenCalled()
    expect(completeReport).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalled()
  })

  test('should rollback transaction and throw error on stream error', async () => {
    const error = new Error('Stream error')
    const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
    getDeliveriesForReport.mockImplementation(() => {
      const stream = mockStream
      process.nextTick(() => stream.on.mock.calls.find(x => x[0] === 'error')[1](error))
      return stream
    })

    await expect(sendReport('TEST', new Date(), new Date()))
      .rejects.toThrow('Stream error')
    expect(transaction.rollback).toHaveBeenCalled()
  })

  test('should rollback transaction when no data is received', async () => {
    const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
    getDeliveriesForReport.mockImplementation(() => {
      const stream = mockStream
      process.nextTick(() => stream.on.mock.calls.find(x => x[0] === 'end')[1]())
      return stream
    })

    await sendReport('TEST', new Date(), new Date())
    expect(transaction.rollback).toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  test('should rollback transaction when no data received', async () => {
    const schemeName = 'TEST'
    const startDate = new Date('2022-07-01T00:00:00Z')
    const endDate = new Date('2022-07-31T23:59:59Z')

    const getDeliveriesForReport = require('../../../app/reporting/get-deliveries-for-report')
    getDeliveriesForReport.mockImplementation(() => {
      const stream = mockStream
      process.nextTick(() => {
        stream.on.mock.calls.find(x => x[0] === 'end')[1]()
      })
      return stream
    })

    const { sendReport } = require('../../../app/reporting/send-report')
    await sendReport(schemeName, startDate, endDate)

    expect(transaction.rollback).toHaveBeenCalled()
    expect(transaction.commit).not.toHaveBeenCalled()
  })
})

describe('getDataRow', () => {
  test('should return row data with FAILED status', () => {
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
    const status = 'FAILED'
    const address = 'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD'
    const errors = 'Status Code: 400, Reason: Bad Request, Error: Invalid data, Message: Data validation failed'
    const row = getDataRow(data, status, address, errors)
    expect(row).toEqual({
      Status: 'FAILED',
      'Error(s)': 'Status Code: 400, Reason: Bad Request, Error: Invalid data, Message: Data validation failed',
      FRN: '1234567890',
      SBI: '123456789',
      'Payment Reference': 'PR123',
      'Scheme Name': 'Scheme Name',
      'Scheme Short Name': 'Scheme Short Name',
      'Scheme Year': '2022',
      'Delivery Method': 'Email',
      'Business Name': 'Business Name',
      'Business Address': 'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD',
      Email: 'email@example.com',
      Filename: 'filename.pdf',
      'Document DB ID': '12345',
      'Statement Data Received': '2022-07-01 00:00:00',
      'Notify Email Requested': '2022-07-01 01:00:00',
      'Statement Failure Notification': '2022-07-01 02:00:00',
      'Statement Delivery Notification': '2022-07-01 03:00:00'
    })
  })

  test('should return row data with SUCCESS status', () => {
    const data = {
      completed: '2022-07-01T03:00:00Z',
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
      failed: '2022-07-01T02:00:00Z'
    }
    const status = 'SUCCESS'
    const address = 'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD'
    const errors = ''
    const row = getDataRow(data, status, address, errors)
    expect(row).toEqual({
      Status: 'SUCCESS',
      'Error(s)': '',
      FRN: '1234567890',
      SBI: '123456789',
      'Payment Reference': 'PR123',
      'Scheme Name': 'Scheme Name',
      'Scheme Short Name': 'Scheme Short Name',
      'Scheme Year': '2022',
      'Delivery Method': 'Email',
      'Business Name': 'Business Name',
      'Business Address': 'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD',
      Email: 'email@example.com',
      Filename: 'filename.pdf',
      'Document DB ID': '12345',
      'Statement Data Received': '2022-07-01 00:00:00',
      'Notify Email Requested': '2022-07-01 01:00:00',
      'Statement Failure Notification': '2022-07-01 02:00:00',
      'Statement Delivery Notification': '2022-07-01 03:00:00'
    })
  })

  test('should return row data with PENDING status', () => {
    const data = {
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
      failed: '2022-07-01T02:00:00Z'
    }
    const status = 'PENDING'
    const address = 'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD'
    const errors = ''
    const row = getDataRow(data, status, address, errors)
    expect(row).toEqual({
      Status: 'PENDING',
      'Error(s)': '',
      FRN: '1234567890',
      SBI: '123456789',
      'Payment Reference': 'PR123',
      'Scheme Name': 'Scheme Name',
      'Scheme Short Name': 'Scheme Short Name',
      'Scheme Year': '2022',
      'Delivery Method': 'Email',
      'Business Name': 'Business Name',
      'Business Address': 'Address Line 1, Address Line 2, Address Line 3, Address Line 4, Address Line 5, AB12 3CD',
      Email: 'email@example.com',
      Filename: 'filename.pdf',
      'Document DB ID': '12345',
      'Statement Data Received': '2022-07-01 00:00:00',
      'Notify Email Requested': '2022-07-01 01:00:00',
      'Statement Failure Notification': '2022-07-01 02:00:00',
      'Statement Delivery Notification': ''
    })
  })

  test('should return row data with missing fields', () => {
    const data = {}
    const status = 'PENDING'
    const address = ''
    const errors = ''
    const row = getDataRow(data, status, address, errors)
    expect(row).toEqual({
      Status: 'PENDING',
      'Error(s)': '',
      FRN: '',
      SBI: '',
      'Payment Reference': '',
      'Scheme Name': '',
      'Scheme Short Name': '',
      'Scheme Year': '',
      'Delivery Method': '',
      'Business Name': '',
      'Business Address': '',
      Email: '',
      Filename: '',
      'Document DB ID': '',
      'Statement Data Received': '',
      'Notify Email Requested': '',
      'Statement Failure Notification': '',
      'Statement Delivery Notification': ''
    })
  })
})
