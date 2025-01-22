const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')
const sendReport = require('../../../app/reporting/send-report')
const config = require('../../../app/config')
const { start } = require('../../../app/reporting/index')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')

jest.mock('../../../app/reporting/get-todays-report')
jest.mock('../../../app/reporting/send-report')

describe('start', () => {
  const mockScheme = {
    schemeName: 'TEST',
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
    await db.statement.bulkCreate([mockStatement1, mockStatement2])
    await db.delivery.bulkCreate([mockDelivery1, mockDelivery2])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should process scheme when report is due', async () => {
    getTodaysReport.mockResolvedValue([])
    console.log = jest.fn()

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] Starting reporting')
    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report is due to run today for scheme: ', 'TEST')
    expect(getTodaysReport).toHaveBeenCalledWith('TEST')
    expect(sendReport).toHaveBeenCalledWith(
      'TEST',
      new Date('2022-07-05T00:00:00.000Z'),
      new Date('2022-08-05T23:59:59.999Z')
    )
  })

  test('should skip report generation when report already exists', async () => {
    getTodaysReport.mockResolvedValue([{ id: 1 }])
    console.log = jest.fn()

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report has already run today for scheme: ', 'TEST')
    expect(sendReport).not.toHaveBeenCalled()
  })

  test('should handle errors and continue execution', async () => {
    getTodaysReport.mockRejectedValue(new Error('Test error'))
    console.error = jest.fn()

    await start()

    expect(console.error).toHaveBeenCalledWith('Error processing scheme:', 'TEST', expect.any(Error))
  })
})
