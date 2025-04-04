let mockSendEmail
const MOCK_PREPARED_FILE = 'mock-prepared-file'
const MOCK_URL = 'http://mock.url'
let mockPrepareUpload
let mockSendPrecompiledLetter
const mockGetStatementFileUrl = jest.fn()
const mockFetchStatementFile = jest.fn()
let mockGetNotificationById
jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: jest.fn().mockImplementation(() => {
      return {
        sendEmail: mockSendEmail,
        prepareUpload: mockPrepareUpload,
        getNotificationById: mockGetNotificationById,
        sendPrecompiledLetter: mockSendPrecompiledLetter
      }
    })
  }
})

const mockProcessAllOutstandingDeliveries = jest.fn()
jest.mock('../../../app/monitoring/get-outstanding-deliveries', () => ({
  processAllOutstandingDeliveries: mockProcessAllOutstandingDeliveries
}))

const mockCheckDeliveryStatus = jest.fn()
jest.mock('../../../app/monitoring/check-delivery-status', () => mockCheckDeliveryStatus)

const mockUpdateDeliveryFromResponse = jest.fn()
jest.mock('../../../app/monitoring/update-delivery-from-response', () => mockUpdateDeliveryFromResponse)

jest.mock('ffc-messaging')
jest.mock('../../../app/publishing/get-statement-file-url', () => mockGetStatementFileUrl)
jest.mock('../../../app/publishing/fetch-statement-file', () => mockFetchStatementFile)
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config/storage')
const db = require('../../../app/data')
const path = require('path')
const { DELIVERED, SENDING, CREATED, TEMPORARY_FAILURE, PERMANENT_FAILURE, TECHNICAL_FAILURE } = require('../../../app/constants/statuses')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')
const { INVALID, REJECTED } = require('../../../app/constants/failure-reasons')
const updateDeliveries = require('../../../app/monitoring/update-deliveries')

const FILE_NAME = 'FFC_PaymentStatement_SFI_2022_1234567890_2022080515301012.pdf'
const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

let blobServiceClient
let container

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { })
  jest.spyOn(console, 'error').mockImplementation(() => { })
})

afterEach(() => {
  console.log.mockRestore()
  console.error.mockRestore()
})

