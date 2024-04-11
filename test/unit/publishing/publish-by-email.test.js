const moment = require('moment')
const config = require('../../../app/config')

const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')

const publishByEmail = require('../../../app/publishing/publish-by-email')

const EMAIL = require('../../mocks/components/email')
const FILE_BUFFER = require('../../mocks/components/file_buffer')
const PERSONALISATION = require('../../mocks/objects/notify-personalisation')

describe('Publish by email', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call mockNotifyClient', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient).toHaveBeenCalled()
  })

  test('should call mockNotifyClient once', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient with config.notifyApiKey', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient).toHaveBeenCalledWith(config.notifyApiKey)
  })

  test('should call mockNotifyClient.prepareUpload', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.prepareUpload once', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient.prepareUpload with FILE_BUFFER and { confirmEmailBeforeDownload: true, retentionPeriod: config.retentionPeriodInWeeks weeks }', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(FILE_BUFFER, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` })
  })

  test('should call mockNotifyClient.prepareUpload with FILE_BUFFER and { confirmEmailBeforeDownload: true, retentionPeriod: 78 weeks }', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(FILE_BUFFER, { confirmEmailBeforeDownload: true, retentionPeriod: '78 weeks' })
  })

  test('should call mockNotifyClient.sendEmail', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().sendEmail).toHaveBeenCalled()
  })

  test('should call mockNotifyClient.sendEmail once', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(mockNotifyClient().sendEmail).toHaveBeenCalledTimes(1)
  })

  test('should call mockNotifyClient.sendEmail with config.notifyEmailTemplateKey, EMAIL, personalisation: { link_to_file: mockNotifyClient.prepareUpload, ...PERSONALISATION }}', async () => {
    await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)

    expect(mockNotifyClient().sendEmail).toHaveBeenCalledWith(config.notifyEmailTemplateKey, EMAIL, {
      personalisation: {
        link_to_file: mockNotifyClient().prepareUpload(),
        ...PERSONALISATION,
        latestDownloadDate: moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
      }
    })
  })

  test('should return mockNotifyClient.sendEmail', async () => {
    const result = await publishByEmail(EMAIL, FILE_BUFFER, PERSONALISATION)
    expect(result).toBe(await mockNotifyClient().sendEmail())
  })
})
