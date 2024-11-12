const config = require('../../../app/config')

jest.mock('notifications-node-client')
jest.mock('../../../app/retry')

const { NotifyClient } = require('notifications-node-client')
const { retry } = require('../../../app/retry')
const publishByLetter = require('../../../app/publishing/publish-by-letter')

const FILE_BUFFER = require('../../mocks/components/file_buffer')

describe('Publish by letter', () => {
  const prepareUploadMock = jest.fn()
  const sendLetterMock = jest.fn()
  const mockNotifyClientInstance = {
    prepareUpload: prepareUploadMock,
    sendLetter: sendLetterMock
  }

  beforeEach(() => {
    config.notifyApiKeyLetter = 'mockApiKey' // Mock the API key
    NotifyClient.mockImplementation(() => mockNotifyClientInstance)
    jest.clearAllMocks()
  })

  test('should instantiate NotifyClient with config.notifyApiKeyLetter', async () => {
    await publishByLetter(FILE_BUFFER)
    expect(NotifyClient).toHaveBeenCalledWith(config.notifyApiKeyLetter)
  })

  test('should call notifyClient.prepareUpload with correct arguments', async () => {
    prepareUploadMock.mockResolvedValueOnce('mockPdfFile')
    retry.mockResolvedValueOnce({ id: '12345' })

    await publishByLetter(FILE_BUFFER)

    expect(prepareUploadMock).toHaveBeenCalledWith(FILE_BUFFER)
  })

  test('should call retry with correct arguments', async () => {
    prepareUploadMock.mockResolvedValueOnce('mockPdfFile')
    const mockThunk = jest.fn()
    jest.spyOn(mockNotifyClientInstance, 'sendLetter').mockReturnValue(mockThunk)
    retry.mockResolvedValueOnce({ id: '12345' })

    await publishByLetter(FILE_BUFFER)

    expect(retry).toHaveBeenCalledWith(expect.any(Function), 3, 100, true)
  })

  test('should return result when retry succeeds', async () => {
    prepareUploadMock.mockResolvedValueOnce('mockPdfFile')
    const mockResult = { id: '12345' }
    retry.mockResolvedValueOnce(mockResult)

    const result = await publishByLetter(FILE_BUFFER)

    expect(result).toBe(mockResult)
  })

  test('should throw error and log it when retry fails', async () => {
    const error = new Error('Retry failed')
    prepareUploadMock.mockResolvedValueOnce('mockPdfFile')
    retry.mockRejectedValueOnce(error)
    console.log = jest.fn()

    await expect(publishByLetter(FILE_BUFFER)).rejects.toThrow(error)
    expect(console.log).toHaveBeenCalledWith(error)
  })
})
