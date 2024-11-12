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
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should check status of delivery once if only one delivery outstanding', async () => {
    await updateDeliveries()
    expect(mockGetNotificationById).toHaveBeenCalledTimes(1)
  })

  test('should check status of delivery for only outstanding delivery', async () => {
    await updateDeliveries()
    expect(mockGetNotificationById).toHaveBeenCalledWith(mockDelivery1.reference)
  })

  test('should complete delivery if status delivered', async () => {
    await updateDeliveries()
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should not complete delivery if status sending', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: SENDING } })
    await updateDeliveries()
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toBeNull()
  })

  test('should not complete delivery if status created', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: CREATED } })
    await updateDeliveries()
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toBeNull()
  })

  test('should complete delivery if status temporary failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TEMPORARY_FAILURE } })
    await updateDeliveries()
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should create failure if status temporary failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TEMPORARY_FAILURE } })
    await updateDeliveries()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure).not.toBeNull()
  })

  test('should create failure with reason if status temporary failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TEMPORARY_FAILURE } })
    await updateDeliveries()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure.reason).toBe(REJECTED)
  })

  test('should create failure with date failed if status temporary failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TEMPORARY_FAILURE } })
    await updateDeliveries()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure.failed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should complete delivery if status permanent failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: PERMANENT_FAILURE } })
    await updateDeliveries()
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should create failure if status permanent failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: PERMANENT_FAILURE } })
    await updateDeliveries()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure).not.toBeNull()
  })

  test('should create failure with reason if status permanent failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: PERMANENT_FAILURE } })
    await updateDeliveries()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure.reason).toBe(INVALID)
  })

  test('should create failure with date failed if status permanent failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: PERMANENT_FAILURE } })
    await updateDeliveries()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure.failed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should complete delivery if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should create new delivery if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    const deliveries = await db.delivery.findAll({ where: { statementId: mockStatement1.statementId } })
    expect(deliveries.length).toBe(2)
  })

  test('should create new delivery with requested date if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    const delivery = await db.delivery.findOne({ where: { statementId: mockStatement1.statementId, completed: null } })
    expect(delivery.requested).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('should not create new statement if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    const statements = await db.statement.findAll()
    expect(statements.length).toBe(2)
  })

  test('should send email via Notify once if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('should send email to requested email address if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    expect(mockSendEmail.mock.calls[0][1]).toBe(mockStatement1.email)
  })

  test('should send email with file link if status technical failure', async () => {
    mockGetNotificationById = jest.fn().mockResolvedValue({ data: { status: TECHNICAL_FAILURE } })
    await updateDeliveries()
    expect(mockSendEmail.mock.calls[0][2].personalisation.link_to_file).toBe(MOCK_PREPARED_FILE)
  })
})
