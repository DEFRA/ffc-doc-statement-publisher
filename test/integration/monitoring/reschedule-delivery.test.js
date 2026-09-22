let mockSendEmail
const MOCK_PREPARED_FILE = 'mock-prepared-file'
let mockPrepareUpload

jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: jest.fn().mockImplementation(() => ({
      sendEmail: mockSendEmail,
      prepareUpload: mockPrepareUpload
    }))
  }
})

jest.mock('ffc-messaging')

const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config/storage')
const db = require('../../../app/database')
const { truncate } = require('../../helpers/truncate')
const rescheduleDelivery = require('../../../app/monitoring/reschedule-delivery')
const path = require('path')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')

const FILE_NAME = 'FFC_PaymentStatement_DP_2024_1234567890_2022080515301012.pdf'
const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

let blobServiceClient
let container

describe('rescheduleDeliveries', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))

    blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
    container = blobServiceClient.getContainerClient(config.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    const blockBlobClient = container.getBlockBlobClient(`${config.folder}/${FILE_NAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)

    await truncate()
    await db.statement().insert([mockStatement1, mockStatement2])
    await db.delivery().insert([mockDelivery1, mockDelivery2])

    mockSendEmail = jest.fn().mockResolvedValue({ data: { id: mockDelivery1.reference } })
    mockPrepareUpload = jest.fn().mockReturnValue(MOCK_PREPARED_FILE)
  })

  afterAll(async () => {
    await truncate()
    await db.close()
  })

  test('should complete delivery', async () => {
    await rescheduleDelivery(mockDelivery1)
    const delivery = await db.delivery().where({ deliveryId: mockDelivery1.deliveryId }).first()
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should create new delivery', async () => {
    await rescheduleDelivery(mockDelivery1)
    const deliveries = await db.delivery().where({ statementId: mockDelivery1.statementId })
    expect(deliveries.length).toBe(2)
  })

  test('should create new delivery with requested date', async () => {
    await rescheduleDelivery(mockDelivery1)
    const delivery = await db.delivery().where({ statementId: mockDelivery1.statementId, completed: null }).first()
    expect(delivery.requested).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should not create new statement', async () => {
    await rescheduleDelivery(mockDelivery1)
    const statements = await db.statement()
    expect(statements.length).toBe(2)
  })

  test('should send email via Notify once', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('should send email with correct personalisation', async () => {
    await rescheduleDelivery(mockDelivery1)

    const personalisation = mockSendEmail.mock.calls[0][2].personalisation
    const expectedValues = [
      ['link_to_file', MOCK_PREPARED_FILE],
      ['schemeName', mockStatement1.schemeName],
      ['schemeShortName', mockStatement1.schemeShortName],
      ['schemeFrequency', mockStatement1.schemeFrequency],
      ['schemeYear', mockStatement1.schemeYear],
      ['businessName', mockStatement1.businessName]
    ]

    expectedValues.forEach(([key, value]) => {
      expect(personalisation[key]).toBe(value)
    })

    // Check email recipient
    expect(mockSendEmail.mock.calls[0][1]).toBe(mockStatement1.email)
  })
})
