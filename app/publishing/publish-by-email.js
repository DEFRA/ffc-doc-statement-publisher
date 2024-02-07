const config = require('../config')
const { NotifyClient } = require('notifications-node-client')

const publishByEmail = async (email, file, personalisation) => {
  const notifyClient = new NotifyClient(config.notifyApiKey)
  return notifyClient.sendEmail(config.notifyEmailTemplateKey, email, {
    personalisation: {
      link_to_file: notifyClient.prepareUpload(file, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` }),
      ...personalisation
    }
  })
}

module.exports = publishByEmail
