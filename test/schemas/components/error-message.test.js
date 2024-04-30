const { EMPTY, INVALID } = require('../../../app/constants/crm-error-messages')

const schema = require('../../../app/schemas/components/errorMessage')

let errorMessage

describe('CRM error message schema', () => {
  describe('When errorMessage is EMPTY', () => {
    beforeEach(() => {
      errorMessage = EMPTY
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toStrictEqual(errorMessage)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When errorMessage is INVALID', () => {
    beforeEach(() => {
      errorMessage = INVALID
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toStrictEqual(errorMessage)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When errorMessage is not a valid one', () => {
    beforeEach(() => {
      errorMessage = 'Invalid error message.'
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return string starting "The error message must be one of the following" as value for key: error.details[0].message', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is not given', () => {
    test('should return an object with 2 keys', () => {
      const result = schema.validate()
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
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

    test('should return "An error message must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('An error message must be provided.')
    })
  })

  describe('When errorMessage is ""', () => {
    beforeEach(() => {
      errorMessage = ''
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return string starting "The error message must be one of the following" as value for key: error.details[0].message', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is 1', () => {
    beforeEach(() => {
      errorMessage = 1
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return string starting "The error message must be one of the following" as value for key: error.details[0].message', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is []', () => {
    beforeEach(() => {
      errorMessage = []
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "errorMessage must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is {}', () => {
    beforeEach(() => {
      errorMessage = []
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "errorMessage must be a string." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is null', () => {
    beforeEach(() => {
      errorMessage = null
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "errorMessage must be a string." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is undefined', () => {
    beforeEach(() => {
      errorMessage = undefined
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "An error message must be provided." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toBe('An error message must be provided.')
    })
  })

  describe('When errorMessage is true', () => {
    beforeEach(() => {
      errorMessage = true
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "errorMessage must be a string." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })

  describe('When errorMessage is NaN', () => {
    beforeEach(() => {
      errorMessage = NaN
    })

    test('should return an object', async () => {
      const result = schema.validate(errorMessage)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(errorMessage)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return errorMessage as value for key: value', () => {
      const result = schema.validate(errorMessage)
      expect(result.value).toBe(errorMessage)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "errorMessage must be a string." as value for key: error.details[0].message when frnEmptyString', () => {
      const result = schema.validate(errorMessage)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The error message must be one of the following'))
    })
  })
})
