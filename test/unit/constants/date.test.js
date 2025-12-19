const {
  JANUARY,
  FIRST_DAY_OF_MONTH,
  YEAR_START_MONTH,
  YEAR_START_DAY,
  END_OF_DAY_HOUR,
  END_OF_DAY_MINUTE,
  END_OF_DAY_SECOND,
  END_OF_DAY_MILLISECOND,
  MONTH_INDEX_OFFSET,
  MONTHS_PER_YEAR
} = require('../../../app/constants/date')

describe('date constants', () => {
  describe('JANUARY', () => {
    test('should be defined', () => {
      expect(JANUARY).toBeDefined()
    })

    test('should be 0', () => {
      expect(JANUARY).toBe(0)
    })

    test('should be a number', () => {
      expect(typeof JANUARY).toBe('number')
    })
  })

  describe('FIRST_DAY_OF_MONTH', () => {
    test('should be defined', () => {
      expect(FIRST_DAY_OF_MONTH).toBeDefined()
    })

    test('should be 1', () => {
      expect(FIRST_DAY_OF_MONTH).toBe(1)
    })

    test('should be a number', () => {
      expect(typeof FIRST_DAY_OF_MONTH).toBe('number')
    })
  })

  describe('YEAR_START_MONTH', () => {
    test('should be defined', () => {
      expect(YEAR_START_MONTH).toBeDefined()
    })

    test('should be 0', () => {
      expect(YEAR_START_MONTH).toBe(0)
    })

    test('should match JANUARY', () => {
      expect(YEAR_START_MONTH).toBe(JANUARY)
    })

    test('should be a number', () => {
      expect(typeof YEAR_START_MONTH).toBe('number')
    })
  })

  describe('YEAR_START_DAY', () => {
    test('should be defined', () => {
      expect(YEAR_START_DAY).toBeDefined()
    })

    test('should be 1', () => {
      expect(YEAR_START_DAY).toBe(1)
    })

    test('should match FIRST_DAY_OF_MONTH', () => {
      expect(YEAR_START_DAY).toBe(FIRST_DAY_OF_MONTH)
    })

    test('should be a number', () => {
      expect(typeof YEAR_START_DAY).toBe('number')
    })
  })

  describe('END_OF_DAY_HOUR', () => {
    test('should be defined', () => {
      expect(END_OF_DAY_HOUR).toBeDefined()
    })

    test('should be 23', () => {
      expect(END_OF_DAY_HOUR).toBe(23)
    })

    test('should be a number', () => {
      expect(typeof END_OF_DAY_HOUR).toBe('number')
    })
  })

  describe('END_OF_DAY_MINUTE', () => {
    test('should be defined', () => {
      expect(END_OF_DAY_MINUTE).toBeDefined()
    })

    test('should be 59', () => {
      expect(END_OF_DAY_MINUTE).toBe(59)
    })

    test('should be a number', () => {
      expect(typeof END_OF_DAY_MINUTE).toBe('number')
    })
  })

  describe('END_OF_DAY_SECOND', () => {
    test('should be defined', () => {
      expect(END_OF_DAY_SECOND).toBeDefined()
    })

    test('should be 59', () => {
      expect(END_OF_DAY_SECOND).toBe(59)
    })

    test('should be a number', () => {
      expect(typeof END_OF_DAY_SECOND).toBe('number')
    })
  })

  describe('END_OF_DAY_MILLISECOND', () => {
    test('should be defined', () => {
      expect(END_OF_DAY_MILLISECOND).toBeDefined()
    })

    test('should be 999', () => {
      expect(END_OF_DAY_MILLISECOND).toBe(999)
    })

    test('should be a number', () => {
      expect(typeof END_OF_DAY_MILLISECOND).toBe('number')
    })
  })

  describe('MONTH_INDEX_OFFSET', () => {
    test('should be defined', () => {
      expect(MONTH_INDEX_OFFSET).toBeDefined()
    })

    test('should be 1', () => {
      expect(MONTH_INDEX_OFFSET).toBe(1)
    })

    test('should be a number', () => {
      expect(typeof MONTH_INDEX_OFFSET).toBe('number')
    })
  })

  describe('MONTHS_PER_YEAR', () => {
    test('should be defined', () => {
      expect(MONTHS_PER_YEAR).toBeDefined()
    })

    test('should be 12', () => {
      expect(MONTHS_PER_YEAR).toBe(12)
    })

    test('should be a number', () => {
      expect(typeof MONTHS_PER_YEAR).toBe('number')
    })
  })

  describe('module exports', () => {
    test('should export all date constants', () => {
      const dateConstants = require('../../../app/constants/date')

      expect(Object.keys(dateConstants)).toHaveLength(10)
      expect(dateConstants).toHaveProperty('JANUARY')
      expect(dateConstants).toHaveProperty('FIRST_DAY_OF_MONTH')
      expect(dateConstants).toHaveProperty('YEAR_START_MONTH')
      expect(dateConstants).toHaveProperty('YEAR_START_DAY')
      expect(dateConstants).toHaveProperty('END_OF_DAY_HOUR')
      expect(dateConstants).toHaveProperty('END_OF_DAY_MINUTE')
      expect(dateConstants).toHaveProperty('END_OF_DAY_SECOND')
      expect(dateConstants).toHaveProperty('END_OF_DAY_MILLISECOND')
      expect(dateConstants).toHaveProperty('MONTH_INDEX_OFFSET')
      expect(dateConstants).toHaveProperty('MONTHS_PER_YEAR')
    })
  })

  describe('end of day timestamp', () => {
    test('should create valid timestamp with end of day constants', () => {
      const date = new Date(2024, 0, 1, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND)

      expect(date.getHours()).toBe(23)
      expect(date.getMinutes()).toBe(59)
      expect(date.getSeconds()).toBe(59)
      expect(date.getMilliseconds()).toBe(999)
    })
  })

  describe('year start date', () => {
    test('should create valid year start date', () => {
      const date = new Date(2024, YEAR_START_MONTH, YEAR_START_DAY)

      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })
  })
})
