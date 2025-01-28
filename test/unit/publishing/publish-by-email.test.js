const moment = require('moment')
const config = require('../../../app/config')

const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')

const publishByEmail = require('../../../app/publishing/publish-by-email')

const EMAIL = require('../../mocks/components/email')
const FILE_BUFFER = require('../../mocks/components/file_buffer')
const PERSONALISATION = require('../../mocks/objects/notify-personalisation')
const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

describe('Publish by email', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call mockNotifyClient', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient).toHaveBeenCalled()
  })

  test('should call mockNotifyClient once', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient with config.notifyApiKey', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient).toHaveBeenCalledWith(config.notifyApiKey)
  })

  test('should call mockNotifyClient.prepareUpload', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.prepareUpload once', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient.prepareUpload with FILE_BUFFER and { confirmEmailBeforeDownload: true, retentionPeriod: config.retentionPeriodInWeeks weeks }', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(FILE_BUFFER, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` })
  })

  test('should call mockNotifyClient.prepareUpload with FILE_BUFFER and { confirmEmailBeforeDownload: true, retentionPeriod: 78 weeks }', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(FILE_BUFFER, { confirmEmailBeforeDownload: true, retentionPeriod: '78 weeks' })
  })

  test('should call mockNotifyClient.sendEmail', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().sendEmail).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.sendEmail once', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().sendEmail).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient.sendEmail with EMAIL_TEMPLATE, EMAIL, personalisation: { link_to_file: mockNotifyClient.prepareUpload, ...PERSONALISATION }}', async () => {
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)

    expect(mockNotifyClient().sendEmail).toHaveBeenCalledWith(EMAIL_TEMPLATE, EMAIL, {
      personalisation: {
        link_to_file: mockNotifyClient().prepareUpload(),
        ...PERSONALISATION,
        latestDownloadDate: moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
      }
    })
  })

  test('should record email send failure and retry once and succeed', (done) => {
    expect.assertions(1)
    mockNotifyClient().sendEmail.mockReturnValueOnce(Promise.reject(new Error('error')))
    publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
      .then(result => {
        expect(result.status).toEqual(200)
        done()
      })
      .catch((e) => {
        done()
      })
  })

  test('should record email send failure and retry thrice and fail', () => {
    expect.assertions(1)
    mockNotifyClient().sendEmail
      .mockRejectedValueOnce('error')
      .mockRejectedValueOnce('error')
      .mockRejectedValueOnce('error')
      .mockRejectedValueOnce('error')

    return expect(publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION))
      .rejects.toBe('error')
  })

  test('should return mockNotifyClient.sendEmail', async () => {
    const result = await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(result).toBe(await mockNotifyClient().sendEmail())
  })

  test('should call mockNotifyClient.prepareUpload with FILE_BUFFER and { confirmEmailBeforeDownload: true, retentionPeriod: config.retentionPeriodInWeeks weeks, filename: "testfile.txt" } when filename is provided', async () => {
    const filename = 'testfile.txt'
    await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION, filename)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(FILE_BUFFER, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks`, filename })
  })
})
