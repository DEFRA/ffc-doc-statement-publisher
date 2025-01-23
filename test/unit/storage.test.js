const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const { Readable } = require('stream')

jest.mock('@azure/identity')
jest.mock('@azure/storage-blob')

describe('storage', () => {
  let mockBlobServiceClient
  let mockContainerClient
  let mockBlockBlobClient

  beforeAll(() => {
    console.log = jest.fn()
    console.error = jest.fn()
    console.debug = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockBlockBlobClient = {
      upload: jest.fn(),
      uploadStream: jest.fn(),
      downloadToBuffer: jest.fn()
    }

    mockContainerClient = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
      createIfNotExists: jest.fn()
    }

    mockBlobServiceClient = {
      getContainerClient: jest.fn().mockReturnValue(mockContainerClient)
    }

    BlobServiceClient.fromConnectionString.mockReturnValue(mockBlobServiceClient)
    BlobServiceClient.mockImplementation(() => mockBlobServiceClient)
    DefaultAzureCredential.mockImplementation(() => ({}))
  })

  test('should initialize BlobServiceClient with connection string', () => {
    jest.isolateModules(() => {
      const config = require('../../app/config').storageConfig
      config.useConnectionStr = true
      require('../../app/storage')
      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(config.connectionStr)
    })
  })

  test('should initialize BlobServiceClient using DefaultAzureCredential', () => {
    jest.isolateModules(() => {
      const config = require('../../app/config').storageConfig
      config.storageAccount = 'test'
      config.useConnectionStr = false
      const uri = `https://${config.storageAccount}.blob.core.windows.net`
      const mockCredential = {}
      DefaultAzureCredential.mockImplementation(() => mockCredential)
      require('../../app/storage')
      expect(BlobServiceClient).toHaveBeenCalledWith(uri, mockCredential)
    })
  })

  test('should create containers if not exist', async () => {
    jest.isolateModules(async () => {
      const config = require('../../app/config').storageConfig
      config.createContainers = true
      const storage = require('../../app/storage')
      await storage.initialiseContainers()
      expect(mockContainerClient.createIfNotExists).toHaveBeenCalled()
      expect(mockBlockBlobClient.upload).toHaveBeenCalledTimes(2)
    })
  })

  test('should get blob client', async () => {
    jest.isolateModules(async () => {
      const config = require('../../app/config').storageConfig
      const filename = 'test.txt'
      const storage = require('../../app/storage')
      const blobClient = await storage.getBlob(filename)
      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith(`${config.folder}/${filename}`)
      expect(blobClient).toBe(mockBlockBlobClient)
    })
  })

  test('should get file content', async () => {
    jest.isolateModules(async () => {
      const filename = 'test.txt'
      const buffer = Buffer.from('test content')
      mockBlockBlobClient.downloadToBuffer.mockResolvedValue(buffer)
      const storage = require('../../app/storage')
      const fileContent = await storage.getFile(filename)
      expect(mockBlockBlobClient.downloadToBuffer).toHaveBeenCalled()
      expect(fileContent).toBe(buffer)
    })
  })

  test('should save report file successfully', async () => {
    await jest.isolateModules(async () => {
      const config = require('../../app/config').storageConfig
      const filename = 'test.csv'
      const mockStream = new Readable({
        read () {
          this.push('test data')
          this.push(null)
        }
      })

      mockBlockBlobClient.uploadStream.mockResolvedValue()

      const storage = require('../../app/storage')
      await storage.saveReportFile(filename, mockStream)

      expect(mockContainerClient.getBlockBlobClient)
        .toHaveBeenCalledWith(`${config.reportFolder}/${filename}`)
      expect(mockBlockBlobClient.uploadStream).toHaveBeenCalledWith(
        mockStream,
        4 * 1024 * 1024,
        5,
        expect.objectContaining({
          blobHTTPHeaders: {
            blobContentType: 'text/csv'
          }
        })
      )
    })
  })

  test('should handle stream error when saving report file', async () => {
    mockBlockBlobClient.uploadStream.mockRejectedValue(new Error('Stream failed'))
    await jest.isolateModules(async () => {
      const filename = 'test.csv'
      const mockStream = new Readable({
        read () {
          this.emit('error', new Error('Stream failed'))
        }
      })

      const storage = require('../../app/storage')
      await expect(storage.saveReportFile(filename, mockStream))
        .rejects.toThrow('Stream failed')
    })
  })

  test('should initialize containers before saving report file', async () => {
    await jest.isolateModules(async () => {
      const filename = 'test.csv'
      const mockStream = new Readable({
        read () {
          this.push(null)
        }
      })

      mockBlockBlobClient.uploadStream.mockResolvedValue()

      const storage = require('../../app/storage')
      await storage.saveReportFile(filename, mockStream)

      expect(mockContainerClient.createIfNotExists).toHaveBeenCalled()
    })
  })

  test('should get report file content', async () => {
    await jest.isolateModules(async () => {
      const config = require('../../app/config').storageConfig
      const filename = 'test.csv'
      const buffer = Buffer.from('test content')
      mockBlockBlobClient.downloadToBuffer.mockResolvedValue(buffer)

      const storage = require('../../app/storage')
      const fileContent = await storage.getReportFile(filename)

      expect(mockContainerClient.getBlockBlobClient)
        .toHaveBeenCalledWith(`${config.reportFolder}/${filename}`)
      expect(mockBlockBlobClient.downloadToBuffer).toHaveBeenCalled()
      expect(fileContent).toBe(buffer)
    })
  })
})
