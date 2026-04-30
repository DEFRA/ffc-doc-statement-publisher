jest.mock('@azure/storage-blob')
jest.mock('@azure/identity')

describe('storage', () => {
  let storage

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

  const mockContainer = {
    createIfNotExists: jest.fn(),
    getBlockBlobClient: jest.fn()
  }

  const mockBlobServiceClient = {
    getContainerClient: jest.fn(() => mockContainer)
  }

  let blobClientMocksByPath

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    blobClientMocksByPath = new Map()

    mockContainer.getBlockBlobClient.mockImplementation((blobPath) => {
      if (!blobClientMocksByPath.has(blobPath)) {
        const mockBlobClient = {
          upload: jest.fn().mockResolvedValue({}),
          uploadStream: jest.fn().mockResolvedValue({}),
          exists: jest.fn(),
          downloadToBuffer: jest.fn(),
          deleteIfExists: jest.fn().mockResolvedValue({ succeeded: true }),
          url: 'test-url'
        }
        blobClientMocksByPath.set(blobPath, mockBlobClient)
      }
      return blobClientMocksByPath.get(blobPath)
    })

    require('@azure/storage-blob').BlobServiceClient.fromConnectionString = jest
      .fn()
      .mockReturnValue(mockBlobServiceClient)

    require('@azure/storage-blob').BlobServiceClient.mockImplementation(() => mockBlobServiceClient)

    require('@azure/identity').DefaultAzureCredential.mockImplementation(() => ({}))

    jest.mock('../../app/config', () => ({
      storageConfig: mockStorageConfig
    }))

    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'debug').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
    jest.spyOn(console, 'warn').mockImplementation(() => { })

    storage = require('../../app/storage')
  })

  afterEach(() => {
    console.log.mockRestore()
    console.debug.mockRestore()
    console.error.mockRestore()
    console.warn.mockRestore()
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
      expect(blobClientMocksByPath.get('test-folder/default.txt').upload).toHaveBeenCalledWith('Placeholder', 'Placeholder'.length)
      expect(blobClientMocksByPath.get('test-report-folder/default.txt').upload).toHaveBeenCalledWith('Placeholder', 'Placeholder'.length)
    })

    test('skips folder initialization on subsequent calls', async () => {
      await storage.initialiseContainers()
      await storage.getOutboundBlobClient('test.txt')

      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledTimes(3)
      expect(blobClientMocksByPath.get('test-folder/default.txt').upload).toHaveBeenCalledTimes(1)
      expect(blobClientMocksByPath.get('test-report-folder/default.txt').upload).toHaveBeenCalledTimes(1)
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
      expect(blobClientMocksByPath.get('test-folder/default.txt').upload).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFile', () => {
    test('downloads file when it exists', async () => {
      const mockBlob = {
        upload: jest.fn(),
        uploadStream: jest.fn(),
        exists: jest.fn().mockResolvedValue(true),
        downloadToBuffer: jest.fn().mockResolvedValue(Buffer.from('file content')),
        deleteIfExists: jest.fn(),
        url: 'test-url'
      }
      mockContainer.getBlockBlobClient.mockReturnValue(mockBlob)

      const result = await storage.getFile('test.txt')

      expect(mockBlob.exists).toHaveBeenCalled()
      expect(mockBlob.downloadToBuffer).toHaveBeenCalled()
      expect(result).toEqual(Buffer.from('file content'))
    })

    test('throws error when file does not exist', async () => {
      const mockBlob = {
        upload: jest.fn(),
        uploadStream: jest.fn(),
        exists: jest.fn().mockResolvedValue(false),
        downloadToBuffer: jest.fn(),
        deleteIfExists: jest.fn(),
        url: 'test-url'
      }
      mockContainer.getBlockBlobClient.mockReturnValue(mockBlob)

      await expect(storage.getFile('test.txt')).rejects.toThrow('File not found in blob storage: test.txt (container: test-container, folder: test-folder)')
      expect(mockBlob.exists).toHaveBeenCalled()
      expect(mockBlob.downloadToBuffer).not.toHaveBeenCalled()
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

      const expectedBlobPath = `${mockStorageConfig.reportFolder}/${filename}`
      const blobClient = blobClientMocksByPath.get(expectedBlobPath)
      expect(blobClient).toBeDefined()
      expect(blobClient.uploadStream).toHaveBeenCalledWith(
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

      const expectedBlobPath = `${mockStorageConfig.reportFolder}/${filename}`
      const blobClient = blobClientMocksByPath.get(expectedBlobPath)
      expect(blobClient).toBeDefined()
      expect(blobClient.uploadStream).toHaveBeenCalled()
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
      const expectedBlobPath = `${mockStorageConfig.reportFolder}/${filename}`
      const mockBlob = {
        upload: jest.fn(),
        uploadStream: jest.fn().mockRejectedValue(uploadError),
        exists: jest.fn(),
        downloadToBuffer: jest.fn(),
        deleteIfExists: jest.fn(),
        url: 'test-url'
      }
      blobClientMocksByPath.set(expectedBlobPath, mockBlob)

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
      const filename = 'report.csv'
      const expectedBlobPath = `${mockStorageConfig.reportFolder}/${filename}`
      const mockBlob = {
        upload: jest.fn(),
        uploadStream: jest.fn(),
        exists: jest.fn(),
        downloadToBuffer: jest.fn().mockResolvedValue(Buffer.from('report content')),
        deleteIfExists: jest.fn(),
        url: 'test-url'
      }
      blobClientMocksByPath.set(expectedBlobPath, mockBlob)

      const result = await storage.getReportFile(filename)

      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(expectedBlobPath)
      expect(mockBlob.downloadToBuffer).toHaveBeenCalled()
      expect(result).toEqual(Buffer.from('report content'))
    })
  })

  describe('deleteStatement', () => {
    const filename = 'test-statement.pdf'
    let storageModule

    beforeEach(() => {
      jest.clearAllMocks()
      storageModule = require('../../app/storage')
    })

    test('initializes containers if not initialized and deletes the blob successfully', async () => {
      jest.resetModules()
      const mockBlobClient = {
        upload: jest.fn(),
        uploadStream: jest.fn(),
        exists: jest.fn(),
        downloadToBuffer: jest.fn(),
        deleteIfExists: jest.fn().mockResolvedValue({ succeeded: true }),
        url: 'test-url'
      }
      const mockContainerLocal = {
        createIfNotExists: jest.fn().mockResolvedValue(),
        getBlockBlobClient: jest.fn().mockReturnValue(mockBlobClient)
      }
      const mockBlobServiceClientLocal = {
        getContainerClient: jest.fn().mockReturnValue(mockContainerLocal)
      }
      require('@azure/storage-blob').BlobServiceClient.fromConnectionString = jest
        .fn()
        .mockReturnValue(mockBlobServiceClientLocal)
      jest.mock('../../app/config', () => ({
        storageConfig: {
          useConnectionStr: true,
          connectionStr: 'connection-string',
          createContainers: true,
          storageAccount: 'fakestorageaccount',
          managedIdentityClientId: 'fake-client-id',
          container: 'test-container',
          folder: 'test-folder',
          reportFolder: 'test-report-folder'
        }
      }))
      storageModule = require('../../app/storage')

      await storageModule.deleteStatement(filename)

      expect(mockContainerLocal.createIfNotExists).toHaveBeenCalled()
      expect(mockContainerLocal.getBlockBlobClient).toHaveBeenCalledWith(`test-folder/${filename}`)
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        `[STORAGE] Successfully deleted file: ${filename} from folder: test-folder`
      )
    })

    test('does not log success if file was not found to delete', async () => {
      jest.resetModules()

      const mockBlobClient = {
        upload: jest.fn(),
        uploadStream: jest.fn(),
        exists: jest.fn(),
        downloadToBuffer: jest.fn(),
        deleteIfExists: jest.fn().mockResolvedValue({ succeeded: false }),
        url: 'test-url'
      }

      const mockContainerLocal = {
        createIfNotExists: jest.fn().mockResolvedValue(),
        getBlockBlobClient: jest.fn().mockReturnValue(mockBlobClient)
      }

      const mockBlobServiceClientLocal = {
        getContainerClient: jest.fn().mockReturnValue(mockContainerLocal)
      }

      require('@azure/storage-blob').BlobServiceClient.fromConnectionString = jest
        .fn()
        .mockReturnValue(mockBlobServiceClientLocal)

      jest.mock('../../app/config', () => ({
        storageConfig: {
          useConnectionStr: true,
          connectionStr: 'connection-string',
          createContainers: true,
          storageAccount: 'fakestorageaccount',
          managedIdentityClientId: 'fake-client-id',
          container: 'test-container',
          folder: 'test-folder',
          reportFolder: 'test-report-folder'
        }
      }))

      const storageModule = require('../../app/storage')

      await storageModule.deleteStatement('test-statement.pdf')

      expect(mockContainerLocal.getBlockBlobClient).toHaveBeenCalledWith('test-folder/test-statement.pdf')
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith(
        '[STORAGE] File to delete not found: test-statement.pdf in folder: test-folder'
      )
      expect(console.log).not.toHaveBeenCalledWith(
        '[STORAGE] Successfully deleted file: test-statement.pdf from folder: test-folder'
      )
    })

    test('logs error and rethrows if deleteIfExists throws', async () => {
      jest.resetModules()

      const mockError = new Error('Delete failed')

      const mockBlobClient = {
        upload: jest.fn(),
        uploadStream: jest.fn(),
        exists: jest.fn(),
        downloadToBuffer: jest.fn(),
        deleteIfExists: jest.fn().mockRejectedValue(mockError),
        url: 'test-url'
      }

      const mockContainerLocal = {
        createIfNotExists: jest.fn().mockResolvedValue(),
        getBlockBlobClient: jest.fn().mockReturnValue(mockBlobClient)
      }

      const mockBlobServiceClientLocal = {
        getContainerClient: jest.fn().mockReturnValue(mockContainerLocal)
      }

      require('@azure/storage-blob').BlobServiceClient.fromConnectionString = jest
        .fn()
        .mockReturnValue(mockBlobServiceClientLocal)

      jest.mock('../../app/config', () => ({
        storageConfig: {
          useConnectionStr: true,
          connectionStr: 'connection-string',
          createContainers: true,
          storageAccount: 'fakestorageaccount',
          managedIdentityClientId: 'fake-client-id',
          container: 'test-container',
          folder: 'test-folder',
          reportFolder: 'test-report-folder'
        }
      }))

      const storageModule = require('../../app/storage')

      await expect(storageModule.deleteStatement('test-statement.pdf')).rejects.toThrow('Delete failed')

      expect(mockContainerLocal.getBlockBlobClient).toHaveBeenCalledWith('test-folder/test-statement.pdf')
      expect(mockBlobClient.deleteIfExists).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        '[STORAGE] Error deleting file: test-statement.pdf',
        mockError
      )
    })
  })
})
