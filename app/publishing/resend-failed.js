const db = require('../data')
const { LETTER } = require('../constants/methods')
const getFailuresToResendAsLetters = require('./get-failures-to-resend-as-letters')
const getStatementFileUrl = require('./get-statement-file-url')
const updateFailureSent = require('./update-failure-sent')
const getPrimaryKeyValue = require('./get-primary-key-value')
const sendMessage = require('../messaging/send-message')
const validateRequest = require('../messaging/validate-request')
const getStatementRequestObject = require('./get-statement-request-object')
const config = require('../config')

const resendFailed = async () => {
    const transaction = await db.sequelize.transaction()
    let totalPublished = 0

    try {
        const failures = await getFailuresToResendAsLetters(transaction)
        for (const failure of failures) {
          const statementFileUrl = getStatementFileUrl( unpublished.filename )
          const request = getStatementRequestObject({ ...failure, ...{ statementFileUrl } })
          validateRequest(request)
          await sendMessage(request, config.publishSubscription.type, config.publishSubscription)
          const primaryKey = getPrimaryKeyValue(failure, 'failures')
          await updateFailureSent(primaryKey, transaction)
          totalPublished++
        }
        await transaction.commit()
        console.log('%i %s statements published', totalPublished, LETTER)
      } catch (err) {
        await transaction.rollback()
        throw err
      }
}

module.exports = resendFailed