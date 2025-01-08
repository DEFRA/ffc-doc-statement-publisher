const moment = require('moment')
const config = require('../../../app/config')
const getTodaysReport = require('../../../app/reporting/get-todays-report')
const sendReport = require('../../../app/reporting/send-report')
const { start } = require('../../../app/reporting')

jest.mock('../../../app/config')
jest.mock('../../../app/reporting/get-todays-report')
jest.mock('../../../app/reporting/send-report')

describe('Reporting', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('start', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))
      jest.spyOn(global, 'setTimeout')
    })

    afterEach(() => {
      jest.useRealTimers()
      if (global?.setTimeout?.mockRestore) {
        global.setTimeout.mockRestore()
      }
    })

    test('should process schemes and call startSchemeReport if report is due today', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'scheme1',
            template: 'template1',
            email: 'email@example.com',
            schedule: { intervalNumber: 0, intervalType: 'days' },
            dateRange: { durationNumber: 1, durationType: 'days' }
          }
        ]
      }
      const startDate = moment().startOf('day').subtract(1, 'days').toDate()
      const endDate = moment().endOf('day').toDate()
      getTodaysReport.mockResolvedValue([])

      await start()

      expect(getTodaysReport).toHaveBeenCalledWith('scheme1')
      expect(sendReport).toHaveBeenCalledWith('scheme1', 'template1', 'email@example.com', startDate, endDate)
    })

    test('should not call startSchemeReport if report is not due today', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'scheme1',
            template: 'template1',
            email: 'email@example.com',
            schedule: { intervalNumber: 1, intervalType: 'days' },
            dateRange: { durationNumber: 1, durationType: 'days' }
          }
        ]
      }

      await start()

      expect(getTodaysReport).not.toHaveBeenCalled()
      expect(sendReport).not.toHaveBeenCalled()
    })

    test('should handle errors and continue processing', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'scheme1',
            template: 'template1',
            email: 'email@example.com',
            schedule: { intervalNumber: 0, intervalType: 'days' },
            dateRange: { durationNumber: 1, durationType: 'days' }
          }
        ]
      }
      getTodaysReport.mockRejectedValue(new Error('error'))

      await start()

      expect(getTodaysReport).toHaveBeenCalledWith('scheme1')
      expect(sendReport).not.toHaveBeenCalled()
    })

    test('should schedule the next run', async () => {
      config.reportingCheckInterval = 1000
      config.reportConfig = { schemes: [] }

      await start()

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
    })

    test('should pass correct dates to startSchemeReport for daily schedule', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'dailyScheme',
            template: 'templateDaily',
            email: 'daily@example.com',
            schedule: { intervalNumber: 0, intervalType: 'days' },
            dateRange: { durationNumber: 1, durationType: 'days' }
          }
        ]
      }
      const startDate = moment().startOf('day').subtract(1, 'days').toDate()
      const endDate = moment().endOf('day').toDate()
      getTodaysReport.mockResolvedValue([])

      await start()

      expect(sendReport).toHaveBeenCalledWith('dailyScheme', 'templateDaily', 'daily@example.com', startDate, endDate)
    })

    test('should pass correct dates to startSchemeReport for monthly schedule', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'monthlyScheme',
            template: 'templateMonthly',
            email: 'monthly@example.com',
            schedule: { intervalNumber: 0, intervalType: 'months' },
            dateRange: { durationNumber: 1, durationType: 'months' }
          }
        ]
      }
      const startDate = moment().startOf('day').subtract(1, 'months').toDate()
      const endDate = moment().endOf('day').toDate()
      getTodaysReport.mockResolvedValue([])

      await start()

      expect(sendReport).toHaveBeenCalledWith('monthlyScheme', 'templateMonthly', 'monthly@example.com', startDate, endDate)
    })

    test('should pass correct dates to startSchemeReport for yearly schedule', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'yearlyScheme',
            template: 'templateYearly',
            email: 'yearly@example.com',
            schedule: { intervalNumber: 0, intervalType: 'years' },
            dateRange: { durationNumber: 1, durationType: 'years' }
          }
        ]
      }
      const startDate = moment().startOf('day').subtract(1, 'years').toDate()
      const endDate = moment().endOf('day').toDate()
      getTodaysReport.mockResolvedValue([])

      await start()

      expect(sendReport).toHaveBeenCalledWith('yearlyScheme', 'templateYearly', 'yearly@example.com', startDate, endDate)
    })
  })
})