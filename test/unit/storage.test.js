const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../app/config').storageConfig

jest.mock('@azure/identity')
jest.mock('@azure/storage-blob')

describe('storage', () => {
  let mockBlobServiceClient
  let mockContainerClient
  let mockBlockBlobClient

  beforeEach(() => {
    jest.clearAllMocks()

    mockBlockBlobClient = {
      upload: jest.fn(),
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
    config.useConnectionStr = true
    jest.isolateModules(() => {
      require('../../app/storage')
      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(config.connectionStr)
    })
  })

  test('should create containers if not exist', async () => {
    jest.isolateModules(async () => {
      config.createContainers = true
      const storage = require('../../app/storage')
      await storage.initialiseContainers()
      expect(mockContainerClient.createIfNotExists).toHaveBeenCalled()
      expect(mockBlockBlobClient.upload).toHaveBeenCalledTimes(2)
    })
  })

  test('should get blob client', async () => {
    jest.isolateModules(async () => {
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
})
