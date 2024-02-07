const schema = require('../../app/schemas/objects/crm')

let email
let frn
let errorMessage

let message

describe('CRM message schema', () => {
  beforeEach(() => {
    email = require('../../test/mocks/components/email')
    frn = require('../../test/mocks/components/frn')
    errorMessage = require('../../app/constants/crm-error-messages').EMPTY

    message = {
      email,
      frn,
      errorMessage
    }
  })

  describe('When message is valid', () => {
    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toStrictEqual(message)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When message is missing email', () => {
    beforeEach(() => {
      delete message.email
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toStrictEqual(message)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When message is missing frn', () => {
    beforeEach(() => {
      delete message.frn
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toStrictEqual(message)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return string starting "FRN must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('FRN must be provided.')
    })
  })

  describe('When message is missing errorMessage', () => {
    beforeEach(() => {
      delete message.errorMessage
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toStrictEqual(message)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "An error message must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('An error message must be provided.')
    })
  })

  describe('When message is not given', () => {
    test('should return an object with 2 keys', () => {
      const result = schema.validate()
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
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

    test('should return "CRM message must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('CRM message must be provided.')
    })
  })

  describe('When message is ""', () => {
    beforeEach(() => {
      message = ''
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be an object.')
    })
  })

  describe('When message is 1', () => {
    beforeEach(() => {
      message = 1
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be an object.')
    })
  })

  describe('When message is []', () => {
    beforeEach(() => {
      message = []
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toStrictEqual('CRM message must be an object.')
    })
  })

  describe('When message is {}', () => {
    beforeEach(() => {
      message = []
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be an object.')
    })
  })

  describe('When message is null', () => {
    beforeEach(() => {
      message = null
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be an object.')
    })
  })

  describe('When message is undefined', () => {
    beforeEach(() => {
      message = undefined
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "CRM message must be provided." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be provided.')
    })
  })

  describe('When message is true', () => {
    beforeEach(() => {
      message = true
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be an object.')
    })
  })

  describe('When message is NaN', () => {
    beforeEach(() => {
      message = NaN
    })

    test('should return an object', async () => {
      const result = schema.validate(message)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(message)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return message as value for key: value', () => {
      const result = schema.validate(message)
      expect(result.value).toBe(message)
    })

    test('should return "object.base" as value for key: error.details[0].type', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].type).toBe('object.base')
    })

    test('should return "CRM message must be an object." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(message)
      expect(result.error.details[0].message).toBe('CRM message must be an object.')
    })
  })
})
