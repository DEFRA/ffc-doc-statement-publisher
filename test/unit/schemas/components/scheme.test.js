const { SHORT_NAMES } = require('../../../../app/constants/scheme-names')
const { LNR, LUMP_SUMS, SFI, SFI_PILOT, VET_VISITS } = SHORT_NAMES

const schema = require('../../../../app/schemas/components/scheme')

let scheme

describe('Scheme schema', () => {
  describe('When scheme is LNR', () => {
    beforeEach(() => {
      scheme = LNR
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toStrictEqual(scheme)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When scheme is LUMP_SUMS', () => {
    beforeEach(() => {
      scheme = LUMP_SUMS
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toStrictEqual(scheme)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When scheme is SFI', () => {
    beforeEach(() => {
      scheme = SFI
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toStrictEqual(scheme)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When scheme is SFI_PILOT', () => {
    beforeEach(() => {
      scheme = SFI_PILOT
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toStrictEqual(scheme)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When scheme is VET_VISITS', () => {
    beforeEach(() => {
      scheme = VET_VISITS
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 1 key', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('should return an object with keys: value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toStrictEqual(scheme)
    })

    test('should not return an object with key: error', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).not.toContain('error')
    })
  })

  describe('When scheme is not a valid one', () => {
    beforeEach(() => {
      scheme = 'Invalid error message.'
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return string starting "The scheme must be one of the following" as value for key: error.details[0].message', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is not given', () => {
    test('should return an object with 2 keys', () => {
      const result = schema.validate()
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
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

    test('should return "A scheme must be provided." as value for key: error.details[0].message', () => {
      const result = schema.validate()
      expect(result.error.details[0].message).toBe('A scheme must be provided.')
    })
  })

  describe('When scheme is ""', () => {
    beforeEach(() => {
      scheme = ''
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return string starting "The scheme must be one of the following" as value for key: error.details[0].message', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is 1', () => {
    beforeEach(() => {
      scheme = 1
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return string starting "The scheme must be one of the following" as value for key: error.details[0].message', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is []', () => {
    beforeEach(() => {
      scheme = []
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "scheme must be a string." as value for key: error.details[0].message', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is {}', () => {
    beforeEach(() => {
      scheme = []
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "scheme must be a string." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is null', () => {
    beforeEach(() => {
      scheme = null
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "scheme must be a string." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is undefined', () => {
    beforeEach(() => {
      scheme = undefined
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.required" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('should return "A scheme must be provided." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toBe('A scheme must be provided.')
    })
  })

  describe('When scheme is true', () => {
    beforeEach(() => {
      scheme = true
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "scheme must be a string." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })

  describe('When scheme is NaN', () => {
    beforeEach(() => {
      scheme = NaN
    })

    test('should return an object', async () => {
      const result = schema.validate(scheme)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 2 keys', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('should return an object with keys: error and value', () => {
      const result = schema.validate(scheme)
      expect(Object.keys(result)).toStrictEqual(['value', 'error'])
    })

    test('should return scheme as value for key: value', () => {
      const result = schema.validate(scheme)
      expect(result.value).toBe(scheme)
    })

    test('should return "any.only" as value for key: error.details[0].type', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].type).toBe('any.only')
    })

    test('should return "scheme must be a string." as value for key: error.details[0].message when frnLNRString', () => {
      const result = schema.validate(scheme)
      expect(result.error.details[0].message).toStrictEqual(expect.stringContaining('The scheme must be one of the following'))
    })
  })
})
