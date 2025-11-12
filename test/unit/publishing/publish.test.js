const { EMAIL, LETTER } = require('../../../app/constants/methods')
const publish = require('../../../app/publishing/publish')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const publishByLetter = require('../../../app/publishing/publish-by-letter')
const { getFile } = require('../../../app/storage')
const { retry } = require('../../../app/retry')

jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/publishing/publish-by-letter')
jest.mock('../../../app/storage', () => ({
  getFile: jest.fn().mockResolvedValue(Buffer.from('Some random bytes'))
}))
jest.mock('../../../app/retry', () => ({
  retry: jest.fn()
}))

describe('publish', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('rejects promise if publishByEmail fails', async () => {
    publishByEmail.mockRejectedValue('Error')
    await expect(publish(null, null, null, null, EMAIL)).rejects.toBe('Error')
  })

  test.each([
    ['EMAIL', EMAIL, publishByEmail, 'Email sent', { email: 'test@example.com', personalisation: { name: 'John' } }],
    ['LETTER', LETTER, publishByLetter, 'Letter sent', { email: null, personalisation: null }]
  ])(
    'publishes by %s type',
    async (_, type, publishFn, expectedResult, params) => {
      const template = `${type}-Template`
      const filename = 'file.pdf'
      const file = Buffer.from('Some random bytes')

      retry.mockImplementation(fn => fn())
      getFile.mockResolvedValue(file)
      publishFn.mockResolvedValue(expectedResult)

      const result = await publish(template, params.email, filename, params.personalisation, type)

      expect(retry).toHaveBeenCalledWith(expect.any(Function))
      expect(getFile).toHaveBeenCalledWith(filename)
      if (type === EMAIL) {
        expect(publishByEmail).toHaveBeenCalledWith(template, params.email, file, params.personalisation)
      } else {
        expect(publishByLetter).toHaveBeenCalledWith(filename, file)
      }
      expect(result).toBe(expectedResult)
    }
  )

  test('returns null for unsupported publishStatementType', async () => {
    const result = await publish('template', 'email', 'filename', {}, 'UNSUPPORTED_TYPE')
    expect(result).toBeNull()
  })

  test('throws if getFile rejects', async () => {
    getFile.mockRejectedValue(new Error('File not found'))
    await expect(publish('template', 'email', 'filename.pdf', {}, EMAIL))
      .rejects.toThrow('File not found')
  })
})
