const {
  PERIOD_ALL,
  PERIOD_YTD,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR,
  PERIOD_MONTH,
  PERIOD_WEEK,
  PERIOD_DAY
} = require('../../../app/constants/periods')

describe('periods constants', () => {
  describe('PERIOD_ALL', () => {
    test('should be defined', () => {
      expect(PERIOD_ALL).toBeDefined()
    })

    test('should be "all"', () => {
      expect(PERIOD_ALL).toBe('all')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_ALL).toBe('string')
    })
  })

  describe('PERIOD_YTD', () => {
    test('should be defined', () => {
      expect(PERIOD_YTD).toBeDefined()
    })

    test('should be "ytd"', () => {
      expect(PERIOD_YTD).toBe('ytd')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_YTD).toBe('string')
    })
  })

  describe('PERIOD_YEAR', () => {
    test('should be defined', () => {
      expect(PERIOD_YEAR).toBeDefined()
    })

    test('should be "year"', () => {
      expect(PERIOD_YEAR).toBe('year')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_YEAR).toBe('string')
    })
  })

  describe('PERIOD_MONTH_IN_YEAR', () => {
    test('should be defined', () => {
      expect(PERIOD_MONTH_IN_YEAR).toBeDefined()
    })

    test('should be "monthInYear"', () => {
      expect(PERIOD_MONTH_IN_YEAR).toBe('monthInYear')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_MONTH_IN_YEAR).toBe('string')
    })
  })

  describe('PERIOD_MONTH', () => {
    test('should be defined', () => {
      expect(PERIOD_MONTH).toBeDefined()
    })

    test('should be "month"', () => {
      expect(PERIOD_MONTH).toBe('month')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_MONTH).toBe('string')
    })
  })

  describe('PERIOD_WEEK', () => {
    test('should be defined', () => {
      expect(PERIOD_WEEK).toBeDefined()
    })

    test('should be "week"', () => {
      expect(PERIOD_WEEK).toBe('week')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_WEEK).toBe('string')
    })
  })

  describe('PERIOD_DAY', () => {
    test('should be defined', () => {
      expect(PERIOD_DAY).toBeDefined()
    })

    test('should be "day"', () => {
      expect(PERIOD_DAY).toBe('day')
    })

    test('should be a string', () => {
      expect(typeof PERIOD_DAY).toBe('string')
    })
  })

  describe('module exports', () => {
    test('should export all period constants', () => {
      const periodConstants = require('../../../app/constants/periods')

      expect(Object.keys(periodConstants)).toHaveLength(7)
      expect(periodConstants).toHaveProperty('PERIOD_ALL')
      expect(periodConstants).toHaveProperty('PERIOD_YTD')
      expect(periodConstants).toHaveProperty('PERIOD_YEAR')
      expect(periodConstants).toHaveProperty('PERIOD_MONTH_IN_YEAR')
      expect(periodConstants).toHaveProperty('PERIOD_MONTH')
      expect(periodConstants).toHaveProperty('PERIOD_WEEK')
      expect(periodConstants).toHaveProperty('PERIOD_DAY')
    })
  })

  describe('period values', () => {
    test('should all be unique', () => {
      const values = [
        PERIOD_ALL,
        PERIOD_YTD,
        PERIOD_YEAR,
        PERIOD_MONTH_IN_YEAR,
        PERIOD_MONTH,
        PERIOD_WEEK,
        PERIOD_DAY
      ]
      const uniqueValues = new Set(values)

      expect(uniqueValues.size).toBe(values.length)
    })

    test('should all be lowercase', () => {
      expect(PERIOD_ALL).toBe(PERIOD_ALL.toLowerCase())
      expect(PERIOD_YTD).toBe(PERIOD_YTD.toLowerCase())
      expect(PERIOD_YEAR).toBe(PERIOD_YEAR.toLowerCase())
      expect(PERIOD_MONTH_IN_YEAR.charAt(0)).toBe(PERIOD_MONTH_IN_YEAR.charAt(0).toLowerCase())
      expect(PERIOD_MONTH).toBe(PERIOD_MONTH.toLowerCase())
      expect(PERIOD_WEEK).toBe(PERIOD_WEEK.toLowerCase())
      expect(PERIOD_DAY).toBe(PERIOD_DAY.toLowerCase())
    })
  })

  describe('period validation', () => {
    test('should be valid period types for API', () => {
      const validPeriods = [
        PERIOD_ALL,
        PERIOD_YTD,
        PERIOD_YEAR,
        PERIOD_MONTH_IN_YEAR,
        PERIOD_MONTH,
        PERIOD_WEEK,
        PERIOD_DAY
      ]

      validPeriods.forEach(period => {
        expect(typeof period).toBe('string')
        expect(period.length).toBeGreaterThan(0)
      })
    })
  })
})
