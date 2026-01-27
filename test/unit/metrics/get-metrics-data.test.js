const {
  getDateRangeForAll,
  getDateRangeForYTD,
  getDateRangeForYear,
  getDateRangeForMonthInYear,
  getDateRangeForRelativePeriod
} = require('../../../app/metrics/get-metrics-data')

describe('get-metrics-data', () => {
  describe('getDateRangeForAll', () => {
    test('should return null dates and useSchemeYear false', () => {
      const result = getDateRangeForAll()
      expect(result).toEqual({
        startDate: null,
        endDate: null,
        useSchemeYear: false
      })
    })
  })

  describe('getDateRangeForYTD', () => {
    test('should return start of year to now', () => {
      const fixedDate = new Date(2023, 5, 15) // June 15, 2023
      const result = getDateRangeForYTD(fixedDate)
      expect(result.startDate).toEqual(new Date(2023, 0, 1))
      expect(result.endDate).toBe(fixedDate)
      expect(result.useSchemeYear).toBe(false)
    })
  })

  describe('getDateRangeForYear', () => {
    test('should return full year range', () => {
      const result = getDateRangeForYear(2024)
      expect(result.startDate).toEqual(new Date(2024, 0, 1))
      expect(result.endDate).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999))
      expect(result.useSchemeYear).toBe(false)
    })
  })

  describe('getDateRangeForMonthInYear', () => {
    test('should return month range for given year and month', () => {
      const result = getDateRangeForMonthInYear(2024, 6)
      expect(result.startDate).toEqual(new Date(2024, 5, 1))
      expect(result.endDate).toEqual(new Date(2024, 6, 0, 23, 59, 59, 999))
      expect(result.useSchemeYear).toBe(true)
    })

    test('should throw error if schemeYear is not provided', () => {
      expect(() => getDateRangeForMonthInYear(null, 6)).toThrow('schemeYear and month are required for monthInYear period')
    })

    test('should throw error if month is not provided', () => {
      expect(() => getDateRangeForMonthInYear(2024, null)).toThrow('schemeYear and month are required for monthInYear period')
    })
  })

  describe('getDateRangeForRelativePeriod', () => {
    test('should return relative period range', () => {
      const now = new Date(2023, 5, 15, 12, 0, 0)
      const days = 7
      const result = getDateRangeForRelativePeriod(now, days)
      const expectedStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      expect(result.startDate).toEqual(expectedStart)
      expect(result.endDate).toBe(now)
      expect(result.useSchemeYear).toBe(false)
    })
  })

  describe('get-metrics-data edge cases', () => {
    test('getDateRangeForRelativePeriod handles zero days', () => {
      const now = new Date()
      const result = getDateRangeForRelativePeriod(now, 0)
      expect(result.startDate).toEqual(now)
      expect(result.endDate).toBe(now)
      expect(result.useSchemeYear).toBe(false)
    })

    test('getDateRangeForRelativePeriod handles negative days', () => {
      const now = new Date()
      const result = getDateRangeForRelativePeriod(now, -5)
      expect(result.startDate.getTime()).toBeGreaterThan(now.getTime())
      expect(result.endDate).toBe(now)
    })

    test('getDateRangeForYear handles year 0', () => {
      const result = getDateRangeForYear(0)
      expect(result.startDate.getFullYear()).toBe(1900)
      expect(result.endDate.getFullYear()).toBe(1900)
    })

    test('getDateRangeForMonthInYear throws for month 0', () => {
      expect(() => getDateRangeForMonthInYear(2024, 0)).toThrow()
    })

    test('getDateRangeForMonthInYear throws for year 0', () => {
      expect(() => getDateRangeForMonthInYear(0, 6)).toThrow()
    })
  })
})
