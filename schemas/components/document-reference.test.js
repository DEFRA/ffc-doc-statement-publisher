const DOCUMENT_REFERENCE = require('../../test/mocks/components/document-reference')

const schema = require('../../app/schemas/components/document-reference')

describe('document reference schema', () => {
  describe.each([
    { name: 'DOCUMENT_REFERENCE', value: DOCUMENT_REFERENCE, expected: DOCUMENT_REFERENCE },
    { name: 'string DOCUMENT_REFERENCE', value: String(DOCUMENT_REFERENCE), expected: DOCUMENT_REFERENCE },
    { name: '1.0', value: 1.0, expected: 1.0 },
    { name: '"1.0"', value: '1.0', expected: 1.0 }
  ])('when document reference is $name', ({ name, value, expected }) => {
    test('returns an object', () => {
      const result = schema.validate(value)
      expect(result).toBeInstanceOf(Object)
    })

    test('returns an object with 1 key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toHaveLength(1)
    })

    test('returns an object with "value" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('value')
    })

    test(`returns ${expected} for key "value"`, () => {
      const result = schema.validate(value)
      expect(result.value).toBe(expected)
    })
  })

  describe.each([
    { name: '0', value: 0, expected: 0 },
    { name: '"0"', value: '0', expected: 0 },
    { name: '-1', value: -1, expected: -1 },
    { name: '"-1"', value: '-1', expected: -1 }
  ])('when document reference is $name', ({ name, value, expected }) => {
    test('returns an object', () => {
      const result = schema.validate(value)
      expect(result).toBeInstanceOf(Object)
    })

    test('returns an object with 2 keys', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('returns an object with "value" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('value')
    })

    test(`returns ${expected} for key "value"`, () => {
      const result = schema.validate(value)
      expect(result.value).toBe(expected)
    })

    test('returns an object with "error" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('error')
    })

    test('returns an Error for key "error"', () => {
      const result = schema.validate(value)
      expect(result.error).toBeInstanceOf(Error)
    })

    test('returns an object with 4 keys for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toHaveLength(4)
    })

    test('returns an object with "type" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('type')
    })

    test('returns "number.positive" for key "error.details[0].type"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].type).toBe('number.positive')
    })

    test('returns an object with "message" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('message')
    })

    test('returns "The document reference must be a number greater than 0." for key "error.details[0].message"', () => {
      const result = schema.validate(value)
      console.log(result)
      console.log(result.error)
      expect(result.error.details[0].message).toBe('The document reference must be a number greater than 0.')
    })
  })

  describe.each([
    { name: '1.1', value: 1.1, expected: 1.1 },
    { name: '"1.1"', value: '1.1', expected: 1.1 }
  ])('when document reference is $name', ({ name, value, expected }) => {
    test('returns an object', () => {
      const result = schema.validate(value)
      expect(result).toBeInstanceOf(Object)
    })

    test('returns an object with 2 keys', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('returns an object with "value" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('value')
    })

    test(`returns ${expected} for key "value"`, () => {
      const result = schema.validate(value)
      expect(result.value).toBe(expected)
    })

    test('returns an object with "error" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('error')
    })

    test('returns an Error for key "error"', () => {
      const result = schema.validate(value)
      expect(result.error).toBeInstanceOf(Error)
    })

    test('returns an object with 4 keys for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toHaveLength(4)
    })

    test('returns an object with "type" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('type')
    })

    test('returns "number.integer" for key "error.details[0].type"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].type).toBe('number.integer')
    })

    test('returns an object with "message" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('message')
    })

    test('returns "The document reference must be an integer." for key "error.details[0].message"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].message).toBe('The document reference must be an integer.')
    })
  })

  describe.each([
    { name: '""', value: '', expected: '' },
    { name: '"a"', value: 'a', expected: 'a' },
    { name: 'false', value: false, expected: false },
    { name: 'true', value: true, expected: true },
    { name: 'null', value: null, expected: null }
  ])('when document reference is $name', ({ name, value, expected }) => {
    test('returns an object', () => {
      const result = schema.validate(value)
      expect(result).toBeInstanceOf(Object)
    })

    test('returns an object with 2 keys', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('returns an object with "value" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('value')
    })

    test(`returns ${expected} for key "value"`, () => {
      const result = schema.validate(value)
      expect(result.value).toBe(expected)
    })

    test('returns an object with "error" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('error')
    })

    test('returns an Error for key "error"', () => {
      const result = schema.validate(value)
      expect(result.error).toBeInstanceOf(Error)
    })

    test('returns an object with 4 keys for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toHaveLength(4)
    })

    test('returns an object with "type" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('type')
    })

    test('returns "number.base" for key "error.details[0].type"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('returns an object with "message" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('message')
    })

    test('returns "The document reference must be a number." for key "error.details[0].message"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].message).toBe('The document reference must be a number.')
    })
  })

  describe.each([
    { name: '[]', value: [], expected: [] },
    { name: '{}', value: {}, expected: {} }
  ])('when document reference is $name', ({ name, value, expected }) => {
    test('returns an object', () => {
      const result = schema.validate(value)
      expect(result).toBeInstanceOf(Object)
    })

    test('returns an object with 2 keys', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('returns an object with "value" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('value')
    })

    test(`returns ${expected} for key "value"`, () => {
      const result = schema.validate(value)
      expect(result.value).toStrictEqual(expected)
    })

    test('returns an object with "error" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('error')
    })

    test('returns an Error for key "error"', () => {
      const result = schema.validate(value)
      expect(result.error).toBeInstanceOf(Error)
    })

    test('returns an object with 4 keys for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toHaveLength(4)
    })

    test('returns an object with "type" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('type')
    })

    test('returns "number.base" for key "error.details[0].type"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].type).toBe('number.base')
    })

    test('returns an object with "message" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('message')
    })

    test('returns "The document reference must be a number." for key "error.details[0].message"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].message).toBe('The document reference must be a number.')
    })
  })

  describe.each([
    { name: 'undefined', value: undefined, expected: undefined }
  ])('when document reference is $name', ({ name, value, expected }) => {
    test('returns an object', () => {
      const result = schema.validate(value)
      expect(result).toBeInstanceOf(Object)
    })

    test('returns an object with 2 keys', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toHaveLength(2)
    })

    test('returns an object with "value" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('value')
    })

    test(`returns ${expected} for key "value"`, () => {
      const result = schema.validate(value)
      expect(result.value).toBe(expected)
    })

    test('returns an object with "error" key', () => {
      const result = schema.validate(value)
      expect(Object.keys(result)).toContain('error')
    })

    test('returns an Error for key "error"', () => {
      const result = schema.validate(value)
      expect(result.error).toBeInstanceOf(Error)
    })

    test('returns an object with 4 keys for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toHaveLength(4)
    })

    test('returns an object with "type" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('type')
    })

    test('returns "any.required" for key "error.details[0].type"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].type).toBe('any.required')
    })

    test('returns an object with "message" key for key "error.details[0]"', () => {
      const result = schema.validate(value)
      expect(Object.keys(result.error.details[0])).toContain('message')
    })

    test('returns "The document reference is required." for key "error.details[0].message"', () => {
      const result = schema.validate(value)
      expect(result.error.details[0].message).toBe('The document reference is required.')
    })
  })
})
