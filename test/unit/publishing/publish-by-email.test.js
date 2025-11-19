const config = require('../../../app/config')
const { mockNotifyClient } = require('../../mocks/modules/notifications-node-client')
const publishByEmail = require('../../../app/publishing/publish-by-email')
const EMAIL = require('../../mocks/components/email')
const FILE_BUFFER = require('../../mocks/components/file_buffer')
const PERSONALISATION = require('../../mocks/objects/notify-personalisation')
const EMAIL_TEMPLATE = require('../../mocks/components/notify-template-id')

describe('publishByEmail', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('notify client instantiation and prepareUpload', () => {
    test('calls mockNotifyClient with API key', async () => {
      await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
      expect(mockNotifyClient).toHaveBeenCalledWith(config.notifyApiKey)
      expect(mockNotifyClient).toHaveBeenCalledTimes(1)
    })

    test.each([
      [{ confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` }],
      [{ confirmEmailBeforeDownload: true, retentionPeriod: '78 weeks' }]
    ])('calls prepareUpload with FILE_BUFFER and options %o', async (options) => {
      await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
      expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(FILE_BUFFER, options)
      expect(mockNotifyClient().prepareUpload).toHaveBeenCalledTimes(1)
    })

    test('calls prepareUpload with filename when provided', async () => {
      const filename = 'testfile.txt'
      await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION, filename)
      expect(mockNotifyClient().prepareUpload).toHaveBeenCalledWith(
        FILE_BUFFER,
        { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks`, filename }
      )
    })
  })

  describe('sendEmail calls', () => {
    test('calls sendEmail with correct arguments', async () => {
      await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
      expect(mockNotifyClient().sendEmail).toHaveBeenCalledWith(
        EMAIL_TEMPLATE,
        EMAIL,
        { personalisation: { link_to_file: mockNotifyClient().prepareUpload(), ...PERSONALISATION } }
      )
      expect(mockNotifyClient().sendEmail).toHaveBeenCalledTimes(1)
    })

    test('returns sendEmail result', async () => {
      const result = await publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
      expect(result).toBe(await mockNotifyClient().sendEmail())
    })
  })

  describe('sendEmail retries', () => {
    test('retries once on failure and succeeds', (done) => {
      expect.assertions(1)
      mockNotifyClient().sendEmail.mockReturnValueOnce(Promise.reject(new Error('error')))
      publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION)
        .then(result => {
          expect(result.status).toEqual(200)
          done()
        })
        .catch(() => done())
    })

    test('fails after 4 retries', () => {
      expect.assertions(1)
      mockNotifyClient().sendEmail
        .mockRejectedValueOnce('error')
        .mockRejectedValueOnce('error')
        .mockRejectedValueOnce('error')
        .mockRejectedValueOnce('error')

      return expect(publishByEmail(EMAIL_TEMPLATE, EMAIL, FILE_BUFFER, PERSONALISATION))
        .rejects.toBe('error')
    })
  })
})
