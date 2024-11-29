const { EMAIL, LETTER } = require('../../../app/constants/methods')
const publish = require('../../../app/publishing/publish')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const publishByLetter = require('../../../app/publishing/publish-by-letter')
const { getFile } = require('../../../app/storage')
const { retry } = require('../../../app/retry')
const fetchStatementFile = require('../../../app/publishing/fetch-statement-file')

jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/publishing/publish-by-letter')
jest.mock('../../../app/storage', () => ({
  getFile: jest.fn().mockResolvedValue(Buffer.from('Some random bytes'))
}))
jest.mock('../../../app/retry', () => ({
  retry: jest.fn()
}))
jest.mock('../../../app/publishing/fetch-statement-file')

describe('Publish document', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should return rejected promise', () => {
    publishByEmail.mockRejectedValue('Error')
    expect(publish(null, null, null, null))
      .rejects.toBe('Error')
  })

  test('Should publish by email when publishStatementType is EMAIL', async () => {
    const template = 'emailTemplate'
    const email = 'test@example.com'
    const filename = 'file.pdf'
    const personalisation = { name: 'John Doe' }
    const file = Buffer.from('Some random bytes')

    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue(file)
    publishByEmail.mockResolvedValue('Email sent')

    const result = await publish(template, email, filename, personalisation, EMAIL)

    expect(retry).toHaveBeenCalledWith(expect.any(Function))
    expect(getFile).toHaveBeenCalledWith(filename)
    expect(publishByEmail).toHaveBeenCalledWith(template, email, file, personalisation)
    expect(result).toBe('Email sent')
  })

  test('Should publish by letter when publishStatementType is LETTER', async () => {
    const template = 'letterTemplate'
    const email = 'test@example.com'
    const filename = 'file.pdf'
    const personalisation = { name: 'John Doe' }
    const file = Buffer.from('Some random bytes')

    retry.mockImplementation(fn => fn())
    fetchStatementFile.mockResolvedValue(file)
    publishByLetter.mockResolvedValue('Letter sent')

    const result = await publish(template, email, filename, personalisation, LETTER)

    expect(retry).toHaveBeenCalledWith(expect.any(Function))
    expect(fetchStatementFile).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`${filename}$`)))
    expect(publishByLetter).toHaveBeenCalledWith(filename, file)
    expect(result).toBe('Letter sent')
  })

  test('Should return null for unsupported publishStatementType', async () => {
    const result = await publish('template', 'email', 'filename', {}, 'UNSUPPORTED_TYPE')
    expect(result).toBeNull()
  })
})
