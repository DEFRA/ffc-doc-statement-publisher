const db = require('../data')

const saveStatement = require('./save-statement')
const sendCrmMessage = require('../messaging/send-crm-message')
const createFailure = require('../monitoring/create-failure')
const saveDelivery = require('./save-delivery')
const { EMPTY, INVALID, REJECTED } = require('../constants/failure-reasons')

const trySendCrmMessage = async (email, frn, reason) => {
  try {
    await sendCrmMessage(email, frn, reason)
  } catch (error) {
    console.error('Error sending CRM message:', error.message)
  }
}

const saveRequest = async (request, reference, method, errorObject) => {
  const transaction = await db.sequelize.transaction()
  try {
    const timestamp = new Date()
    const statement = await saveStatement(request, timestamp, transaction)
    const delivery = await saveDelivery(statement.statementId, method, reference, timestamp, transaction)

    if (errorObject?.reason) {
      console.log(`Unable to deliver statement ${statement.filename} to "${statement.email}": ${errorObject.reason}`)
      await createFailure(delivery.deliveryId, errorObject, timestamp, transaction)

      if ([EMPTY, INVALID, REJECTED].includes(errorObject.reason) && statement.email && statement.frn) {
        await trySendCrmMessage(statement.email, statement.frn, errorObject.reason)
      }
    }

    await transaction.commit()
    console.log(`Request saved successfully in ${new Date() - timestamp}ms. StatementId: ${statement.statementId}`)
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = saveRequest
