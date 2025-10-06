let mockSendEmail
const MOCK_PREPARED_FILE = 'mock-prepared-file'
let mockPrepareUpload
jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: jest.fn().mockImplementation(() => {
      return {
        sendEmail: mockSendEmail,
        prepareUpload: mockPrepareUpload
      }
    })
  }
})
jest.mock('ffc-messaging')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config/storage')
const db = require('../../../app/data')
const rescheduleDelivery = require('../../../app/monitoring/reschedule-delivery')
const path = require('path')
const { mockStatement1, mockStatement2 } = require('../../mocks/statement')
const { mockDelivery1, mockDelivery2 } = require('../../mocks/delivery')

const FILE_NAME = 'FFC_PaymentStatement_DP_2024_1234567890_2022080515301012.pdf'
const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

let blobServiceClient
let container

describe('reschedule deliveries', () => {
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
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should complete delivery', async () => {
    await rescheduleDelivery(mockDelivery1)
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should create new delivery', async () => {
    await rescheduleDelivery(mockDelivery1)
    const deliveries = await db.delivery.findAll({ where: { statementId: mockDelivery1.statementId } })
    expect(deliveries.length).toBe(2)
  })

  test('should create new delivery with requested date', async () => {
    await rescheduleDelivery(mockDelivery1)
    const delivery = await db.delivery.findOne({ where: { statementId: mockDelivery1.statementId, completed: null } })
    expect(delivery.requested).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should not create new statement', async () => {
    await rescheduleDelivery(mockDelivery1)
    const statements = await db.statement.findAll()
    expect(statements.length).toBe(2)
  })

  test('should send email via Notify once', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('should send email to requested email address', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][1]).toBe(mockStatement1.email)
  })

  test('should send email with file link', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][2].personalisation.link_to_file).toBe(MOCK_PREPARED_FILE)
  })

  test('should send email with scheme name', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeName).toBe(mockStatement1.schemeName)
  })

  test('should send email with scheme short name', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeShortName).toBe(mockStatement1.schemeShortName)
  })

  test('should send email with scheme frequency', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeFrequency).toBe(mockStatement1.schemeFrequency.toLowerCase())
  })

  test('should send email with scheme year', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeYear).toBe(mockStatement1.schemeYear)
  })

  test('should send email with business name', async () => {
    await rescheduleDelivery(mockDelivery1)
    expect(mockSendEmail.mock.calls[0][2].personalisation.businessName).toBe(mockStatement1.businessName)
  })
})
