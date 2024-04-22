const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')

const publishByEmail = async (template, email, file, personalisation) => {
  const notifyClient = new NotifyClient(config.notifyApiKey)
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  return notifyClient.sendEmail(template, email, {
    personalisation: {
      link_to_file: notifyClient.prepareUpload(file, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` }),
      ...personalisation,
      latestDownloadDate
    }
  })
}

module.exports = publishByEmail
