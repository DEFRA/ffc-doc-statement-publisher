const db = require('../data')
const saveStatement = require('./save-statement')
const sendCrmMessage = require('../messaging/send-crm-message')
const createFailure = require('../monitoring/create-failure')
const saveDelivery = require('./save-delivery')
const saveRequest = async (request, reference, method, errorObject) => {
  // Start performance measurement
  const startTime = Date.now()
  const transaction = await db.sequelize.transaction()

  try {
    const timestamp = new Date()

    const statement = await saveStatement(request, timestamp, transaction)
    const delivery = await saveDelivery(statement.statementId, method, reference, timestamp, transaction)

    if (errorObject?.reason) {
      console.log(`Unable to deliver statement ${statement.filename} to "${statement.email}": ${errorObject.reason}`)

      await createFailure(delivery.deliveryId, errorObject, timestamp, transaction)
    }

    await transaction.commit()

    if (errorObject?.reason && statement.email && statement.frn) {
      await sendCrmMessage(statement.email, statement.frn, errorObject.reason)
        .catch(err => console.error('Error sending CRM message:', err))
    }

    const duration = Date.now() - startTime
    console.log(`Request saved successfully in ${duration}ms. StatementId: ${statement.statementId}`)
  } catch (err) {
    await transaction.rollback()
    console.error('Failed to save request:', err)
    throw err
  }
}

module.exports = saveRequest
