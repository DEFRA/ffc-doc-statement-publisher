jest.mock('../../../../app/processing/crm/map-message')
const mapMessage = require('../../../../app/processing/crm/map-message')

jest.mock('../../../../app/processing/crm/validate-message')
const validateMessage = require('../../../../app/processing/crm/validate-message')

const getMessage = require('../../../../app/processing/crm/get-message')

const { EMPTY, INVALID, REJECTED } = require('../../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../../app/constants/crm-error-messages')

const { EMPTY_MAPPED: EMPTY_MESSAGE, INVALID_MAPPED: INVALID_MESSAGE } = require('../../../mocks/messages/crm')

let email
let frn
let reason
let errorMessage

describe('Create CRM invalid email message from incoming message', () => {
  beforeEach(() => {
    email = require('../../../mocks/components/email')
    frn = require('../../../mocks/components/frn')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When reason is EMPTY', () => {
    beforeEach(() => {
      reason = EMPTY
      errorMessage = EMPTY_ERROR

      mapMessage.mockReturnValue(EMPTY_MESSAGE)
      validateMessage.mockReturnValue(EMPTY_MESSAGE)
    })

    test('should call mapMessage', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalled()
    })

    test('should call mapMessage once', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledTimes(1)
    })

    test('should call mapMessage with email, frn and reason', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call validateMessage', () => {
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalled()
    })

    test('should call validateMessage once', () => {
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledTimes(1)
    })

    test('should call validateMessage with mapMessage return value', () => {
      const message = mapMessage()
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledWith(message)
    })

    test('should not throw', () => {
      const wrapper = () => { getMessage(email, frn, reason) }
      expect(wrapper).not.toThrow()
    })

    test('should return an object', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 3 keys', () => {
      const result = getMessage(email, frn, reason)
      expect(Object.keys(result)).toHaveLength(3)
    })

    test('should return an object with keys: "email", "errorMessage" and "frn"', () => {
      const result = getMessage(email, frn, reason)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
    })

    test('should return the email key with value email', () => {
      const result = getMessage(email, frn, reason)
      expect(result.email).toStrictEqual(email)
    })

    test('should return the errorMessage key with value errorMessage', () => {
      const result = getMessage(email, frn, reason)
      expect(result.errorMessage).toStrictEqual(errorMessage)
    })

    test('should return the frn key with value frn', () => {
      const result = getMessage(email, frn, reason)
      expect(result.frn).toStrictEqual(frn)
    })

    test('should return EMPTY_MESSAGE', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toStrictEqual(EMPTY_MESSAGE)
    })
  })

  describe('When reason is INVALID', () => {
    beforeEach(() => {
      reason = INVALID
      errorMessage = INVALID_ERROR

      mapMessage.mockReturnValue(INVALID_MESSAGE)
      validateMessage.mockReturnValue(INVALID_MESSAGE)
    })

    test('should call mapMessage', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalled()
    })

    test('should call mapMessage once', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledTimes(1)
    })

    test('should call mapMessage with email, frn and reason', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call validateMessage', () => {
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalled()
    })

    test('should call validateMessage once', () => {
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledTimes(1)
    })

    test('should call validateMessage with mapMessage return value', () => {
      const message = mapMessage()
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledWith(message)
    })

    test('should not throw', () => {
      const wrapper = () => { getMessage(email, frn, reason) }
      expect(wrapper).not.toThrow()
    })

    test('should return an object', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 3 keys', () => {
      const result = getMessage(email, frn, reason)
      expect(Object.keys(result)).toHaveLength(3)
    })

    test('should return an object with keys: "email", "errorMessage" and "frn"', () => {
      const result = getMessage(email, frn, reason)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
    })

    test('should return the email key with value email', () => {
      const result = getMessage(email, frn, reason)
      expect(result.email).toStrictEqual(email)
    })

    test('should return the errorMessage key with value errorMessage', () => {
      const result = getMessage(email, frn, reason)
      expect(result.errorMessage).toStrictEqual(errorMessage)
    })

    test('should return the frn key with value frn', () => {
      const result = getMessage(email, frn, reason)
      expect(result.frn).toStrictEqual(frn)
    })

    test('should return INVALID_MESSAGE', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toStrictEqual(INVALID_MESSAGE)
    })
  })

  describe('When reason is REJECTED', () => {
    beforeEach(() => {
      reason = REJECTED
      errorMessage = INVALID_ERROR

      mapMessage.mockReturnValue(INVALID_MESSAGE)
      validateMessage.mockReturnValue(INVALID_MESSAGE)
    })

    test('should call mapMessage', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalled()
    })

    test('should call mapMessage once', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledTimes(1)
    })

    test('should call mapMessage with email, frn and reason', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call validateMessage', () => {
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalled()
    })

    test('should call validateMessage once', () => {
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledTimes(1)
    })

    test('should call validateMessage with mapMessage return value', () => {
      const message = mapMessage()
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledWith(message)
    })

    test('should not throw', () => {
      const wrapper = () => { getMessage(email, frn, reason) }
      expect(wrapper).not.toThrow()
    })

    test('should return an object', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test('should return an object with 3 keys', () => {
      const result = getMessage(email, frn, reason)
      expect(Object.keys(result)).toHaveLength(3)
    })

    test('should return an object with keys: "email", "errorMessage" and "frn"', () => {
      const result = getMessage(email, frn, reason)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
    })

    test('should return the email key with value email', () => {
      const result = getMessage(email, frn, reason)
      expect(result.email).toStrictEqual(email)
    })

    test('should return the errorMessage key with value errorMessage', () => {
      const result = getMessage(email, frn, reason)
      expect(result.errorMessage).toStrictEqual(errorMessage)
    })

    test('should return the frn key with value frn', () => {
      const result = getMessage(email, frn, reason)
      expect(result.frn).toStrictEqual(frn)
    })

    test('should return INVALID_MESSAGE', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toStrictEqual(INVALID_MESSAGE)
    })
  })

  describe('When validateMessage throws', () => {
    beforeEach(() => {
      validateMessage.mockImplementation(() => { throw new Error('Invalid message') })
    })

    test('should call mapMessage', () => {
      try { getMessage(email, frn, reason) } catch {}
      expect(mapMessage).toHaveBeenCalled()
    })

    test('should call mapMessage once', () => {
      try { getMessage(email, frn, reason) } catch {}
      expect(mapMessage).toHaveBeenCalledTimes(1)
    })

    test('should call mapMessage with email, frn and reason', () => {
      try { getMessage(email, frn, reason) } catch {}
      expect(mapMessage).toHaveBeenCalledWith(email, frn, reason)
    })

    test('should call validateMessage', () => {
      try { getMessage(email, frn, reason) } catch {}
      expect(validateMessage).toHaveBeenCalled()
    })

    test('should call validateMessage once', () => {
      try { getMessage(email, frn, reason) } catch {}
      expect(validateMessage).toHaveBeenCalledTimes(1)
    })

    test('should call validateMessage with mapMessage return value', () => {
      const message = mapMessage()
      try { getMessage(email, frn, reason) } catch {}
      expect(validateMessage).toHaveBeenCalledWith(message)
    })

    test('should throw', () => {
      const wrapper = () => { getMessage(email, frn, reason) }
      expect(wrapper).toThrow()
    })

    test('should throw Error', () => {
      const wrapper = () => { getMessage(email, frn, reason) }
      expect(wrapper).toThrow(Error)
    })

    test('should throw error "Invalid message"', () => {
      const wrapper = () => { getMessage(email, frn, reason) }
      expect(wrapper).toThrow(/^Invalid message$/)
    })
  })
})
