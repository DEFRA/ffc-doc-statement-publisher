jest.mock('../../../../app/processing/crm/map-error-message')
const mapErrorMessage = require('../../../../app/processing/crm/map-error-message')
const mapMessage = require('../../../../app/processing/crm/map-message')
const { INVALID } = require('../../../../app/constants/crm-error-messages')
const { INVALID: INVALID_REASON } = require('../../../../app/constants/failure-reasons')

let email
let frn
let reason
let errorMessage

describe('createCRMInvalidEmailMessageFromIncomingMessage', () => {
  beforeEach(() => {
    mapErrorMessage.mockReturnValue(INVALID)
    frn = require('../../../mocks/components/frn')
    reason = INVALID_REASON
    errorMessage = INVALID
  })

  describe('whenEmailCouldntBeDeliveredAndEmailIsValid', () => {
    beforeEach(() => {
      email = require('../../../mocks/components/email')
    })

    test('should return an object', () => {
      const result = mapMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test.each([
      ['number of keys', (r) => expect(Object.keys(r)).toHaveLength(3)],
      ['keys are correct', (r) => expect(Object.keys(r)).toStrictEqual(['email', 'errorMessage', 'frn'])],
      ['email key', (r) => expect(r.email).toStrictEqual(email)],
      ['errorMessage key', (r) => expect(r.errorMessage).toStrictEqual(errorMessage)],
      ['frn key', (r) => expect(r.frn).toStrictEqual(frn)]
    ])('should check %s', (_, assertion) => {
      const result = mapMessage(email, frn, reason)
      assertion(result)
    })
  })

  describe('whenEmailCouldntBeDeliveredAndEmailIsEmpty', () => {
    beforeEach(() => {
      email = ''
    })

    test('should return an object', () => {
      const result = mapMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test.each([
      ['number of keys', (r) => expect(Object.keys(r)).toHaveLength(3)],
      ['keys are correct', (r) => expect(Object.keys(r)).toStrictEqual(['email', 'errorMessage', 'frn'])],
      ['email key', (r) => expect(r.email).toStrictEqual(email)],
      ['errorMessage key', (r) => expect(r.errorMessage).toStrictEqual(errorMessage)],
      ['frn key', (r) => expect(r.frn).toStrictEqual(frn)]
    ])('should check %s', (_, assertion) => {
      const result = mapMessage(email, frn, reason)
      assertion(result)
    })
  })

  describe('whenEmailCouldntBeDeliveredAndEmailIsInvalid', () => {
    beforeEach(() => {
      email = 'not-valid'
    })

    test('should return an object', () => {
      const result = mapMessage(email, frn, reason)
      expect(result).toBeInstanceOf(Object)
    })

    test.each([
      ['number of keys', (r) => expect(Object.keys(r)).toHaveLength(3)],
      ['keys are correct', (r) => expect(Object.keys(r)).toStrictEqual(['email', 'errorMessage', 'frn'])],
      ['email key', (r) => expect(r.email).toStrictEqual(email)],
      ['errorMessage key', (r) => expect(r.errorMessage).toStrictEqual(errorMessage)],
      ['frn key', (r) => expect(r.frn).toStrictEqual(frn)]
    ])('should check %s', (_, assertion) => {
      const result = mapMessage(email, frn, reason)
      assertion(result)
    })
  })
})
