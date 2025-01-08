const db = require('../../../app/data')
const getTodaysReport = require('../../../app/reporting/get-todays-report')
const publishByEmail = require('../../../app/publishing/publish-by-email')

const config = require('../../../app/config')

jest.mock('../../../app/reporting/get-todays-report')
jest.mock('../../../app/publishing/publish-by-email')

const { start } = require('../../../app/reporting/index')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')

describe('start', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    await db.sequelize.truncate({ cascade: true })
    await db.statement.bulkCreate([mockStatement1, mockStatement2])
    await db.delivery.bulkCreate([mockDelivery1, mockDelivery2])
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
  })

  test('should log the start of reporting', async () => {
    console.log = jest.fn()

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] Starting reporting')
  })

  test('should log when a report is due to run today', async () => {
    console.log = jest.fn()
    config.reportConfig.schemes = [
      {
        schemeName: mockStatement1.schemeName,
        template: 'template',
        email: 'test@example.com',
        schedule: { intervalNumber: 0, intervalType: 'days' },
        dateRange: { durationNumber: 1, durationType: 'days' }
      }
    ]

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report is due to run today for scheme: ', mockStatement1.schemeName)
  })

  test('should call sendReport if no existing report is found and log the start of sending report', async () => {
    console.log = jest.fn()
    publishByEmail.mockResolvedValue()

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] start send report for scheme: ', mockStatement1.schemeName)
    expect(console.log).toHaveBeenCalledWith('[REPORTING] create report as deliveries found for schema: ', mockStatement1.schemeName)
    expect(publishByEmail).toHaveBeenCalled()
    expect(publishByEmail.mock.calls[0][0]).toMatchSnapshot()
  })

  test('should not call sendReport if an existing report is found', async () => {
    getTodaysReport.mockResolvedValue([{}])

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report has already run today for scheme: ', mockStatement1.schemeName)
  })
})
