const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')

const publishByEmail = async (template, email, file, personalisation) => {
  moment.locale('en-gb')
  const notifyClient = new NotifyClient(config.notifyApiKey)
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  const notifyAttachment = await notifyClient.prepareUpload(file, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` })
  return notifyClient.sendEmail(template, email, {
    personalisation: {
      link_to_file: notifyAttachment,
      ...personalisation,
      latestDownloadDate
    }
  })
}

module.exports = publishByEmail
