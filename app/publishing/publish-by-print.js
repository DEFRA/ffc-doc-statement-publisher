const moment = require('moment')
const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const { retry, thunkify } = require('../retry')
const promisify = require('../promisify')

function setupNotifyClient () {
  const notifyClient = new NotifyClient(config.notifyApiKeyLetter)
  notifyClient.prepareUpload = promisify(notifyClient.prepareUpload)
  notifyClient.sendLetter = promisify(notifyClient.sendLetter)
  return notifyClient
}

/**
 * Creates a thunk for the retry mechanism
 * A thunk is basically an instance of a function call along with parameter values that can be evaluated at any time
 * For example the following function
 * function toBeThunked(a,b) return a+b
 * Can be turned into a thunk like this
 * function thunkify(fn){
 *   const args = [].slice.call(arguments, 1)
 *   return function(cb) {
 *     args.push(cb)
 *     return fn.apply(null,args)
 *   }
 * }
 * const thunk = thunkify(toBeThunked, 2, 2)
 * console.log(thunk()) // prints 4
 * console.log(thunk()) // prints 4 again even though we did nothing different
 *
 *
//  * @param {Object} template
//  * @param {String} email
 * @param {String} file
//  * @param {Object} personalisation
 * @param {NotifyClient} notifyClient
 * @returns Thunk
 */
function setupPrintThunk (linkToFile, notifyClient) {
  const latestDownloadDate = moment(new Date()).add(config.retentionPeriodInWeeks, 'weeks').format('LL')
  return promisify(thunkify(notifyClient.sendEmail, {
    personalisation: {
      link_to_file: linkToFile,
      latestDownloadDate
    }
  }))
}

const publishByPrint = async (file) => {
  moment.locale('en-gb')
  const notifyClient = setupNotifyClient()
  const pdfFile = await notifyClient.prepareUpload(
    file
  )
  const thunk = setupPrintThunk(pdfFile, notifyClient)
  return retry(thunk, 3, 100, true)
    .then(result => {
      console.log(result)
      return result
    })
    .catch((err) => {
      console.log(err)
      throw err
    })
}

module.exports = publishByPrint
