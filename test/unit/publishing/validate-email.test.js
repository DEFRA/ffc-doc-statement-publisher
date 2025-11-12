const mockValidation = jest.fn()
jest.mock('../../../app/schemas/components/email', () => ({ validate: mockValidation }))

const { validateEmail, isValidEmail } = require('../../../app/publishing/validate-email')

describe('Validate email', () => {
  afterEach(() => jest.clearAllMocks())

  describe.each([
    {
      description: 'valid email',
      email: require('../../mocks/components/email'),
      validationReturn: { value: 'test@example.com' },
      shouldThrow: false,
      isValidResult: true
    },
    {
      description: 'invalid email',
      email: '',
      validationReturn: { value: '', error: { message: 'Invalid email' } },
      shouldThrow: true,
      isValidResult: false
    }
  ])('When email is $description', ({ email, validationReturn, shouldThrow, isValidResult }) => {
    beforeEach(() => mockValidation.mockReturnValue(validationReturn))

    test.each([
      ['validateEmail', validateEmail],
      ['isValidEmail', isValidEmail]
    ])('%s should call mockValidation', (_, fn) => {
      if (shouldThrow && fn === validateEmail) {
        try { fn(email) } catch {}
      } else {
        fn(email)
      }
      expect(mockValidation).toHaveBeenCalled()
      expect(mockValidation).toHaveBeenCalledTimes(1)
      expect(mockValidation).toHaveBeenCalledWith(email, { abortEarly: false })
    })

    if (shouldThrow) {
      test('validateEmail should throw error starting with "Email is invalid"', () => {
        expect(() => validateEmail(email)).toThrow(/^Email is invalid/)
      })
    } else {
      test('validateEmail should return validated value', () => {
        expect(validateEmail(email)).toStrictEqual(validationReturn.value)
      })
    }

    test('isValidEmail should return correct boolean', () => {
      expect(isValidEmail(email)).toBe(isValidResult)
    })
  })
})
