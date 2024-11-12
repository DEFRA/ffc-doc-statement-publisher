const publish = require('../../../app/publishing/publish')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const publishByLetter = require('../../../app/publishing/publish-by-letter')
const { getFile } = require('../../../app/storage')
const { retry } = require('../../../app/retry')

jest.mock('../../../app/publishing/publish-by-email')
jest.mock('../../../app/publishing/publish-by-letter')
jest.mock('../../../app/storage')
jest.mock('../../../app/retry')

const template = 'template'
const email = 'test@example.com'
const filename = 'test-file.pdf'
const personalisation = { key: 'value' }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('publish', () => {
  test('should call publishByEmail when email is provided', async () => {
    const mockFile = Buffer.from('file-content')
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue(mockFile)
    publishByEmail.mockResolvedValue()

    await publish(template, email, filename, personalisation)

    expect(getFile).toHaveBeenCalledWith(filename)
    expect(retry).toHaveBeenCalled()
    expect(publishByEmail).toHaveBeenCalledWith(template, email, mockFile, personalisation)
    expect(publishByLetter).not.toHaveBeenCalled()
  })

  test('should call publishByLetter when email is not provided', async () => {
    const mockFile = Buffer.from('file-content')
    retry.mockImplementation(fn => fn())
    getFile.mockResolvedValue(mockFile)
    publishByLetter.mockResolvedValue()

    await publish(null, null, filename, null)

    expect(getFile).toHaveBeenCalledWith(filename)
    expect(retry).toHaveBeenCalled()
    expect(publishByLetter).toHaveBeenCalledWith(filename, mockFile)
    expect(publishByEmail).not.toHaveBeenCalled()
  })

  test('should handle errors from getFile and retry', async () => {
    const error = new Error('File not found')
    getFile.mockRejectedValue(error)
    retry.mockImplementation(fn => {
      return fn().catch(() => { throw error })
    })

    await expect(publish(template, email, filename, personalisation)).rejects.toThrow('File not found')
    expect(getFile).toHaveBeenCalledWith(filename)
    expect(retry).toHaveBeenCalled()
    expect(publishByEmail).not.toHaveBeenCalled()
    expect(publishByLetter).not.toHaveBeenCalled()
  })

  test('should handle missing filename gracefully', async () => {
    await expect(publish(template, email, null, personalisation)).rejects.toThrow('File not found')
    expect(publishByEmail).not.toHaveBeenCalled()
    expect(publishByLetter).not.toHaveBeenCalled()
  })

  test('should handle retries correctly', async () => {
    const mockFile = Buffer.from('file-content')
    let retryCount = 0
    getFile.mockResolvedValue(mockFile)
    publishByEmail.mockImplementation(async () => {
      retryCount++
      if (retryCount < 2) {
        throw new Error('Temporary error')
      }
    })

    try {
      await publish(template, email, filename, personalisation)
    } catch (error) {
      expect(error.message).toBe('Temporary error')
    }

    expect(retry).toHaveBeenCalled()
    expect(getFile).toHaveBeenCalledWith(filename)
    expect(publishByEmail).toHaveBeenCalledTimes(1)
    expect(publishByEmail).toHaveBeenCalledWith(template, email, mockFile, personalisation)
    expect(publishByLetter).not.toHaveBeenCalled()
    expect(retryCount).toBe(1)
  })
})
