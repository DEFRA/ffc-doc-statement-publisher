const moment = require('moment')
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
  })

  beforeAll(async () => {
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
        schedule: { intervalNumber: 0, intervalType: 'days', hour: 15, minute: 30, second: 10 },
        dateRange: { durationNumber: 1, durationType: 'days' }
      }
    ]

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report is due to run today for scheme: ', mockStatement1.schemeName)
  })

  test('should call sendReport if no existing report is found and log the start of sending report', async () => {
    console.log = jest.fn()
    publishByEmail.mockResolvedValue()

    config.reportConfig.schemes = [
      {
        schemeName: mockStatement1.schemeName,
        template: 'template',
        email: 'test@example.com',
        schedule: { intervalNumber: 1, intervalType: 'months', dayOfMonth: 5 },
        dateRange: { durationNumber: 1, durationType: 'months' }
      }
    ]

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] start send report for scheme: ', mockStatement1.schemeName)
    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report is due to run today for scheme: ', mockStatement1.schemeName)
    expect(publishByEmail).toHaveBeenCalled()
    expect(publishByEmail.mock.calls[0][0]).toMatchSnapshot()
  })

  test('should not call sendReport if an existing report is found', async () => {
    getTodaysReport.mockResolvedValue([{}])

    await start()

    expect(console.log).toHaveBeenCalledWith('[REPORTING] A report has already run today for scheme: ', mockStatement1.schemeName)
  })

  test.skip('should pass correct dates to startSchemeReport for daily schedule', async () => {
    config.reportConfig.schemes = [
      {
        schemeName: 'dailyScheme',
        template: 'templateDaily',
        email: 'daily@example.com',
        schedule: { intervalNumber: 0, intervalType: 'days', hour: 15, minute: 30, second: 10 },
        dateRange: { durationNumber: 1, durationType: 'days' }
      }
    ]
    const startDate = moment().startOf('day').subtract(1, 'days').toDate()
    const endDate = moment().endOf('day').toDate()
    getTodaysReport.mockResolvedValue([])

    await start()

    expect(publishByEmail).toHaveBeenCalledWith('dailyScheme', 'templateDaily', 'daily@example.com', startDate, endDate)
  })

  test.skip('should pass correct dates to startSchemeReport for monthly schedule', async () => {
    config.reportConfig.schemes = [
      {
        schemeName: 'monthlyScheme',
        template: 'templateMonthly',
        email: 'monthly@example.com',
        schedule: { intervalNumber: 0, intervalType: 'months', dayOfMonth: 5, hour: 15, minute: 30, second: 10 },
        dateRange: { durationNumber: 1, durationType: 'months' }
      }
    ]
    const startDate = moment().subtract(1, 'months').date(5).startOf('day').toDate()
    const endDate = moment().endOf('day').toDate()
    getTodaysReport.mockResolvedValue([])

    await start()

    expect(publishByEmail).toHaveBeenCalledWith('monthlyScheme', 'templateMonthly', 'monthly@example.com', startDate, endDate)
  })

  test.skip('should pass correct dates to startSchemeReport for yearly schedule', async () => {
    config.reportConfig.schemes = [
      {
        schemeName: 'yearlyScheme',
        template: 'templateYearly',
        email: 'yearly@example.com',
        schedule: { intervalNumber: 0, intervalType: 'years', dayOfYear: 5, monthOfYear: 8, hour: 15, minute: 30, second: 10 },
        dateRange: { durationNumber: 1, durationType: 'years' }
      }
    ]
    const startDate = moment().month(7).date(5).startOf('day').subtract(1, 'years').toDate()
    const endDate = moment().endOf('day').toDate()
    getTodaysReport.mockResolvedValue([])

    await start()
    console.info('Arguments passed to publishByEmail::', publishByEmail.mock.calls)

    expect(publishByEmail).toHaveBeenCalledWith('yearlyScheme', 'templateYearly', 'yearly@example.com', startDate, endDate)
  })
})
