jest.mock('@azure/storage-blob')
jest.mock('@azure/identity')

describe('storage', () => {
  let storage
  const mockstorage = {
    upload: jest.fn().mockResolvedValue({}),
    url: 'test-url',
    exists: jest.fn(),
    downloadToBuffer: jest.fn(),
    uploadStream: jest.fn().mockResolvedValue({})
  }

  const mockContainer = {
    createIfNotExists: jest.fn(),
    getBlockBlobClient: jest.fn().mockReturnValue(mockstorage)
  }

  const mockStorageConfig = {
    useConnectionStr: true,
    connectionStr: 'connection-string',
    createContainers: true,
    storageAccount: 'fakestorageaccount',
    managedIdentityClientId: 'fake-client-id',
    container: 'test-container',
    folder: 'test-folder',
    reportFolder: 'test-report-folder'
  }

  const mockBlobServiceClient = {
    getContainerClient: jest.fn().mockReturnValue(mockContainer)
  }

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    require('@azure/storage-blob').BlobServiceClient.fromConnectionString = jest
      .fn()
      .mockReturnValue(mockBlobServiceClient)

    require('@azure/storage-blob').BlobServiceClient.mockImplementation(() => mockBlobServiceClient)

    require('@azure/identity').DefaultAzureCredential.mockImplementation(() => ({}))

    jest.mock('../../app/config', () => ({
      storageConfig: mockStorageConfig
    }))

    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    storage = require('../../app/storage')
  })

  afterEach(() => {
    console.log.mockRestore()
    console.debug.mockRestore()
    console.error.mockRestore()
  })

  test('uses connection string when config.useConnectionStr is true', async () => {
    expect(require('@azure/storage-blob').BlobServiceClient.fromConnectionString)
      .toHaveBeenCalledWith(mockStorageConfig.connectionStr)
    expect(console.log).toHaveBeenCalledWith('Using connection string for BlobServiceClient')
  })

  test('uses DefaultAzureCredential when config.useConnectionStr is false', async () => {
    jest.resetModules()
    mockStorageConfig.useConnectionStr = false

    jest.mock('../../app/config', () => ({
      storageConfig: mockStorageConfig
    }))

    storage = require('../../app/storage')

    expect(require('@azure/identity').DefaultAzureCredential).toHaveBeenCalledWith({
      managedIdentityClientId: 'fake-client-id'
    })

    expect(require('@azure/storage-blob').BlobServiceClient).toHaveBeenCalledWith(
      `https://${mockStorageConfig.storageAccount}.blob.core.windows.net`,
      expect.any(Object)
    )

    expect(console.log).toHaveBeenCalledWith('Using DefaultAzureCredential for BlobServiceClient')
  })

  test('initializes containers if required', async () => {
    await storage.initialiseContainers()
    expect(mockContainer.createIfNotExists).toHaveBeenCalled()
  })

  test('gets outbound blob client', async () => {
    const result = await storage.getOutboundBlobClient('test-file.txt')
    expect(result.url).toBe('test-url')
    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('test-folder/test-file.txt')
  })

  test('logs message and creates container when createContainers is true', async () => {
    mockStorageConfig.createContainers = true
    await storage.initialiseContainers()

    expect(console.log).toHaveBeenCalledWith('Making sure blob containers exist')
    expect(mockContainer.createIfNotExists).toHaveBeenCalled()
  })

  test('does not create container when createContainers is false', async () => {
    mockStorageConfig.createContainers = false
    await storage.initialiseContainers()

    expect(console.log).not.toHaveBeenCalledWith('Making sure blob containers exist')
    expect(mockContainer.createIfNotExists).not.toHaveBeenCalled()
  })

  describe('when using managed identity', () => {
    test('creates blob service client with DefaultAzureCredential', () => {
      jest.resetModules()
      mockStorageConfig.useConnectionStr = false

      jest.mock('../../app/config', () => ({
        storageConfig: mockStorageConfig
      }))

      require('../../app/storage')

      expect(require('@azure/storage-blob').BlobServiceClient)
        .toHaveBeenCalledWith(
          `https://${mockStorageConfig.storageAccount}.blob.core.windows.net`,
          expect.any(Object)
        )
    })
  })

  describe('container initialization', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()

      require('@azure/storage-blob').BlobServiceClient.fromConnectionString = jest
        .fn()
        .mockReturnValue(mockBlobServiceClient)

      require('@azure/storage-blob').BlobServiceClient.mockImplementation(() => mockBlobServiceClient)

      jest.mock('../../app/config', () => ({
        storageConfig: mockStorageConfig
      }))

      storage = require('../../app/storage')
    })

    test('initializes folders on first call', async () => {
      await storage.getOutboundBlobClient('test.txt')

      expect(mockContainer.getBlockBlobClient).toHaveBeenNthCalledWith(1, 'test-folder/default.txt')
      expect(mockContainer.getBlockBlobClient).toHaveBeenNthCalledWith(2, 'test-report-folder/default.txt')
      expect(mockContainer.getBlockBlobClient).toHaveBeenNthCalledWith(3, 'test-folder/test.txt')
      expect(mockstorage.upload).toHaveBeenCalledWith('Placeholder', 'Placeholder'.length)
    })

    test('skips folder initialization on subsequent calls', async () => {
      await storage.initialiseContainers()
      await storage.getOutboundBlobClient('test.txt')

      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledTimes(3)
      expect(mockstorage.upload).toHaveBeenCalledTimes(2)
    })

    test('initializes containers when createContainers is true', async () => {
      mockStorageConfig.createContainers = true
      await storage.initialiseContainers()

      expect(mockContainer.createIfNotExists).toHaveBeenCalled()
      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('test-folder/default.txt')
    })

    test('skips container creation when createContainers is false', async () => {
      mockStorageConfig.createContainers = false
      await storage.initialiseContainers()

      expect(mockContainer.createIfNotExists).not.toHaveBeenCalled()
      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('test-folder/default.txt')
    })

    test('initializes folders if containersInitialised is false', async () => {
      await storage.initialiseContainers()
      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('test-folder/default.txt')
      expect(mockstorage.upload).toHaveBeenCalledTimes(2)
    })
  })

  describe('getFile', () => {
    test('downloads file when it exists', async () => {
      mockstorage.exists.mockResolvedValue(true)
      mockstorage.downloadToBuffer.mockResolvedValue(Buffer.from('file content'))

      const result = await storage.getFile('test.txt')

      expect(mockstorage.exists).toHaveBeenCalled()
      expect(mockstorage.downloadToBuffer).toHaveBeenCalled()
      expect(result).toEqual(Buffer.from('file content'))
    })

    test('throws error when file does not exist', async () => {
      mockstorage.exists.mockResolvedValue(false)

      await expect(storage.getFile('test.txt')).rejects.toThrow('File not found in blob storage: test.txt (container: test-container, folder: test-folder)')
      expect(mockstorage.exists).toHaveBeenCalled()
      expect(mockstorage.downloadToBuffer).not.toHaveBeenCalled()
    })
  })

  describe('saveReportFile', () => {
    let readableStream

    beforeEach(() => {
      readableStream = {
        on: jest.fn(),
        pipe: jest.fn()
      }
    })

    test('saves report file successfully with data', async () => {
      const filename = 'report.csv'
      const chunk = Buffer.from('chunk')
      readableStream.on.mockImplementation((event, callback) => {
        if (event === 'data') callback(chunk)
        if (event === 'end') callback()
      })

      await storage.saveReportFile(filename, readableStream)

      expect(console.log).toHaveBeenCalledWith('[STORAGE] Starting report file save:', filename)
      expect(console.debug).toHaveBeenCalledWith('[STORAGE] Received chunk:', chunk)
      expect(console.debug).toHaveBeenCalledWith('[STORAGE] Stream ended, had data:', true)
      expect(mockstorage.uploadStream).toHaveBeenCalledWith(
        readableStream,
        4 * 1024 * 1024,
        5,
        { blobHTTPHeaders: { blobContentType: 'text/csv' } }
      )
      expect(console.log).toHaveBeenCalledWith('[STORAGE] Upload completed')
    })

    test('saves report file successfully without data', async () => {
      const filename = 'empty-report.csv'
      readableStream.on.mockImplementation((event, callback) => {
        if (event === 'end') callback()
      })

      await storage.saveReportFile(filename, readableStream)

      expect(console.log).toHaveBeenCalledWith('[STORAGE] Starting report file save:', filename)
      expect(console.debug).toHaveBeenCalledWith('[STORAGE] Stream ended, had data:', false)
      expect(mockstorage.uploadStream).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('[STORAGE] Upload completed')
    })

    test('handles stream error', async () => {
      const filename = 'error-report.csv'
      const error = new Error('Stream error')
      readableStream.on.mockImplementation((event, callback) => {
        if (event === 'error') callback(error)
      })

      await expect(storage.saveReportFile(filename, readableStream)).rejects.toThrow('Stream error')

      expect(console.log).toHaveBeenCalledWith('[STORAGE] Starting report file save:', filename)
      expect(console.error).toHaveBeenCalledWith('[STORAGE] Stream error:', error)
    })

    test('handles upload error', async () => {
      const filename = 'upload-error-report.csv'
      const uploadError = new Error('Upload failed')
      mockstorage.uploadStream.mockRejectedValue(uploadError)
      readableStream.on.mockImplementation((event, callback) => {
        if (event === 'end') callback()
      })

      await expect(storage.saveReportFile(filename, readableStream)).rejects.toThrow('Upload failed')

      expect(console.log).toHaveBeenCalledWith('[STORAGE] Starting report file save:', filename)
      expect(console.error).toHaveBeenCalledWith('[STORAGE] Error saving report file:', uploadError)
    })
  })

  describe('getReportFile', () => {
    test('downloads report file', async () => {
      mockstorage.downloadToBuffer.mockResolvedValue(Buffer.from('report content'))

      const result = await storage.getReportFile('report.csv')

      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('test-report-folder/report.csv')
      expect(mockstorage.downloadToBuffer).toHaveBeenCalled()
      expect(result).toEqual(Buffer.from('report content'))
    })
  })
})
