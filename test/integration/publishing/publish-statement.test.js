const SYSTEM_TIME = require('../../mocks/components/system-time')
jest.useFakeTimers().setSystemTime(SYSTEM_TIME)

const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')
const { BlobServiceClient } = require('@azure/storage-blob')
const { storageConfig } = require('../../../app/config')
const db = require('../../../app/data')
const saveStatement = require('../../../app/publishing/save-statement')
const publishStatement = require('../../../app/publishing/publish-statement')
const path = require('path')

const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')
let container

describe('publishStatement', () => {
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
    { name: 'statement', request: JSON.parse(JSON.stringify(require('../../mocks/messages/publish').STATEMENT_MESSAGE)).body }
  ])('When request is a $name', ({ request }) => {
    beforeEach(async () => {
      const blockBlobClient = container.getBlockBlobClient(`${storageConfig.folder}/${request.filename}`)
      await blockBlobClient.uploadFile(TEST_FILE)
    })

    describe('Duplicate request', () => {
      beforeEach(async () => {
        const transaction = await db.sequelize.transaction()
        await saveStatement(request, new Date(), transaction)
        await transaction.commit()
      })

      test('does not save a duplicate', async () => {
        const before = await db.statement.findAll()
        await publishStatement(request)
        const after = await db.statement.findAll()
        expect(before.length).toBe(1)
        expect(after.length).toBe(1)
      })

      test('does not send an email', async () => {
        await publishStatement(request)
        expect(mockNotifyClient().sendEmail).not.toHaveBeenCalled()
      })
    })

    describe('Non-duplicate request', () => {
      test('saves the request', async () => {
        const before = await db.statement.findAll()
        await publishStatement(request)
        const after = await db.statement.findAll()
        expect(before.length).toBe(0)
        expect(after.length).toBe(1)
      })

      test('sends an email via Notify', async () => {
        await publishStatement(request)
        expect(mockNotifyClient().sendEmail).toHaveBeenCalled()
      })
    })
  })
})
