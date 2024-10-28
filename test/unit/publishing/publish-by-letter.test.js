const config = require('../../../app/config')

const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')

const publishByLetter = require('../../../app/publishing/publish-by-email')

const EMAIL = require('../../mocks/components/email')
const FILE = require('../../mocks/components/filename')
const FILE_BUFFER = require('../../mocks/components/file_buffer')

describe('Publish by email', () => {
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

  test('should call mockNotifyClient.prepareUpload', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.sendPrecompiledLetter', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient().sendPrecompiledLetter).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.sendPrecompiledLetter once', async () => {
    await publishByLetter(FILE, FILE_BUFFER)
    expect(mockNotifyClient().sendPrecompiledLetter).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient.sendPrecompiledLetter with FILE, FILE_BUFFER and default postage value "second"', async () => {
    await publishByLetter(FILE, FILE_BUFFER)

    expect(mockNotifyClient().sendPrecompiledLetter).toHaveBeenCalledWith(FILE, FILE_BUFFER, 'second')
  })

  test('should return mockNotifyClient.sendPrecompiledLetter', async () => {
    const result = await publishByLetter(FILE, FILE_BUFFER)
    expect(result).toBe(await mockNotifyClient().sendPrecompiledLetter())
  })
})
