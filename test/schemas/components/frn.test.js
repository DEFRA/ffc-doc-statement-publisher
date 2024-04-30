const schema = require('../../../app/schemas/components/frn')

let frn

describe('FRN schema', () => {
  describe('When FRN is a 10 digit number', () => {
    beforeEach(() => {
      frn = require('../../mocks/components/frn')
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toStrictEqual(frn)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When FRN is a parseable 10 digit float', () => {
    beforeEach(() => {
      frn = 1234567890.0
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return parseInt(frn) as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toStrictEqual(parseInt(frn))
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When FRN is a parseable alphanumeric 10 digit number', () => {
    beforeEach(() => {
      frn = require('../../mocks/components/frn').toString()
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return parseInt(frn) as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toStrictEqual(parseInt(frn))
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When FRN is less than a 10 digit number', () => {
    beforeEach(() => {
      frn = 12345
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.min" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.min')
    })

    test('should return "The FRN must be 10 digits." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be 10 digits.')
    })
  })

  describe('When FRN is more than a 10 digit number', () => {
    beforeEach(() => {
      frn = 123456789012345
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.max" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.max')
    })

    test('should return "The FRN must be 10 digits." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be 10 digits.')
    })
  })

  describe('When FRN is a float that is less than a 10 digit number', () => {
    beforeEach(() => {
      frn = 1234.5
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.integer" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.integer')
    })

    test('should return "The FRN must be 10 digits." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be 10 digits.')
    })
  })

  describe('When FRN is a float that is more than a 10 digit number', () => {
    beforeEach(() => {
      frn = 1234567890.5
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.integer" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.integer')
    })

    test('should return "The FRN must be 10 digits." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be 10 digits.')
    })
  })

  describe('When FRN is a alphanumeric value', () => {
    beforeEach(() => {
      frn = 'abcdefghij'
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })

  describe('When FRN is not given', () => {
    test('should return an object with 2 keys', () => {
      const result = schema.validate()
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate()
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate()
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate()
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "FRN must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('FRN must be provided.')
    })
  })

  describe('When FRN is ""', () => {
    beforeEach(() => {
      frn = ''
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })

  describe('When FRN is []', () => {
    beforeEach(() => {
      frn = []
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })

  describe('When FRN is {}', () => {
    beforeEach(() => {
      frn = []
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })

  describe('When FRN is null', () => {
    beforeEach(() => {
      frn = null
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })

  describe('When FRN is undefined', () => {
    beforeEach(() => {
      frn = undefined
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "FRN must be provided." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('FRN must be provided.')
    })
  })

  describe('When FRN is true', () => {
    beforeEach(() => {
      frn = true
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })

  describe('When FRN is NaN', () => {
    beforeEach(() => {
      frn = NaN
    })

    test('should return an object', async () => {
      const result = schema.validate(frn)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(frn)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return frn as value for key: value', () => {
      const result = schema.validate(frn)
      expect(result.value).toBe(frn)
    })

    test('should return "number.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('should return "The FRN must be a number." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(frn)
      expect(result.error.details[0].message).toBe('The FRN must be a number.')
    })
  })
})
