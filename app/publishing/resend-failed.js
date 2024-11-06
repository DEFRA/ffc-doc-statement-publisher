const db = require('../data')
const { LETTER } = require('../constants/methods')
const getFailuresToResendAsLetters = require('./get-failures-to-resend-as-letters')
const getStatementFileUrl = require('./get-statement-file-url')
const updateFailureSent = require('./update-failure-sent')
const getPrimaryKeyValue = require('./get-primary-key-value')
const sendMessage = require('../messaging/send-message')
const validateUpdate = require('./validate-letter-statement.js')
const config = require('../config')

const resendFailed = async () => {
    const transaction = await db.sequelize.transaction()
    let totalPublished = 0

    try {
        const failures = await getFailuresToResendAsLetters(transaction)
        const outstanding = await getLetterSendMessages(failures, transaction)
        for (const unpublished of outstanding) {
          unpublished.statementFileUrl = getStatementFileUrl( unpublished.filename )
          const isValid = validateUpdate(unpublished)
          if (isValid) {
            await sendMessage(unpublished, config.publishSubscription.type, config.publishSubscription)
            const primaryKey = getPrimaryKeyValue(unpublished, 'failures')
            await updateFailureSent(primaryKey, transaction)
            totalPublished++
          }
        }
        await transaction.commit()
        console.log('%i %s statements published', totalPublished, LETTER)
      } catch (err) {
        await transaction.rollback()
        throw err
      }
}

module.exports = resendFailed