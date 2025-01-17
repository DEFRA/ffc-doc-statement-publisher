const { v4: uuidv4 } = require('uuid')
const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')
const sendReport = require('../../../app/reporting/send-report')
const config = require('../../../app/config')

jest.mock('../../../app/reporting/get-todays-report')
jest.mock('../../../app/reporting/send-report')

const { start } = require('../../../app/reporting/index')
const currentTimestamp = Math.floor(Date.now() / 1000)
const numberOfRecords = 10000

const generateMockStatements = (count) => {
  const mockScheme = {
    schemeName: 'TEST',
    schemeShortName: 'SFI',
    schemeYear: '2022',
    schemeFrequency: 'Quarterly'
  }

  return Array.from({ length: count }, (_, i) => ({
    statementId: currentTimestamp + i + 1,
    businessName: `Business ${i + 1}`,
    addressLine1: 'Line1',
    addressLine2: 'Line2',
    addressLine3: 'Line 3',
    addressLine4: 'Line4',
    addressLine5: 'Line5',
    postcode: `SW${i + 1} ${i + 1}A`.substring(0, 8),
    filename: `FFC_PaymentStatement_SFI_2022_${i + 1}_2022080515301012.pdf`,
    sbi: 123456789 + i,
    frn: 1234567890 + i,
    email: `farmer${i + 1}@farm.com`,
    emailTemplate: 'template',
    received: new Date(2022, 7, 5, 15, 30, 10, 120),
    ...mockScheme
  }))
}

const generateMockDeliveries = (statements) => {
  return statements.map((statement, i) => ({
    deliveryId: currentTimestamp + i + 1,
    statementId: statement.statementId,
    reference: uuidv4(),
    method: 'EMAIL',
    requested: new Date(2022, 7, 5, 15, 30, 10, 120),
    completed: i % 2 === 0 ? null : new Date(2022, 7, 5, 15, 30, 10, 120)
  }))
}

const generateMockFailures = (deliveries, failureCount) => {
  return deliveries.slice(0, failureCount).map((delivery, i) => ({
    failureId: currentTimestamp + i + 1,
    deliveryId: delivery.deliveryId,
    statusCode: 500,
    reason: 'Server Error',
    error: 'Internal Server Error',
    message: 'Failed to deliver',
    failed: new Date(2022, 7, 5, 15, 30, 10, 120)
  }))
}

describe('load test for reporting', () => {
  const mockScheme = {
    schemeName: 'TEST',
    template: 'test-template',
    email: 'test@test.com',
    schedule: {
      intervalType: 'months',
      dayOfMonth: 5,
      hour: 15,
      minute: 30
    },
    dateRange: {
      durationNumber: 1,
      durationType: 'months'
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    config.reportConfig.schemes = [mockScheme]
  })

  beforeAll(async () => {
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))
    await db.sequelize.truncate({ cascade: true })
    const mockStatements = generateMockStatements(numberOfRecords)
    await db.statement.bulkCreate(mockStatements)
    const mockDeliveries = generateMockDeliveries(mockStatements)
    await db.delivery.bulkCreate(mockDeliveries)
    const mockFailures = generateMockFailures(mockDeliveries, Math.floor(numberOfRecords / 4))
    await db.failure.bulkCreate(mockFailures)
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should process large number of records efficiently', async () => {
    getTodaysReport.mockResolvedValue([])
    sendReport.mockResolvedValue()
    console.log = jest.fn()

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] Starting reporting')
    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report is due to run today for scheme: ', 'TEST')
    expect(getTodaysReport).toHaveBeenCalledWith('TEST')
    expect(sendReport).toHaveBeenCalled()
  })

  test('should handle errors and continue execution', async () => {
    getTodaysReport.mockRejectedValue(new Error('Test error'))
    console.error = jest.fn()

    await start()

    expect(console.error).toHaveBeenCalledWith('Error processing scheme:', 'TEST', expect.any(Error))
  })
})
