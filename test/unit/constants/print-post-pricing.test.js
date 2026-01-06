const printPostPricing = require('../../../app/constants/print-post-pricing')

describe('print-post-pricing constant', () => {
  test('should export an object', () => {
    expect(printPostPricing).toBeInstanceOf(Object)
  })

  test('should have PRINT_POST_UNIT_COST_2024 property', () => {
    expect(printPostPricing).toHaveProperty('PRINT_POST_UNIT_COST_2024')
  })

  test('should have PRINT_POST_UNIT_COST_2026 property', () => {
    expect(printPostPricing).toHaveProperty('PRINT_POST_UNIT_COST_2026')
  })

  test('should have DEFAULT_PRINT_POST_UNIT_COST property', () => {
    expect(printPostPricing).toHaveProperty('DEFAULT_PRINT_POST_UNIT_COST')
  })

  test('should have PRINT_POST_PRICING_START_2024 property', () => {
    expect(printPostPricing).toHaveProperty('PRINT_POST_PRICING_START_2024')
  })

  test('should have PRINT_POST_PRICING_START_2026 property', () => {
    expect(printPostPricing).toHaveProperty('PRINT_POST_PRICING_START_2026')
  })

  test('should have PRINT_POST_UNIT_COST_2024 with value 77', () => {
    expect(printPostPricing.PRINT_POST_UNIT_COST_2024).toBe(77)
  })

  test('should have PRINT_POST_UNIT_COST_2026 with value 82', () => {
    expect(printPostPricing.PRINT_POST_UNIT_COST_2026).toBe(82)
  })

  test('should have DEFAULT_PRINT_POST_UNIT_COST with value 77', () => {
    expect(printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBe(77)
  })

  test('should have PRINT_POST_PRICING_START_2024 with value "2024-04-01"', () => {
    expect(printPostPricing.PRINT_POST_PRICING_START_2024).toBe('2024-04-01')
  })

  test('should have PRINT_POST_PRICING_START_2026 with value "2026-01-05"', () => {
    expect(printPostPricing.PRINT_POST_PRICING_START_2026).toBe('2026-01-05')
  })

  test('should have exactly five properties', () => {
    expect(Object.keys(printPostPricing)).toHaveLength(5)
  })

  test('should have the expected keys', () => {
    expect(Object.keys(printPostPricing)).toStrictEqual([
      'PRINT_POST_UNIT_COST_2024',
      'PRINT_POST_UNIT_COST_2026',
      'DEFAULT_PRINT_POST_UNIT_COST',
      'PRINT_POST_PRICING_START_2024',
      'PRINT_POST_PRICING_START_2026'
    ])
  })

  test('all unit cost values should be numbers', () => {
    expect(typeof printPostPricing.PRINT_POST_UNIT_COST_2024).toBe('number')
    expect(typeof printPostPricing.PRINT_POST_UNIT_COST_2026).toBe('number')
    expect(typeof printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBe('number')
  })

  test('all pricing start date values should be strings', () => {
    expect(typeof printPostPricing.PRINT_POST_PRICING_START_2024).toBe('string')
    expect(typeof printPostPricing.PRINT_POST_PRICING_START_2026).toBe('string')
  })

  test('DEFAULT_PRINT_POST_UNIT_COST should equal PRINT_POST_UNIT_COST_2024', () => {
    expect(printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBe(printPostPricing.PRINT_POST_UNIT_COST_2024)
  })

  test('pricing start dates should be valid ISO date strings', () => {
    expect(printPostPricing.PRINT_POST_PRICING_START_2024).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(printPostPricing.PRINT_POST_PRICING_START_2026).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('pricing start dates should be parseable as valid dates', () => {
    const date2024 = new Date(printPostPricing.PRINT_POST_PRICING_START_2024)
    const date2026 = new Date(printPostPricing.PRINT_POST_PRICING_START_2026)

    expect(date2024).toBeInstanceOf(Date)
    expect(date2026).toBeInstanceOf(Date)
    expect(date2024.toString()).not.toBe('Invalid Date')
    expect(date2026.toString()).not.toBe('Invalid Date')
  })

  test('PRINT_POST_PRICING_START_2026 should be after PRINT_POST_PRICING_START_2024', () => {
    const date2024 = new Date(printPostPricing.PRINT_POST_PRICING_START_2024)
    const date2026 = new Date(printPostPricing.PRINT_POST_PRICING_START_2026)

    expect(date2026.getTime()).toBeGreaterThan(date2024.getTime())
  })

  test('unit costs should be positive numbers', () => {
    expect(printPostPricing.PRINT_POST_UNIT_COST_2024).toBeGreaterThan(0)
    expect(printPostPricing.PRINT_POST_UNIT_COST_2026).toBeGreaterThan(0)
    expect(printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBeGreaterThan(0)
  })

  test('PRINT_POST_UNIT_COST_2026 should be greater than PRINT_POST_UNIT_COST_2024', () => {
    expect(printPostPricing.PRINT_POST_UNIT_COST_2026).toBeGreaterThan(printPostPricing.PRINT_POST_UNIT_COST_2024)
  })
})
