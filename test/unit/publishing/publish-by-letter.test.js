const config = require('../../../app/config')
const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')
const publishByLetter = require('../../../app/publishing/publish-by-letter')
const { retry } = require('../../../app/retry')

const EMAIL = require('../../mocks/components/email')
const FILE = require('../../mocks/components/filename')
const FILE_BUFFER = require('../../mocks/components/file_buffer')
const POSTAGE = require('../../mocks/components/postage')

jest.mock('../../../app/retry', () => {
  const originalModule = jest.requireActual('../../../app/retry')
  return {
    ...originalModule,
    retry: jest.fn((...args) => originalModule.retry(...args))
  }
})

describe('Publish by letter', () => {
  let retrySpy

  beforeEach(() => {
    retrySpy = require('../../../app/retry').retry
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call mockNotifyClient', async () => {
    await publishByLetter(FILE, EMAIL)
    expect(mockNotifyClient).toHaveBeenCalled()
  })

  test('should call mockNotifyClient once', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient with config.notifyApiKey', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient).toHaveBeenCalledWith(config.notifyApiKey)
  })

  test('should call mockNotifyClient.sendPrecompiledLetter', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient().sendPrecompiledLetter).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.sendPrecompiledLetter once', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient().sendPrecompiledLetter).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient.sendPrecompiledLetter with FILE, FILE_BUFFER and default POSTAGE value "second"', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient().sendPrecompiledLetter).toHaveBeenCalledWith(FILE, FILE_BUFFER, POSTAGE)
  })

  test('should return mockNotifyClient.sendPrecompiledLetter', async () => {
    const result = await publishByLetter(FILE, FILE_BUFFER)
    expect(result).toBe(await mockNotifyClient().sendPrecompiledLetter())
  })

  test('should retry the letter request on failure', async () => {
    const error = new Error('Test error')
    mockNotifyClient().sendPrecompiledLetter.mockRejectedValueOnce(error).mockResolvedValueOnce('Letter sent')

    await expect(publishByLetter(FILE, FILE_BUFFER)).resolves.toBe('Letter sent')
    expect(retrySpy).toHaveBeenCalled()
    expect(retrySpy).toHaveBeenCalledWith(expect.any(Function), 3, 100, true)
  })

  test('should fail after retrying the letter request three times', async () => {
    const error = new Error('Test error')
    mockNotifyClient().sendPrecompiledLetter.mockRejectedValue(error)

    await expect(publishByLetter(FILE, FILE_BUFFER)).rejects.toThrow('Test error')
    expect(retrySpy).toHaveBeenCalled()
    expect(retrySpy).toHaveBeenCalledWith(expect.any(Function), 3, 100, true)
  })
})
