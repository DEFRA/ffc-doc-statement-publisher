const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')

const publishByEmail = async (template, email, file, personalisation) => {
  moment.locale('en-gb')
  const notifyClient = new NotifyClient(config.notifyApiKey)
  console.log(`Test-Env-Stage3-Publishing ${notifyClient} to ${email}`)
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  console.log(`Test-Env-Stage4-Publishing ${latestDownloadDate} to ${email}`)
  const notifyAttachment = await notifyClient.prepareUpload(file, { confirmEmailBeforeDownload: true, retentionPeriod: `${config.retentionPeriodInWeeks} weeks` })
  console.log(`Test-Env-Stage5-Publishing ${template} to ${email}`)
  return notifyClient.sendEmail(template, email, {
    personalisation: {
      link_to_file: notifyAttachment,
      ...personalisation,
      latestDownloadDate
    }
  })
}

module.exports = publishByEmail
