const SYSTEM_TIME = require('../../mocks/components/system-time')
jest.useFakeTimers().setSystemTime(SYSTEM_TIME)

const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')

const { BlobServiceClient } = require('@azure/storage-blob')
const { storageConfig } = require('../../../app/config')

const db = require('../../../app/data')

const saveStatement = require('../../../app/publishing/save-statement')

const path = require('path')

const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

const publishStatement = require('../../../app/publishing/publish-statement')

let container

describe('Publish request', () => {
  beforeEach(async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  describe.each([
    { name: 'statement', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)).body },
    { name: 'schedule', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').SCHEDULE_MESSAGE)).body }
  ])('When request is a $name', ({ name, request }) => {
    beforeEach(async () => {
      const blockBlobClient = container.getBlockBlobClient(`${storageConfig.folder}/${request.filename}`)
      await blockBlobClient.uploadFile(TEST_FILE)
    })

    describe('When it is a duplicate', () => {
      beforeEach(async () => {
        const transaction = await db.sequelize.transaction()
        await saveStatement(request, new Date(), transaction)
        await transaction.commit()
      })

      test('should not save the duplicate request', async () => {
        const statementBefore = await db.statement.findAll()

        await publishStatement(request)

        const statementAfter = await db.statement.findAll()
        expect(statementBefore.length).toBe(1)
        expect(statementAfter.length).toBe(1)
      })

      test('should not send an email via Notify', async () => {
        await publishStatement(request)
        expect(mockNotifyClient().sendEmail).not.toHaveBeenCalled()
      })
    })

    describe('When it is not a duplicate', () => {
      test('should save the request', async () => {
        const statementBefore = await db.statement.findAll()

        await publishStatement(request)

        const statementAfter = await db.statement.findAll()
        expect(statementBefore.length).toBe(0)
        expect(statementAfter.length).toBe(1)
      })

      test('should send an email via Notify', async () => {
        await publishStatement(request)
        expect(mockNotifyClient().sendEmail).toHaveBeenCalled()
      })
    })
  })
})
