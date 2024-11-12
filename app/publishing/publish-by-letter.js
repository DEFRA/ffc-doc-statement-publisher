const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const { retry, thunkify } = require('../retry')
const promisify = require('../promisify')

function setupNotifyClient () {
  const notifyClient = new NotifyClient(config.notifyApiKeyLetter)
  notifyClient.prepareUpload = promisify(notifyClient.prepareUpload).bind(notifyClient)
  notifyClient.sendLetter = promisify(notifyClient.sendLetter).bind(notifyClient)
  return notifyClient
}

/**
//  * @param {Object} template
//  * @param {String} email
 * @param {String} file
//  * @param {Object} personalisation
 * @param {NotifyClient} notifyClient
 * @returns Thunk
 */
function setupPrintThunk (linkToFile, notifyClient) {
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  return promisify(thunkify(notifyClient.sendLetter, {
    personalisation: {
      link_to_file: linkToFile,
      latestDownloadDate
    }
  }))
}

const publishByLetter = async (file) => {
  moment.locale('en-gb')
  const notifyClient = setupNotifyClient()
  const pdfFile = await notifyClient.prepareUpload(
    file
  )
  const thunk = setupPrintThunk(pdfFile, notifyClient)
  return retry(thunk, 3, 100, true)
    .then(result => {
      return result
    })
    .catch((err) => {
      console.log(err)
      throw err
    })
}

module.exports = publishByLetter
