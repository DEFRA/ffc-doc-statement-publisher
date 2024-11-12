const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const { retry, thunkify } = require('../retry')
const promisify = require('../promisify')

function setupNotifyClient () {
  const notifyClient = new NotifyClient(config.notifyApiKey)
  notifyClient.prepareUpload = promisify(notifyClient.prepareUpload).bind(notifyClient)
  notifyClient.sendEmail = promisify(notifyClient.sendEmail).bind(notifyClient)
  return notifyClient
}

/**
 * @param {Object} template
 * @param {String} email
 * @param {String} file
 * @param {Object} personalisation
 * @param {NotifyClient} notifyClient
 * @returns Thunk
 */
function setupEmailThunk (template, email, linkToFile, personalisation, notifyClient) {
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  return promisify(thunkify(notifyClient.sendEmail, template, email, {
    personalisation: {
      link_to_file: linkToFile,
      ...personalisation,
      latestDownloadDate
    }
  }))
}

const publishByEmail = async (template, email, file, personalisation) => {
  moment.locale('en-gb')
  const notifyClient = setupNotifyClient()
  const linkToFile = await notifyClient.prepareUpload(
    file,
    {
      confirmEmailBeforeDownload: true,
      retentionPeriod: `${config.retentionPeriodInWeeks} weeks`
    }
  )
  const thunk = setupEmailThunk(template, email, linkToFile, personalisation, notifyClient)
  return retry(thunk, 3, 100, true)
    .then(result => {
      return result
    })
    .catch((err) => {
      console.log(err)
      throw err
    })
}

module.exports = publishByEmail
