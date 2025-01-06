const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const { retry } = require('../retry')

function setupEmailRequest (template, email, linkToFile, personalisation, notifyClient) {
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  return () => {
    return notifyClient.sendEmail(template, email, {
      personalisation: {
        link_to_file: linkToFile,
        ...personalisation,
        latestDownloadDate
      }
    })
  }
}

const publishByEmail = async (template, email, file, personalisation, filename = null) => {
  moment.locale('en-gb')
  const notifyClient = new NotifyClient(config.notifyApiKey)
  const fileOptions = {
    confirmEmailBeforeDownload: true,
    retentionPeriod: `${config.retentionPeriodInWeeks} weeks`
  }
  if (filename) {
    fileOptions.filename = filename
  }
  const linkToFile = await notifyClient.prepareUpload(
    file,
    fileOptions
  )
  const emailRequest = setupEmailRequest(template, email, linkToFile, personalisation, notifyClient)
  return retry(emailRequest, 3, 100, true)
    .then(result => {
      return result
    })
    .catch((err) => {
      console.log(err)
      throw err
    })
}

module.exports = publishByEmail
