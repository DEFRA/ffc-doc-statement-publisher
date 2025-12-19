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

  test('should have PRINT_POST_UNIT_COST_2024 with value 77', () => {
    expect(printPostPricing.PRINT_POST_UNIT_COST_2024).toBe(77)
  })

  test('should have PRINT_POST_UNIT_COST_2026 with value 82', () => {
    expect(printPostPricing.PRINT_POST_UNIT_COST_2026).toBe(82)
  })

  test('should have DEFAULT_PRINT_POST_UNIT_COST with value 77', () => {
    expect(printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBe(77)
  })

  test('should have exactly three properties', () => {
    expect(Object.keys(printPostPricing)).toHaveLength(3)
  })

  test('should have the expected keys', () => {
    expect(Object.keys(printPostPricing)).toStrictEqual([
      'PRINT_POST_UNIT_COST_2024',
      'PRINT_POST_UNIT_COST_2026',
      'DEFAULT_PRINT_POST_UNIT_COST'
    ])
  })

  test('all values should be numbers', () => {
    expect(typeof printPostPricing.PRINT_POST_UNIT_COST_2024).toBe('number')
    expect(typeof printPostPricing.PRINT_POST_UNIT_COST_2026).toBe('number')
    expect(typeof printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBe('number')
  })

  test('DEFAULT_PRINT_POST_UNIT_COST should equal PRINT_POST_UNIT_COST_2024', () => {
    expect(printPostPricing.DEFAULT_PRINT_POST_UNIT_COST).toBe(printPostPricing.PRINT_POST_UNIT_COST_2024)
  })
})
