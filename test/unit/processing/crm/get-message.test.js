jest.mock('../../../../app/processing/crm/map-message')
const mapMessage = require('../../../../app/processing/crm/map-message')

jest.mock('../../../../app/processing/crm/validate-message')
const validateMessage = require('../../../../app/processing/crm/validate-message')

const getMessage = require('../../../../app/processing/crm/get-message')

const { EMPTY, INVALID, REJECTED } = require('../../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../../app/constants/crm-error-messages')
const { EMPTY_MAPPED: EMPTY_MESSAGE, INVALID_MAPPED: INVALID_MESSAGE } = require('../../../mocks/messages/crm')

let email, frn

describe('getMessage', () => {
  beforeEach(() => {
    email = require('../../../mocks/components/email')
    frn = require('../../../mocks/components/frn')
    jest.clearAllMocks()
  })

  const reasonCases = [
    { reason: EMPTY, errorMessage: EMPTY_ERROR, mappedMessage: EMPTY_MESSAGE },
    { reason: INVALID, errorMessage: INVALID_ERROR, mappedMessage: INVALID_MESSAGE },
    { reason: REJECTED, errorMessage: INVALID_ERROR, mappedMessage: INVALID_MESSAGE }
  ]

  describe.each(reasonCases)('When reason is $reason', ({ reason, errorMessage, mappedMessage }) => {
    beforeEach(() => {
      mapMessage.mockReturnValue(mappedMessage)
      validateMessage.mockReturnValue(mappedMessage)
    })

    test('should call mapMessage with email, frn and reason', () => {
      getMessage(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledWith(email, frn, reason)
      expect(mapMessage).toHaveBeenCalledTimes(1)
    })

    test('should call validateMessage with mapMessage return value', () => {
      const message = mapMessage()
      getMessage(email, frn, reason)
      expect(validateMessage).toHaveBeenCalledWith(message)
      expect(validateMessage).toHaveBeenCalledTimes(1)
    })

    test('should return an object with correct keys and values', () => {
      const result = getMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
      expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
      expect(result.email).toBe(email)
      expect(result.frn).toBe(frn)
      expect(result.errorMessage).toBe(errorMessage)
      expect(result).toStrictEqual(mappedMessage)
    })

    test('should not throw', () => {
      expect(() => getMessage(email, frn, reason)).not.toThrow()
    })
  })

  describe('When validateMessage throws', () => {
    beforeEach(() => {
      validateMessage.mockImplementation(() => { throw new Error('Invalid message') })
      mapMessage.mockReturnValue(INVALID_MESSAGE)
    })

    test('should call mapMessage and validateMessage', () => {
      try { getMessage(email, frn, INVALID) } catch {}
      expect(mapMessage).toHaveBeenCalledWith(email, frn, INVALID)
      expect(validateMessage).toHaveBeenCalled()
    })

    test('should throw error "Invalid message"', () => {
      expect(() => getMessage(email, frn, INVALID)).toThrow(/^Invalid message$/)
      expect(() => getMessage(email, frn, INVALID)).toThrow(Error)
    })
  })
})
