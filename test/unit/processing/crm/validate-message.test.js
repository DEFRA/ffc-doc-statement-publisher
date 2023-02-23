const mockValidation = jest.fn()
jest.mock('../../../../app/schemas/objects/crm', () => {
  return {
    validate: mockValidation
  }
})

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

    test('should call mockValidation', async () => {
      validateMessage(message)
      expect(mockValidation).toHaveBeenCalled()
    })

    test('should call mockValidation once', async () => {
      validateMessage(message)
      expect(mockValidation).toHaveBeenCalledTimes(1)
    })

    test('should call mockValidation with message and { abortEarly: false }', async () => {
      validateMessage(message)
      expect(mockValidation).toHaveBeenCalledWith(message, { abortEarly: false })
    })

    test('should not throw', async () => {
      const wrapper = () => { validateMessage(message) }
      expect(wrapper).not.toThrow()
    })

    test('should return mockValidation().value', async () => {
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

    test('should call mockValidation', async () => {
      try { validateMessage(message) } catch {}
      expect(mockValidation).toHaveBeenCalled()
    })

    test('should call mockValidation once', async () => {
      try { validateMessage(message) } catch {}
      expect(mockValidation).toHaveBeenCalledTimes(1)
    })

    test('should call mockValidation with message and { abortEarly: false }', async () => {
      try { validateMessage(message) } catch {}
      expect(mockValidation).toHaveBeenCalledWith(message, { abortEarly: false })
    })

    test('should throw', async () => {
      const wrapper = () => { validateMessage(message) }
      expect(wrapper).toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = () => { validateMessage(message) }
      expect(wrapper).toThrow(Error)
    })

    test('should throw error which starts "Invalid CRM details"', async () => {
      const wrapper = () => { validateMessage(message) }
      expect(wrapper).toThrow(/^Invalid CRM details/)
    })
  })
})