describe('update deliveries', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))
    blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
    container = blobServiceClient.getContainerClient(config.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    const blockBlobClient = container.getBlockBlobClient(`${config.folder}/${FILE_NAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)

    await db.sequelize.truncate({ cascade: true })
    await db.statement.bulkCreate([mockStatement1, mockStatement2])
    await db.delivery.bulkCreate([mockDelivery1, mockDelivery2])

    mockSendEmail = jest.fn().mockResolvedValue({ data: { id: mockDelivery1.reference } })
    mockPrepareUpload = jest.fn().mockReturnValue(MOCK_PREPARED_FILE)
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: DELIVERED } })
    mockSendPrecompiledLetter = jest.fn().mockResolvedValue({ data: { id: mockDelivery1.reference } })
    mockFetchStatementFile.mockReturnValue(MOCK_PREPARED_FILE)
    mockGetStatementFileUrl.mockReturnValue(MOCK_URL)

    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [mockDelivery1]
      await processFn(deliveries)
      return { totalProcessed: deliveries.length, batchCount: 1 }
    })

    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: DELIVERED } })
    mockUpdateDeliveryFromResponse.mockResolvedValue()
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should return object with totalProcessed and duration', async () => {
    const result = await updateDeliveries()
    expect(result).toHaveProperty('totalProcessed')
    expect(result).toHaveProperty('duration')
    expect(typeof result.totalProcessed).toBe('number')
    expect(typeof result.duration).toBe('number')
  })

  test('should process deliveries in batches', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const batch1 = [mockDelivery1]
      const batch2 = [mockDelivery2]

      await processFn(batch1)
      await processFn(batch2)

      return { totalProcessed: 2, batchCount: 2 }
    })

    const result = await updateDeliveries()
    expect(result.totalProcessed).toBe(2)
    expect(mockProcessAllOutstandingDeliveries).toHaveBeenCalledWith(expect.any(Function), 20)
  })

  test('should handle errors in individual delivery processing', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [
        { ...mockDelivery1, deliveryId: 1, reference: 'reference1' },
        { ...mockDelivery2, deliveryId: 2, reference: 'reference2' }
      ]

      mockCheckDeliveryStatus.mockImplementation((reference) => {
        if (reference === 'reference2') {
          throw new Error('Test error')
        }
        return Promise.resolve({ data: { status: DELIVERED } })
      })

      const results = await processFn(deliveries)

      expect(results.filter(r => r.success).length).toBe(1)
      expect(results.filter(r => !r.success).length).toBe(1)

      return { totalProcessed: 2, batchCount: 1 }
    })

    const result = await updateDeliveries()
    expect(result.totalProcessed).toBe(2)
  })

  test('should handle overall process errors', async () => {
    mockProcessAllOutstandingDeliveries.mockRejectedValue(new Error('Process failed'))

    await expect(updateDeliveries()).rejects.toThrow('Process failed')
  })

  test('should check status of delivery once if only one delivery outstanding', async () => {
    await updateDeliveries()
    expect(mockCheckDeliveryStatus).toHaveBeenCalledTimes(1)
  })

  test('should check status of delivery for only outstanding delivery', async () => {
    await updateDeliveries()
    expect(mockCheckDeliveryStatus).toHaveBeenCalledWith(mockDelivery1.reference)
  })

  test('should complete delivery if status delivered', async () => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: DELIVERED } })
    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(mockDelivery1, { data: { status: DELIVERED } })
  })

  test('should not complete delivery if status sending', async () => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: SENDING } })
    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(mockDelivery1, { data: { status: SENDING } })
  })

  test('should not complete delivery if status created', async () => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: CREATED } })
    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(mockDelivery1, { data: { status: CREATED } })
  })

  test('should complete delivery if status temporary failure', async () => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: TEMPORARY_FAILURE } })
    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(mockDelivery1, { data: { status: TEMPORARY_FAILURE } })
  })

  test('should complete delivery if status permanent failure', async () => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: PERMANENT_FAILURE } })
    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(mockDelivery1, { data: { status: PERMANENT_FAILURE } })
  })

  test('should complete delivery if status technical failure', async () => {
    mockCheckDeliveryStatus.mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(mockDelivery1, { data: { status: TECHNICAL_FAILURE } })
  })

  test('should process multiple batches correctly', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const batches = [
        [{ ...mockDelivery1, deliveryId: 1 }, { ...mockDelivery1, deliveryId: 2 }],
        [{ ...mockDelivery1, deliveryId: 3 }, { ...mockDelivery1, deliveryId: 4 }],
        [{ ...mockDelivery1, deliveryId: 5 }, { ...mockDelivery1, deliveryId: 6 }]
      ]

      for (const batch of batches) {
        await processFn(batch)
      }

      return { totalProcessed: 6, batchCount: 3 }
    })

    const result = await updateDeliveries()
    expect(result.totalProcessed).toBe(6)
    expect(mockCheckDeliveryStatus).toHaveBeenCalledTimes(6)
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledTimes(6)
  })

  test('should handle mixed delivery status responses', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [
        { ...mockDelivery1, deliveryId: 1, reference: 'ref1' },
        { ...mockDelivery1, deliveryId: 2, reference: 'ref2' },
        { ...mockDelivery1, deliveryId: 3, reference: 'ref3' }
      ]

      mockCheckDeliveryStatus.mockImplementation((reference) => {
        const statusMap = {
          ref1: DELIVERED,
          ref2: TEMPORARY_FAILURE,
          ref3: TECHNICAL_FAILURE
        }
        return Promise.resolve({ data: { status: statusMap[reference] } })
      })

      await processFn(deliveries)

      return { totalProcessed: 3, batchCount: 1 }
    })

    await updateDeliveries()
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledTimes(3)
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryId: 1 }),
      { data: { status: DELIVERED } }
    )
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryId: 2 }),
      { data: { status: TEMPORARY_FAILURE } }
    )
    expect(mockUpdateDeliveryFromResponse).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryId: 3 }),
      { data: { status: TECHNICAL_FAILURE } }
    )
  })

  test('should handle empty batch', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      await processFn([])
      return { totalProcessed: 0, batchCount: 0 }
    })

    const result = await updateDeliveries()
    expect(result.totalProcessed).toBe(0)
    expect(mockCheckDeliveryStatus).not.toHaveBeenCalled()
    expect(mockUpdateDeliveryFromResponse).not.toHaveBeenCalled()
  })

  test('should handle INVALID reason in error responses', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [{ ...mockDelivery1, deliveryId: 1 }]

      mockCheckDeliveryStatus.mockImplementation(() => {
        const error = new Error('Invalid request')
        error.reason = INVALID
        throw error
      })

      const results = await processFn(deliveries)
      expect(results[0].success).toBe(false)
      expect(results[0].error).toBeDefined()

      return { totalProcessed: 1, batchCount: 1 }
    })

    await updateDeliveries()
    expect(mockCheckDeliveryStatus).toHaveBeenCalledTimes(1)
    expect(mockUpdateDeliveryFromResponse).not.toHaveBeenCalled()
  })

  test('should handle REJECTED reason in error responses', async () => {
    mockProcessAllOutstandingDeliveries.mockImplementation(async (processFn) => {
      const deliveries = [{ ...mockDelivery1, deliveryId: 1 }]

      mockCheckDeliveryStatus.mockImplementation(() => {
        const error = new Error('Rejected request')
        error.reason = REJECTED
        throw error
      })

      const results = await processFn(deliveries)
      expect(results[0].success).toBe(false)
      expect(results[0].error).toBeDefined()

      return { totalProcessed: 1, batchCount: 1 }
    })

    await updateDeliveries()
    expect(mockCheckDeliveryStatus).toHaveBeenCalledTimes(1)
    expect(mockUpdateDeliveryFromResponse).not.toHaveBeenCalled()
  })
})
