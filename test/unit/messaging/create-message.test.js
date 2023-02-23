const createMessage = require('../../../app/messaging/create-message')

const body = 'Hello World!'
const { CRM: CRM_MESSAGE_TYPE } = require('../../../app/constants/message-types')

describe('create message', () => {
  test('should return an object', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(result).toBeInstanceOf(Object)
  })

  test('should return an object with 3 keys', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(Object.keys(result)).toHaveLength(3)
  })

  test('should return an object with keys: "body", "type" and "source"', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(Object.keys(result)).toStrictEqual(['body', 'type', 'source'])
  })

  test('should return the body key with value body', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(result.body).toStrictEqual(body)
  })

  test('should return the type key with value CRM_MESSAGE_TYPE', () => {
    const result = createMessage(body, CRM_MESSAGE_TYPE)
    expect(result.type).toStrictEqual(CRM_MESSAGE_TYPE)
  })
})
