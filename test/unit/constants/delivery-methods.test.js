const {
  METHOD_LETTER,
  METHOD_EMAIL
} = require('../../../app/constants/delivery-methods')

describe('delivery-methods constants', () => {
  describe('METHOD_LETTER', () => {
    test('should be defined', () => {
      expect(METHOD_LETTER).toBeDefined()
    })

    test('should be "letter"', () => {
      expect(METHOD_LETTER).toBe('letter')
    })

    test('should be a string', () => {
      expect(typeof METHOD_LETTER).toBe('string')
    })
  })

  describe('METHOD_EMAIL', () => {
    test('should be defined', () => {
      expect(METHOD_EMAIL).toBeDefined()
    })

    test('should be "email"', () => {
      expect(METHOD_EMAIL).toBe('email')
    })

    test('should be a string', () => {
      expect(typeof METHOD_EMAIL).toBe('string')
    })
  })

  describe('module exports', () => {
    test('should export all delivery method constants', () => {
      const deliveryMethodConstants = require('../../../app/constants/delivery-methods')

      expect(Object.keys(deliveryMethodConstants)).toHaveLength(2)
      expect(deliveryMethodConstants).toHaveProperty('METHOD_LETTER')
      expect(deliveryMethodConstants).toHaveProperty('METHOD_EMAIL')
    })
  })

  describe('delivery method values', () => {
    test('should be unique', () => {
      expect(METHOD_LETTER).not.toBe(METHOD_EMAIL)
    })

    test('should all be lowercase', () => {
      expect(METHOD_LETTER).toBe(METHOD_LETTER.toLowerCase())
      expect(METHOD_EMAIL).toBe(METHOD_EMAIL.toLowerCase())
    })

    test('should be valid delivery method types', () => {
      const methods = [METHOD_LETTER, METHOD_EMAIL]

      methods.forEach(method => {
        expect(typeof method).toBe('string')
        expect(method.length).toBeGreaterThan(0)
      })
    })
  })

  describe('delivery method usage', () => {
    test('should be suitable for database queries', () => {
      expect(METHOD_LETTER).toMatch(/^[a-z]+$/)
      expect(METHOD_EMAIL).toMatch(/^[a-z]+$/)
    })

    test('should be suitable for switch statements', () => {
      const testMethod = METHOD_LETTER
      let result

      switch (testMethod) {
        case METHOD_LETTER:
          result = 'postal'
          break
        case METHOD_EMAIL:
          result = 'electronic'
          break
        default:
          result = 'unknown'
      }

      expect(result).toBe('postal')
    })
  })
})
