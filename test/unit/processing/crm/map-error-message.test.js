const mapErrorMessage = require('../../../../app/processing/crm/map-error-message')

const { EMPTY, INVALID, REJECTED } = require('../../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../../app/constants/crm-error-messages')

let reason

describe('Map failure reason to CRM error message', () => {
  describe('When reason is EMPTY', () => {
    beforeEach(() => {
      reason = EMPTY
    })

    test('should return EMPTY_ERROR', () => {
      const result = mapErrorMessage(reason)
      expect(result).toBe(EMPTY_ERROR)
    })
  })

  describe('When reason is INVALID', () => {
    beforeEach(() => {
      reason = INVALID
    })

    test('should return INVALID_ERROR', () => {
      const result = mapErrorMessage(reason)
      expect(result).toBe(INVALID_ERROR)
    })
  })

  describe('When reason is REJECTED', () => {
    beforeEach(() => {
      reason = REJECTED
    })

    test('should return INVALID_ERROR', () => {
      const result = mapErrorMessage(reason)
      expect(result).toBe(INVALID_ERROR)
    })
  })

  describe('When reason is not valid', () => {
    beforeEach(() => {
      reason = 'Not a valid failure reason'
    })

    test('should return ""', () => {
      const result = mapErrorMessage(reason)
      expect(result).toBe('')
    })
  })
})
