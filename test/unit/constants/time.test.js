const {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  HOURS_PER_DAY,
  DAYS_PER_WEEK,
  DAYS_PER_MONTH,
  MILLISECONDS_PER_DAY
} = require('../../../app/constants/time')

describe('time constants', () => {
  describe('MILLISECONDS_PER_SECOND', () => {
    test('should be defined', () => {
      expect(MILLISECONDS_PER_SECOND).toBeDefined()
    })

    test('should be 1000', () => {
      expect(MILLISECONDS_PER_SECOND).toBe(1000)
    })

    test('should be a number', () => {
      expect(typeof MILLISECONDS_PER_SECOND).toBe('number')
    })
  })

  describe('SECONDS_PER_MINUTE', () => {
    test('should be defined', () => {
      expect(SECONDS_PER_MINUTE).toBeDefined()
    })

    test('should be 60', () => {
      expect(SECONDS_PER_MINUTE).toBe(60)
    })

    test('should be a number', () => {
      expect(typeof SECONDS_PER_MINUTE).toBe('number')
    })
  })

  describe('MINUTES_PER_HOUR', () => {
    test('should be defined', () => {
      expect(MINUTES_PER_HOUR).toBeDefined()
    })

    test('should be 60', () => {
      expect(MINUTES_PER_HOUR).toBe(60)
    })

    test('should be a number', () => {
      expect(typeof MINUTES_PER_HOUR).toBe('number')
    })
  })

  describe('HOURS_PER_DAY', () => {
    test('should be defined', () => {
      expect(HOURS_PER_DAY).toBeDefined()
    })

    test('should be 24', () => {
      expect(HOURS_PER_DAY).toBe(24)
    })

    test('should be a number', () => {
      expect(typeof HOURS_PER_DAY).toBe('number')
    })
  })

  describe('DAYS_PER_WEEK', () => {
    test('should be defined', () => {
      expect(DAYS_PER_WEEK).toBeDefined()
    })

    test('should be 7', () => {
      expect(DAYS_PER_WEEK).toBe(7)
    })

    test('should be a number', () => {
      expect(typeof DAYS_PER_WEEK).toBe('number')
    })
  })

  describe('DAYS_PER_MONTH', () => {
    test('should be defined', () => {
      expect(DAYS_PER_MONTH).toBeDefined()
    })

    test('should be 30', () => {
      expect(DAYS_PER_MONTH).toBe(30)
    })

    test('should be a number', () => {
      expect(typeof DAYS_PER_MONTH).toBe('number')
    })
  })

  describe('MILLISECONDS_PER_DAY', () => {
    test('should be defined', () => {
      expect(MILLISECONDS_PER_DAY).toBeDefined()
    })

    test('should be calculated correctly', () => {
      expect(MILLISECONDS_PER_DAY).toBe(86400000)
    })

    test('should equal 24 * 60 * 60 * 1000', () => {
      expect(MILLISECONDS_PER_DAY).toBe(24 * 60 * 60 * 1000)
    })

    test('should be a number', () => {
      expect(typeof MILLISECONDS_PER_DAY).toBe('number')
    })
  })

  describe('module exports', () => {
    test('should export all time constants', () => {
      const timeConstants = require('../../../app/constants/time')

      expect(Object.keys(timeConstants)).toHaveLength(7)
      expect(timeConstants).toHaveProperty('MILLISECONDS_PER_SECOND')
      expect(timeConstants).toHaveProperty('SECONDS_PER_MINUTE')
      expect(timeConstants).toHaveProperty('MINUTES_PER_HOUR')
      expect(timeConstants).toHaveProperty('HOURS_PER_DAY')
      expect(timeConstants).toHaveProperty('DAYS_PER_WEEK')
      expect(timeConstants).toHaveProperty('DAYS_PER_MONTH')
      expect(timeConstants).toHaveProperty('MILLISECONDS_PER_DAY')
    })
  })
})
