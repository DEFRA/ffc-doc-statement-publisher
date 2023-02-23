const mockValidation = jest.fn()
jest.mock('../../../app/schemas/components/email', () => {
  return {
    validate: mockValidation
  }
})

const validateEmail = require('../../../app/publishing/validate-email')

let email

describe('Validate email', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When email is valid', () => {
    beforeEach(() => {
      email = require('../../mocks/components/email')

      mockValidation.mockReturnValue({ value: email })
    })

    test('should call mockValidation', async () => {
      validateEmail(email)
      expect(mockValidation).toHaveBeenCalled()
    })

    test('should call mockValidation once', async () => {
      validateEmail(email)
      expect(mockValidation).toHaveBeenCalledTimes(1)
    })

    test('should call mockValidation with email and { abortEarly: false }', async () => {
      validateEmail(email)
      expect(mockValidation).toHaveBeenCalledWith(email, { abortEarly: false })
    })

    test('should not throw', async () => {
      const wrapper = () => { validateEmail(email) }
      expect(wrapper).not.toThrow()
    })

    test('should return mockValidation().value', async () => {
      const result = validateEmail(email)
      expect(result).toStrictEqual(mockValidation().value)
    })
  })

  describe('When email is invalid', () => {
    beforeEach(() => {
      email = ''

      mockValidation.mockReturnValue({
        value: email,
        error: { message: 'Invalid email' }
      })
    })

    test('should call mockValidation', async () => {
      try { validateEmail(email) } catch {}
      expect(mockValidation).toHaveBeenCalled()
    })

    test('should call mockValidation once', async () => {
      try { validateEmail(email) } catch {}
      expect(mockValidation).toHaveBeenCalledTimes(1)
    })

    test('should call mockValidation with email and { abortEarly: false }', async () => {
      try { validateEmail(email) } catch {}
      expect(mockValidation).toHaveBeenCalledWith(email, { abortEarly: false })
    })

    test('should throw', async () => {
      const wrapper = () => { validateEmail(email) }
      expect(wrapper).toThrow()
    })

    test('should throw Error', async () => {
      const wrapper = () => { validateEmail(email) }
      expect(wrapper).toThrow(Error)
    })

    test('should throw error which starts "Email is invalid"', async () => {
      const wrapper = () => { validateEmail(email) }
      expect(wrapper).toThrow(/^Email is invalid/)
    })
  })
})
