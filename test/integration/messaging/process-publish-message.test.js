const SYSTEM_TIME = require('../../mocks/components/system-time')
jest.useFakeTimers().setSystemTime(SYSTEM_TIME)

jest.mock('../../../app/messaging/get-request-email-template-by-type')
const getRequestEmailTemplateByType = require('../../../app/messaging/get-request-email-template-by-type')

const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')

const { mockMessageReceiver } = require('../../mocks/modules/ffc-messaging')

const { BlobServiceClient } = require('@azure/storage-blob')
const { storageConfig, notifyApiKey } = require('../../../app/config')

const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

const db = require('../../../app/data')

const path = require('path')

const { EMAIL } = require('../../../app/constants/methods')

const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

const processPublishMessage = require('../../../app/messaging/process-publish-message')

let container

let receiver

describe('Process publish message', () => {
  beforeEach(async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()

    receiver = mockMessageReceiver()
    getRequestEmailTemplateByType.mockResolvedValue(EMAIL_TEMPLATE)
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  describe.each([
    { name: 'statement', message: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)) }
  ])('When message is a $name', ({ name, message }) => {
    beforeEach(async () => {
      getRequestEmailTemplateByType.mockReturnValue(EMAIL_TEMPLATE)
      const blockBlobClient = container.getBlockBlobClient(`${storageConfig.folder}/${message.body.filename}`)
      await blockBlobClient.uploadFile(TEST_FILE)
    })

    test('should use API key in Notify connection', async () => {
      await processPublishMessage(message, receiver)

      expect(mockNotifyClient).toHaveBeenCalledWith(notifyApiKey)
    })

    test('should send email via Notify once', async () => {
      await processPublishMessage(message, receiver)

      expect(mockNotifyClient().sendEmail).toHaveBeenCalledTimes(1)
    })

    test('should send email to requested email address', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][1]).toBe(message.body.email)
    })

    test('should send email with file link', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][2].personalisation.link_to_file).toBe(mockNotifyClient().prepareUpload())
    })

    test('should send email with scheme name', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][2].personalisation.schemeName).toBe(message.body.scheme.name)
    })

    test('should send email with scheme short name', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][2].personalisation.schemeShortName).toBe(message.body.scheme.shortName)
    })

    test('should send email with scheme frequency', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][2].personalisation.schemeFrequency.toLowerCase()).toBe(message.body.scheme.frequency.toLowerCase())
    })

    test('should send email with scheme year', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][2].personalisation.schemeYear).toBe(message.body.scheme.year)
    })

    test('should send email with business name', async () => {
      await processPublishMessage(message, receiver)
      expect(mockNotifyClient().sendEmail.mock.calls[0][2].personalisation.businessName).toBe(message.body.businessName)
    })

    test('should save one statement', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findAll()
      expect(statement.length).toBe(1)
    })

    test('should save statement with business name', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.businessName).toBe(message.body.businessName)
    })

    test('should save statement with sbi', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.sbi).toBe(message.body.sbi)
    })

    test('should save statement with frn', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.frn).toBe(message.body.frn.toString())
    })

    test('should save statement with email', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.email).toBe(message.body.email)
    })

    test('should save statement with filename', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.filename).toBe(message.body.filename)
    })

    test('should save statement with address line 1', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.addressLine1).toBe(message.body.address.line1)
    })

    test('should save statement with address line 2', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.addressLine2).toBe(message.body.address.line2)
    })

    test('should save statement with address line 3', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.addressLine3).toBe(message.body.address.line3)
    })

    test('should save statement with address line 4', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.addressLine4).toBe(message.body.address.line4)
    })

    test('should save statement with address line 5', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.addressLine5).toBe(message.body.address.line5)
    })

    test('should save statement with address postcode', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      expect(statement.postcode).toBe(message.body.address.postcode)
    })

    test('should save one delivery', async () => {
      await processPublishMessage(message, receiver)
      const delivery = await db.delivery.findAll()
      expect(delivery.length).toBe(1)
    })

    test('should save delivery with statement id', async () => {
      await processPublishMessage(message, receiver)
      const statement = await db.statement.findOne()
      const delivery = await db.delivery.findOne()
      expect(delivery.statementId).toBe(statement.statementId)
    })

    test('should save delivery with email method', async () => {
      await processPublishMessage(message, receiver)
      const delivery = await db.delivery.findOne()
      expect(delivery.method).toBe(EMAIL)
    })

    test('should save delivery with requested date', async () => {
      await processPublishMessage(message, receiver)
      const delivery = await db.delivery.findOne()
      expect(delivery.requested).toStrictEqual(SYSTEM_TIME)
    })

    test('should save delivery with null completed date', async () => {
      await processPublishMessage(message, receiver)
      const delivery = await db.delivery.findOne()
      expect(delivery.completed).toBeNull()
    })

    test('should complete message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.completeMessage).toHaveBeenCalledWith(message)
    })

    test('should completes 1 message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    })

    test('should not dead letter message', async () => {
      await processPublishMessage(message, receiver)
      expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
    })
  })
})
