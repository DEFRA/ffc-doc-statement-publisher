const db = require('../data')

const getStatementByStatementId = require('./get-statement-by-statement-id')
const sendCrmMessage = require('../messaging/send-crm-message')
const completeDelivery = require('./complete-delivery')
const createFailure = require('./create-failure')
const config = require('../config')

const failed = async (delivery, failure) => {
  const transaction = await db.sequelize.transaction()
  try {
    const statement = await getStatementByStatementId(delivery.statementId)
    const deliveryId = delivery.deliveryId
    const timestamp = Date.now()
    console.log(`Unable to deliver statement ${statement.filename} to ${statement.email}: ${failure?.reason}`)
    if (config.sendCrmFailureMessageEnabled) {
      await sendCrmMessage(statement.email, statement.frn, failure?.reason)
    }
    await completeDelivery(deliveryId, transaction)
    await createFailure(deliveryId, failure, timestamp, transaction)
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = failed
