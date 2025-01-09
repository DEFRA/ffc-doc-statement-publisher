const { v4: uuidv4 } = require('uuid')
const db = require('../../../app/data')
const publishByEmail = require('../../../app/publishing/publish-by-email')

const config = require('../../../app/config')

jest.mock('../../../app/reporting/get-todays-report')
jest.mock('../../../app/publishing/publish-by-email')

const { start } = require('../../../app/reporting/index')
const currentTimestamp = Math.floor(Date.now() / 1000)
const numberOfRecords = 4500

const generateMockStatements = (count) => {
  const mockScheme = {
    schemeName: 'Sustainable Farming Incentive',
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
    postcode: `SW${i + 1} ${i + 1}A`.substring(0, 8), // Ensure postcode is 8 characters long
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
    statementId: statement.statementId, // Reference the corresponding statement integer ID
    reference: uuidv4(), // Generate a UUID for reference
    method: 'EMAIL',
    requested: new Date(2022, 7, 5, 15, 30, 10, 120),
    completed: i % 2 === 0 ? null : new Date(2022, 7, 5, 15, 30, 10, 120)
  }))
}

describe('start', () => {
  let mockStatements

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  beforeAll(async () => {
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })

    try {
      mockStatements = generateMockStatements(numberOfRecords)
      await db.statement.bulkCreate(mockStatements)
    } catch (e) {
    //   console.error('Error creating mock statements:', e)
    }

    try {
      await db.delivery.bulkCreate(generateMockDeliveries(mockStatements))
    } catch (e) {
    //   console.error('Error creating mock deliveries:', e)
    }
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  test('should call sendReport if no existing report is found and log the start of sending report', async () => {
    console.log = jest.fn()
    publishByEmail.mockResolvedValue()

    config.reportConfig.schemes = [
      {
        schemeName: 'Sustainable Farming Incentive',
        template: 'template',
        email: 'test@example.com',
        schedule: { intervalNumber: 1, intervalType: 'months', dayOfMonth: 5 },
        dateRange: { durationNumber: 1, durationType: 'months' }
      }
    ]

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] start send report for scheme: ', 'Sustainable Farming Incentive')
    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report is due to run today for scheme: ', 'Sustainable Farming Incentive')
    expect(publishByEmail).toHaveBeenCalled()

    const buffer = publishByEmail.mock.calls[0][2]
    console.info('Buffer size:', buffer.length)

    const bufferSizeInBytes = buffer.length
    const bufferSizeInMB = bufferSizeInBytes / (1024 * 1024)
    console.info(`Buffer size: ${bufferSizeInMB.toFixed(2)} MB`)

    expect(buffer.length).toBeGreaterThan(0)
    expect(bufferSizeInMB).toBeLessThanOrEqual(2)
  })
})
