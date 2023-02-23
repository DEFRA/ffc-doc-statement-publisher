const MOCK_REFERENCE = '78363cba-2093-4447-8812-697c09820614'
const MOCK_PREPARED_FILE = 'mock-prepared-file'

let mockSendEmail
let mockPrepareUpload

const mockNotifyClient = jest.fn().mockImplementation(() => {
  return {
    sendEmail: mockSendEmail,
    prepareUpload: mockPrepareUpload
  }
})

jest.mock('notifications-node-client', () => {
  return {
    NotifyClient: mockNotifyClient
  }
})

jest.mock('ffc-messaging')

const { BlobServiceClient } = require('@azure/storage-blob')
const { storageConfig, notifyApiKey } = require('../../../app/config')

const db = require('../../../app/data')

const processPublishMessage = require('../../../app/messaging/process-publish-message')

const path = require('path')

const { EMAIL } = require('../../../app/constants/methods')

const FILE_NAME = 'FFC_PaymentStatement_SFI_2022_1234567890_2022080515301012.pdf'
const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

let mockRequest
let blobServiceClient
let container
let receiver
let message

describe('publish statement', () => {
  beforeEach(async () => {
    mockRequest = JSON.parse(JSON.stringify(require('../../mocks/request')))
    jest.useFakeTimers().setSystemTime(new Date(2022, 7, 5, 15, 30, 10, 120))
    blobServiceClient = BlobServiceClient.fromConnectionString(storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    const blockBlobClient = container.getBlockBlobClient(`${storageConfig.folder}/${FILE_NAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)

    mockSendEmail = jest.fn().mockResolvedValue({ data: { id: MOCK_REFERENCE } })
    mockPrepareUpload = jest.fn().mockReturnValue(MOCK_PREPARED_FILE)

    receiver = {
      completeMessage: jest.fn(),
      deadLetterMessage: jest.fn()
    }

    message = {
      body: mockRequest
    }
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  test('should use API key in Notify connection', async () => {
    await processPublishMessage(message, receiver)

    expect(mockNotifyClient).toHaveBeenCalledWith(notifyApiKey)
  })

  test('should send email via Notify once', async () => {
    await processPublishMessage(message, receiver)

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('should send email to requested email address', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][1]).toBe(mockRequest.email)
  })

  test('should send email with file link', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][2].personalisation.link_to_file).toBe(MOCK_PREPARED_FILE)
  })

  test('should send email with scheme name', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeName).toBe(mockRequest.scheme.name)
  })

  test('should send email with scheme short name', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeShortName).toBe(mockRequest.scheme.shortName)
  })

  test('should send email with scheme frequency', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeFrequency).toBe(mockRequest.scheme.frequency.toLowerCase())
  })

  test('should send email with scheme year', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][2].personalisation.schemeYear).toBe(mockRequest.scheme.year)
  })

  test('should send email with business name', async () => {
    await processPublishMessage(message, receiver)
    expect(mockSendEmail.mock.calls[0][2].personalisation.businessName).toBe(mockRequest.businessName)
  })

  test('saves one statement', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findAll()
    expect(statement.length).toBe(1)
  })

  test('saves statement with business name', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.businessName).toBe(mockRequest.businessName)
  })

  test('saves statement with sbi', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.sbi).toBe(mockRequest.sbi)
  })

  test('saves statement with frn', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.frn).toBe(mockRequest.frn.toString())
  })

  test('saves statement with email', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.email).toBe(mockRequest.email)
  })

  test('saves statement with filename', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.filename).toBe(mockRequest.filename)
  })

  test('saves statement with address line 1', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.addressLine1).toBe(mockRequest.address.line1)
  })

  test('saves statement with address line 2', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.addressLine2).toBe(mockRequest.address.line2)
  })

  test('saves statement with address line 3', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.addressLine3).toBe(mockRequest.address.line3)
  })

  test('saves statement with address line 4', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.addressLine4).toBe(mockRequest.address.line4)
  })

  test('saves statement with address line 5', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.addressLine5).toBe(mockRequest.address.line5)
  })

  test('saves statement with address postcode', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    expect(statement.postcode).toBe(mockRequest.address.postcode)
  })

  test('saves one delivery', async () => {
    await processPublishMessage(message, receiver)
    const delivery = await db.delivery.findAll()
    expect(delivery.length).toBe(1)
  })

  test('saves delivery with statement id', async () => {
    await processPublishMessage(message, receiver)
    const statement = await db.statement.findOne()
    const delivery = await db.delivery.findOne()
    expect(delivery.statementId).toBe(statement.statementId)
  })

  test('saves delivery with email method', async () => {
    await processPublishMessage(message, receiver)
    const delivery = await db.delivery.findOne()
    expect(delivery.method).toBe(EMAIL)
  })

  test('saves delivery with requested date', async () => {
    await processPublishMessage(message, receiver)
    const delivery = await db.delivery.findOne()
    expect(delivery.requested).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
  })

  test('saves delivery with null completed date', async () => {
    await processPublishMessage(message, receiver)
    const delivery = await db.delivery.findOne()
    expect(delivery.completed).toBeNull()
  })

  test('completes message if successful', async () => {
    await processPublishMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('completes message once if successful', async () => {
    await processPublishMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test('does not dead letter if message completed', async () => {
    await processPublishMessage(message, receiver)
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
  })
})
