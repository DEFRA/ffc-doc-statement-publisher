const db = require('../data')

const getStatementByStatementId = require('./get-statement-by-statement-id')
const sendCrmMessage = require('../messaging/send-crm-message')
const completeDelivery = require('./complete-delivery')
const createFailure = require('./create-failure')

const failed = async (delivery, reason) => {
  const transaction = await db.sequelize.transaction()
  try {
    const statement = await getStatementByStatementId(delivery.statementId)
    const deliveryId = delivery.deliveryId
    console.log(`Unable to deliver statement ${statement.filename} to ${statement.email}: ${reason}`)
    await sendCrmMessage(statement.email, statement.frn, reason)
    await completeDelivery(deliveryId, transaction)
    await createFailure(deliveryId, reason, transaction)
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = failed
