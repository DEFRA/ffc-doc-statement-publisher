const mockValidation = jest.fn()
jest.mock('../../../../app/schemas/objects/crm', () => ({
  validate: mockValidation
}))

const validateMessage = require('../../../../app/processing/crm/validate-message')

let message

describe('Validate CRM invalid email message', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When message is valid', () => {
    beforeEach(() => {
      mockValidation.mockReturnValue({ value: message })
    })

    test('should call mockValidation', () => {
      validateMessage(message)
      expect(mockValidation).toHaveBeenCalled()
    })

    test('should call mockValidation once', () => {
      validateMessage(message)
      expect(mockValidation).toHaveBeenCalledTimes(1)
    })

    test('should call mockValidation with message and { abortEarly: false }', () => {
      validateMessage(message)
      expect(mockValidation).toHaveBeenCalledWith(message, { abortEarly: false })
    })

    test('should not throw', () => {
      const wrapper = () => validateMessage(message)
      expect(wrapper).not.toThrow()
    })

    test('should return mockValidation().value', () => {
      const result = validateMessage(message)
      expect(result).toStrictEqual(mockValidation().value)
    })
  })

  describe('When message is invalid', () => {
    beforeEach(() => {
      mockValidation.mockReturnValue({
        value: message,
        error: { message: 'Invalid message' }
      })
    })

    test('should call mockValidation', () => {
      expect(() => validateMessage(message)).toThrow()
      expect(mockValidation).toHaveBeenCalled()
    })

    test('should call mockValidation once', () => {
      expect(() => validateMessage(message)).toThrow()
      expect(mockValidation).toHaveBeenCalledTimes(1)
    })

    test('should call mockValidation with message and { abortEarly: false }', () => {
      expect(() => validateMessage(message)).toThrow()
      expect(mockValidation).toHaveBeenCalledWith(message, { abortEarly: false })
    })

    test('should throw', () => {
      const wrapper = () => validateMessage(message)
      expect(wrapper).toThrow()
    })

    test('should throw Error', () => {
      const wrapper = () => validateMessage(message)
      expect(wrapper).toThrow(Error)
    })

    test('should throw error which starts "Invalid CRM details"', () => {
      const wrapper = () => validateMessage(message)
      expect(wrapper).toThrow(/^Invalid CRM details/)
    })
  })
})
