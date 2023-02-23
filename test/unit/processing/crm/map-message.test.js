jest.mock('../../../../app/processing/crm/map-error-message')
const mapErrorMessage = require('../../../../app/processing/crm/map-error-message')

const mapMessage = require('../../../../app/processing/crm/map-message')

const { INVALID } = require('../../../../app/constants/crm-error-messages')

let email
let frn
let reason
let errorMessage

describe('Create CRM invalid email message from incoming message', () => {
  beforeEach(() => {
    mapErrorMessage.mockReturnValue(INVALID)

    frn = require('../../../mocks/components/frn')
  })

  describe('When email couldn\'t be delivered and email is valid', () => {
    beforeEach(() => {
      mapErrorMessage.mockReturnValue(INVALID)

      email = require('../../../mocks/components/email')
      reason = require('../../../../app/constants/failure-reasons').INVALID
      errorMessage = require('../../../../app/constants/crm-error-messages').INVALID
    })

    test('should return an object', () => {
      const result = mapMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 3 keys', () => {
      const result = mapMessage(email, frn, reason)
      expect(Object.keys(result)).toHaveLength(3)
    })

    test('should return an object with keys: "email", "errorMessage" and "frn"', () => {
      const result = mapMessage(email, frn, reason)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
    })

    test('should return the email key with value email', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.email).toStrictEqual(email)
    })

    test('should return the errorMessage key with value errorMessage', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.errorMessage).toStrictEqual(errorMessage)
    })

    test('should return the frn key with value frn', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.frn).toStrictEqual(frn)
    })
  })

  describe('When email couldn\'t be delivered and email is valid', () => {
    beforeEach(() => {
      email = ''
    })

    test('should return an object', () => {
      const result = mapMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 3 keys', () => {
      const result = mapMessage(email, frn, reason)
      expect(Object.keys(result)).toHaveLength(3)
    })

    test('should return an object with keys: "email", "errorMessage" and "frn"', () => {
      const result = mapMessage(email, frn, reason)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
    })

    test('should return the email key with value email', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.email).toStrictEqual(email)
    })

    test('should return the errorMessage key with value errorMessage', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.errorMessage).toStrictEqual(errorMessage)
    })

    test('should return the frn key with value frn', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.frn).toStrictEqual(frn)
    })
  })

  describe('When email couldn\'t be delivered and email is invalid', () => {
    beforeEach(() => {
      email = 'not-valid'
    })

    test('should return an object', () => {
      const result = mapMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 3 keys', () => {
      const result = mapMessage(email, frn, reason)
      expect(Object.keys(result)).toHaveLength(3)
    })

    test('should return an object with keys: "email", "errorMessage" and "frn"', () => {
      const result = mapMessage(email, frn, reason)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
    })

    test('should return the email key with value email', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.email).toStrictEqual(email)
    })

    test('should return the errorMessage key with value errorMessage', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.errorMessage).toStrictEqual(errorMessage)
    })

    test('should return the frn key with value frn', () => {
      const result = mapMessage(email, frn, reason)
      expect(result.frn).toStrictEqual(frn)
    })
  })
})
