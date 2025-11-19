const mapErrorMessage = require('../../../../app/processing/crm/map-error-message')
const { EMPTY, INVALID, REJECTED } = require('../../../../app/constants/failure-reasons')
const { EMPTY: EMPTY_ERROR, INVALID: INVALID_ERROR } = require('../../../../app/constants/crm-error-messages')

describe('Map failure reason to CRM error message', () => {
  const cases = [
    { reason: EMPTY, expected: EMPTY_ERROR },
    { reason: INVALID, expected: INVALID_ERROR },
    { reason: REJECTED, expected: INVALID_ERROR },
    { reason: 'Not a valid failure reason', expected: '' }
  ]

  describe.each(cases)('When reason is $reason', ({ reason, expected }) => {
    test(`should return "${expected}"`, () => {
      expect(mapErrorMessage(reason)).toBe(expected)
    })
  })
})
