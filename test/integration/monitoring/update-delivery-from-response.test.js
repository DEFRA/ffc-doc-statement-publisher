let mockSendEmail
const MOCK_PREPARED_FILE = 'mock-prepared-file'
const MOCK_URL = 'http://mock.url'
let mockPrepareUpload
let mockSendPrecompiledLetter
const mockGetStatementFileUrl = jest.fn()
const mockFetchStatementFile = jest.fn()

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail,
    prepareUpload: mockPrepareUpload,
    sendPrecompiledLetter: mockSendPrecompiledLetter
  }))
}))
jest.mock('ffc-messaging')
jest.mock('../../../app/publishing/get-statement-file-url', () => mockGetStatementFileUrl)
jest.mock('../../../app/publishing/fetch-statement-file', () => mockFetchStatementFile)

const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config/storage')
const db = require('../../../app/data')
const updateDeliveryFromResponse = require('../../../app/monitoring/update-delivery-from-response')
const path = require('path')
const { DELIVERED, SENDING, CREATED, TEMPORARY_FAILURE, PERMANENT_FAILURE, TECHNICAL_FAILURE } = require('../../../app/constants/statuses')
const { REJECTED, INVALID } = require('../../../app/constants/failure-reasons')
const { mockStatement1 } = require('../../mocks/statement')
const { mockDelivery1 } = require('../../mocks/delivery')

const FILE_NAME = 'FFC_PaymentStatement_DP_2024_1234567890_2022080515301012.pdf'
const TEST_FILE = path.resolve(__dirname, '../../files/test.pdf')

let blobServiceClient
let container

describe('updateDeliveryFromResponse', () => {
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
    await db.statement.bulkCreate([mockStatement1])
    await db.delivery.bulkCreate([mockDelivery1])

    mockSendEmail = jest.fn().mockResolvedValue({ data: { id: mockDelivery1.reference } })
    mockPrepareUpload = jest.fn().mockReturnValue(MOCK_PREPARED_FILE)
    mockSendPrecompiledLetter = jest.fn().mockResolvedValue({ data: { id: mockDelivery1.reference } })
    mockFetchStatementFile.mockReturnValue(MOCK_PREPARED_FILE)
    mockGetStatementFileUrl.mockReturnValue(MOCK_URL)
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test.each([
    { status: DELIVERED, complete: true, failure: null },
    { status: SENDING, complete: false, failure: null },
    { status: CREATED, complete: false, failure: null },
    { status: TEMPORARY_FAILURE, complete: true, failure: { reason: REJECTED } },
    { status: PERMANENT_FAILURE, complete: true, failure: { reason: INVALID } },
    { status: TECHNICAL_FAILURE, complete: true, failure: null }
  ])('should handle status %s', async ({ status, complete, failure }) => {
    await updateDeliveryFromResponse(mockDelivery1, { data: { status } })
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(!!delivery.completed).toBe(complete)

    if (failure) {
      const fail = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
      expect(fail).not.toBeNull()
      expect(fail.reason).toBe(failure.reason)
      expect(fail.failed).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
    } else if ([TEMPORARY_FAILURE, PERMANENT_FAILURE].includes(status) === false) {
      // For technical failure, a new delivery is created
      if (status === TECHNICAL_FAILURE) {
        const deliveries = await db.delivery.findAll({ where: { statementId: mockDelivery1.statementId } })
        expect(deliveries.length).toBe(2)
        const newDelivery = await db.delivery.findOne({ where: { statementId: mockDelivery1.statementId, completed: null } })
        expect(newDelivery.requested).toStrictEqual(new Date(2022, 7, 5, 15, 30, 10, 120))
      }

      // Emails sent for technical failure
      if (status === TECHNICAL_FAILURE) {
        expect(mockSendEmail).toHaveBeenCalledTimes(1)
        const emailArgs = mockSendEmail.mock.calls[0][2].personalisation
        expect(emailArgs.link_to_file).toBe(MOCK_PREPARED_FILE)
        expect(emailArgs.schemeName).toBe(mockStatement1.schemeName)
        expect(emailArgs.schemeShortName).toBe(mockStatement1.schemeShortName)
        expect(emailArgs.schemeFrequency.toLowerCase()).toBe(mockStatement1.schemeFrequency.toLowerCase())
        expect(emailArgs.schemeYear).toBe(mockStatement1.schemeYear)
        expect(emailArgs.businessName).toBe(mockStatement1.businessName)
      }
    }
  })

  test.each([
    { data: {} },
    {}
  ])('should not complete delivery or create failure if status missing or data missing: %o', async (response) => {
    await updateDeliveryFromResponse(mockDelivery1, response)
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toBeNull()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure).toBeNull()
  })

  test('should not complete delivery or create failure if status unknown', async () => {
    await updateDeliveryFromResponse(mockDelivery1, { data: { status: 'unknown' } })
    const delivery = await db.delivery.findByPk(mockDelivery1.deliveryId)
    expect(delivery.completed).toBeNull()
    const failure = await db.failure.findOne({ where: { deliveryId: mockDelivery1.deliveryId } })
    expect(failure).toBeNull()
  })
})
