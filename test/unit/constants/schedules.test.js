const schedules = require('../../../app/constants/schedules')

describe('schedules constant', () => {
  test('should export an object', () => {
    expect(schedules).toBeInstanceOf(Object)
  })

  test('should have DAX_CODES property', () => {
    expect(schedules).toHaveProperty('DAX_CODES')
  })

  test('should have NAMES property', () => {
    expect(schedules).toHaveProperty('NAMES')
  })

  test('should have exactly two properties', () => {
    expect(Object.keys(schedules)).toHaveLength(2)
  })

  test('should have the expected keys', () => {
    expect(Object.keys(schedules)).toStrictEqual([
      'DAX_CODES',
      'NAMES'
    ])
  })

  describe('DAX_CODES', () => {
    test('should be an object', () => {
      expect(schedules.DAX_CODES).toBeInstanceOf(Object)
    })

    test('should have QUARTERLY property with value "Q4"', () => {
      expect(schedules.DAX_CODES.QUARTERLY).toBe('Q4')
    })

    test('should have MONTHLY property with value "M12"', () => {
      expect(schedules.DAX_CODES.MONTHLY).toBe('M12')
    })

    test('should have THREE_DAY_QUARTERLY property with value "T4"', () => {
      expect(schedules.DAX_CODES.THREE_DAY_QUARTERLY).toBe('T4')
    })

    test('should have exactly three properties', () => {
      expect(Object.keys(schedules.DAX_CODES)).toHaveLength(3)
    })

    test('should have the expected keys', () => {
      expect(Object.keys(schedules.DAX_CODES)).toStrictEqual([
        'QUARTERLY',
        'MONTHLY',
        'THREE_DAY_QUARTERLY'
      ])
    })
  })

  describe('NAMES', () => {
    test('should be an object', () => {
      expect(schedules.NAMES).toBeInstanceOf(Object)
    })

    test('should have Q4 property with value "Quarterly"', () => {
      expect(schedules.NAMES.Q4).toBe('Quarterly')
    })

    test('should have M12 property with value "Monthly"', () => {
      expect(schedules.NAMES.M12).toBe('Monthly')
    })

    test('should have T4 property with value "Quarterly"', () => {
      expect(schedules.NAMES.T4).toBe('Quarterly')
    })

    test('should have N0 property with value "None"', () => {
      expect(schedules.NAMES.N0).toBe('None')
    })

    test('should have exactly four properties', () => {
      expect(Object.keys(schedules.NAMES)).toHaveLength(4)
    })

    test('should have the expected keys', () => {
      expect(Object.keys(schedules.NAMES)).toStrictEqual([
        'Q4',
        'M12',
        'T4',
        'N0'
      ])
    })
  })

  test('Q4 and T4 in NAMES should both equal "Quarterly"', () => {
    expect(schedules.NAMES.Q4).toBe(schedules.NAMES.T4)
  })
})
