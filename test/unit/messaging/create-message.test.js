const createMessage = require('../../../app/messaging/create-message')
const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')

describe('createMessage', () => {
  const body = 'Hello World!'
  const expectedKeys = ['body', 'type', 'source']

  test('should return an object', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(result).toBeInstanceOf(Object)
  })

  test('should return an object with 3 keys', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(Object.keys(result)).toHaveLength(3)
  })

  test('should return an object with expected keys', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(Object.keys(result)).toStrictEqual(expectedKeys)
  })

  test.each([
    ['body', body],
    ['type', CRM_MESSAGE_TYPE]
  ])('should return key "%s" with correct value', (key, expected) => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(result[key]).toStrictEqual(expected)
  })
})
