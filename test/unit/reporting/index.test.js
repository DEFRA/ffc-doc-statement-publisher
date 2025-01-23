const moment = require('moment')
const config = require('../../../app/config')
const getTodaysReport = require('../../../app/reporting/get-todays-report')
const { sendReport } = require('../../../app/reporting/send-report')
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
      expect(sendReport).toHaveBeenCalledWith('scheme1', startDate, endDate)
    })

    test('should not call startSchemeReport if report is not due today', async () => {
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'scheme1',
            schedule: { intervalNumber: 1, intervalType: 'months' },
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
            schedule: { intervalNumber: 0, intervalType: 'days' },
            dateRange: { durationNumber: 1, durationType: 'days' }
          }
        ]
      }
      const startDate = moment().startOf('day').subtract(1, 'days').toDate()
      const endDate = moment().endOf('day').toDate()
      getTodaysReport.mockResolvedValue([])

      await start()

      expect(sendReport).toHaveBeenCalledWith('dailyScheme', startDate, endDate)
    })

    test('should pass correct dates to startSchemeReport for monthly schedule', async () => {
      const dayOfMonth = 2
      jest.useFakeTimers().setSystemTime(new Date(2022, 7, dayOfMonth, 15, 30, 10, 120))
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'monthlyScheme',
            schedule: { intervalNumber: 0, intervalType: 'months', dayOfMonth },
            dateRange: { durationNumber: 1, durationType: 'months' }
          }
        ]
      }
      const startDate = moment().subtract(1, 'months').date(dayOfMonth).startOf('day').toDate()
      const endDate = moment().date(dayOfMonth).endOf('day').toDate()
      getTodaysReport.mockResolvedValue([])

      await start()

      expect(sendReport).toHaveBeenCalledWith('monthlyScheme', startDate, endDate)
    })

    test('should pass correct dates to startSchemeReport for yearly schedule', async () => {
      const monthOfYear = 6
      const dayOfYear = 15
      jest.useFakeTimers().setSystemTime(new Date(2022, monthOfYear - 1, dayOfYear, 15, 30, 10, 120))
      config.reportConfig = {
        schemes: [
          {
            schemeName: 'yearlyScheme',
            schedule: { intervalNumber: 0, intervalType: 'years', dayOfYear, monthOfYear },
            dateRange: { durationNumber: 1, durationType: 'years' }
          }
        ]
      }
      const startDate = moment().month(monthOfYear - 1).date(dayOfYear).startOf('day').subtract(1, 'years').toDate()
      const endDate = moment().month(monthOfYear - 1).date(dayOfYear).endOf('day').toDate()

      getTodaysReport.mockResolvedValue([])

      await start()

      expect(sendReport).toHaveBeenCalledWith('yearlyScheme', startDate, endDate)
    })
  })
})
