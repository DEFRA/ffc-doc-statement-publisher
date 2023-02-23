const { TEMPORARY, PERMANENT } = require('../../../../app/constants/notify-simulation-email-addresses')

const schema = require('../../../../app/schemas/components/email')

let email

describe('Email schema', () => {
  describe('When email is a valid email address', () => {
    beforeEach(() => {
      email = require('../../../mocks/components/email')
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is Notify\'s test temporary failure email address', () => {
    beforeEach(() => {
      email = TEMPORARY
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is Notify\'s test permanent failure email address', () => {
    beforeEach(() => {
      email = PERMANENT
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is a valid email address with a period in the username', () => {
    beforeEach(() => {
      email = 'valid.username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is a valid email address with a comma in the username', () => {
    beforeEach(() => {
      email = 'valid.username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is a valid email address with a hyphen in the username', () => {
    beforeEach(() => {
      email = 'valid-username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is a valid email address with an inverted comma in the username', () => {
    beforeEach(() => {
      email = 'valid\'username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is a valid email address with a pair of inverted commas in the username', () => {
    beforeEach(() => {
      email = '\'validusername\'@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toStrictEqual(email)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When email is an invalid email address with a colon in the username', () => {
    beforeEach(() => {
      email = 'valid:username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: value, error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate()
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email is an invalid email address with a semi-colon in the username', () => {
    beforeEach(() => {
      email = 'valid;username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: value, error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate()
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email is an invalid email address with a speech mark in the username', () => {
    beforeEach(() => {
      email = 'valid"username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: value, error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate()
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email is an invalid email address with a pair of speech marks in the username', () => {
    beforeEach(() => {
      email = '"validusername"@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: value, error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate()
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email is an invalid email address with an at symbol in the username', () => {
    beforeEach(() => {
      email = 'valid@username@email.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: value, error', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate()
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email does not have a tld', () => {
    beforeEach(() => {
      email = 'email@domain'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "string.email" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('string.email')
    })

    test('should return "The email provided is invalid." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('The email provided is invalid.')
    })
  })

  describe('When email does not have a valid tld', () => {
    beforeEach(() => {
      email = 'email@domain.invalidtld'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "string.email" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('string.email')
    })

    test('should return "The email provided is invalid." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('The email provided is invalid.')
    })
  })

  describe('When email does not have a domain', () => {
    beforeEach(() => {
      email = 'email@.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "string.email" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('string.email')
    })

    test('should return "The email provided is invalid." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('The email provided is invalid.')
    })
  })

  describe('When email does not have a valid domain', () => {
    beforeEach(() => {
      email = 'email@invaliddomain.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return email as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBe(email)
    })
  })

  describe('When email does not have a username', () => {
    beforeEach(() => {
      email = '@gov.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "string.email" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('string.email')
    })

    test('should return "The email provided is invalid." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('The email provided is invalid.')
    })
  })

  describe('When email does not have a valid username', () => {
    beforeEach(() => {
      email = 'inv@lidusern@me@gov.com'
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "string.email" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('string.email')
    })

    test('should return "The email provided is invalid." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('The email provided is invalid.')
    })
  })

  describe('When email is not given', () => {
    test('should return an object with 2 keys', () => {
      const result = schema.validate()
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
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

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email is ""', () => {
    beforeEach(() => {
      email = ''
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "string.empty" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('string.empty')
    })

    test('should return "Email cannot be empty." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email cannot be empty.')
    })
  })

  describe('When email is 1', () => {
    beforeEach(() => {
      email = 1
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "alternatives.types" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('alternatives.types')
    })

    test('should return "Email must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be a string.')
    })
  })

  describe('When email is []', () => {
    beforeEach(() => {
      email = []
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "alternatives.types" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('alternatives.types')
    })

    test('should return "Email must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be a string.')
    })
  })

  describe('When email is {}', () => {
    beforeEach(() => {
      email = []
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "alternatives.types" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('alternatives.types')
    })

    test('should return "Email must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be a string.')
    })
  })

  describe('When email is null', () => {
    beforeEach(() => {
      email = null
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "alternatives.types" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('alternatives.types')
    })

    test('should return "Email must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be a string.')
    })
  })

  describe('When email is undefined', () => {
    beforeEach(() => {
      email = undefined
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "Email must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be provided.')
    })
  })

  describe('When email is true', () => {
    beforeEach(() => {
      email = true
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "alternatives.types" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('alternatives.types')
    })

    test('should return "Email must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be a string.')
    })
  })

  describe('When email is NaN', () => {
    beforeEach(() => {
      email = NaN
    })

    test('should return an object', async () => {
      const result = schema.validate(email)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(email)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return undefined as value for key: value', () => {
      const result = schema.validate(email)
      expect(result.value).toBeUndefined()
    })

    test('should return "alternatives.types" as value for key: error.details[0].type', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].type).toBe('alternatives.types')
    })

    test('should return "Email must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(email)
      expect(result.error.details[0].message).toBe('Email must be a string.')
    })
  })
})
