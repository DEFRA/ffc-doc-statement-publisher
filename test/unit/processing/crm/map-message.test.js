jest.mock('../../../../app/processing/crm/map-error-message')
const mapErrorMessage = require('../../../../app/processing/crm/map-error-message')
jest.mock('../../../../app/processing/crm/map-message')
const mapMessage = require('../../../../app/processing/crm/map-message')
const { INVALID } = require('../../../../app/constants/crm-error-messages')
const { INVALID: INVALID_REASON, EMPTY, REJECTED } = require('../../../../app/constants/failure-reasons')

let email
let frn

describe('Create CRM invalid email message from incoming message', () => {
  beforeEach(() => {
    frn = require('../../../mocks/components/frn')
    jest.clearAllMocks()
  })

  const testCases = [
    { description: 'reason is INVALID', reason: INVALID_REASON, errorMessage: INVALID, email: require('../../../mocks/components/email') },
    { description: 'reason is EMPTY', reason: EMPTY, errorMessage: require('../../../../app/constants/crm-error-messages').EMPTY, email: require('../../../mocks/components/email') },
    { description: 'reason is REJECTED', reason: REJECTED, errorMessage: INVALID, email: require('../../../mocks/components/email') }
  ]

  testCases.forEach(({ description, reason, errorMessage, email: caseEmail }) => {
    describe(`When ${description}`, () => {
      beforeEach(() => {
        email = caseEmail
        mapErrorMessage.mockReturnValue(errorMessage)
      })

      test('should call mapMessage with correct arguments', () => {
        mapMessage(email, frn, reason)
        expect(mapMessage).toBeDefined()
      })

      test('should return an object with 3 keys', () => {
        const result = mapMessage(email, frn, reason)
        expect(result).toBeInstanceOf(Object)
        expect(Object.keys(result)).toHaveLength(3)
        expect(Object.keys(result)).toStrictEqual(['email', 'errorMessage', 'frn'])
      })

      test('should return correct values', () => {
        const result = mapMessage(email, frn, reason)
        expect(result.email).toStrictEqual(email)
        expect(result.frn).toStrictEqual(frn)
        expect(result.errorMessage).toStrictEqual(errorMessage)
      })
    })
  })

  describe('When validateMessage throws', () => {
    beforeEach(() => {
      mapMessage.mockImplementation(() => { throw new Error('Invalid message') })
    })

    test('should throw error "Invalid message"', () => {
      const wrapper = () => mapMessage(email, frn, INVALID_REASON)
      expect(wrapper).toThrow(/^Invalid message$/)
      expect(wrapper).toThrow(Error)
    })
  })
})
