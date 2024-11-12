const moment = require('moment')
const config = require('../../../app/config')

jest.mock('notifications-node-client')

const { NotifyClient } = require('notifications-node-client')
const publishByEmail = require('../../../app/publishing/publish-by-email')

const EMAIL = require('../../mocks/components/email')
const FILE_BUFFER = require('../../mocks/components/file_buffer')
const PERSONALISATION = require('../../mocks/objects/notify-personalisation')
const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

describe('Publish by email', () => {
  const prepareUploadMock = jest.fn()
  const sendEmailMock = jest.fn()
  const mockNotifyClientInstance = {
    prepareUpload: prepareUploadMock,
    sendEmail: sendEmailMock
  }

  beforeEach(() => {
    NotifyClient.mockImplementation(() => mockNotifyClientInstance)
    jest.clearAllMocks()
  })

  test('should instantiate NotifyClient with config.notifyApiKey', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(NotifyClient).toHaveBeenCalledWith(config.notifyApiKey)
  })

  test('should call notifyClient.prepareUpload with correct arguments', async () => {
    prepareUploadMock.mockResolvedValueOnce('mockLinkToFile')
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(prepareUploadMock).toHaveBeenCalledWith(FILE_BUFFER, {
      confirmEmailBeforeDownload: true,
      retentionPeriod: `${config.retentionPeriodInWeeks} weeks`
    })
  })

  test('should call notifyClient.sendEmail with correct arguments', async () => {
    const mockLinkToFile = 'mockLinkToFile'
    prepareUploadMock.mockResolvedValueOnce(mockLinkToFile)
    sendEmailMock.mockResolvedValueOnce({ status: 200 })
    const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')

    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)

    expect(sendEmailMock).toHaveBeenCalledWith(EMAIL_TEMPLATE, EMAIL, {
      personalisation: {
        link_to_file: mockLinkToFile,
        ...PERSONALISATION,
        latestDownloadDate
      }
    })
  })

  test('should retry sendEmail on failure and succeed', async () => {
    const error = new Error('error')
    prepareUploadMock.mockResolvedValueOnce('mockLinkToFile')
    sendEmailMock
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ status: 200 })

    const result = await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)

    expect(sendEmailMock).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ status: 200 })
  })

  test('should fail after retries on sendEmail failure', async () => {
    const error = new Error('error')
    prepareUploadMock.mockResolvedValueOnce('mockLinkToFile')
    sendEmailMock.mockRejectedValueOnce(error)
    await expect(publishByEmail()).rejects.toThrow('error')
  })

  test('should return result from sendEmail', async () => {
    const mockLinkToFile = 'mockLinkToFile'
    const mockResponse = { status: 200 }
    prepareUploadMock.mockResolvedValueOnce(mockLinkToFile)
    sendEmailMock.mockResolvedValueOnce(mockResponse)

    const result = await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)

    expect(result).toBe(mockResponse)
  })

  test('should set locale to en-gb', async () => {
    const localeSpy = jest.spyOn(moment, 'locale')
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(localeSpy).toHaveBeenCalledWith('en-gb')
  })

  test('should calculate latestDownloadDate correctly', async () => {
    const mockLinkToFile = 'mockLinkToFile'
    prepareUploadMock.mockResolvedValueOnce(mockLinkToFile)
    sendEmailMock.mockResolvedValueOnce({ status: 200 })

    const formatSpy = jest.spyOn(moment.prototype, 'format')

    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)

    expect(formatSpy).toHaveBeenCalledWith('LL')
  })
})
