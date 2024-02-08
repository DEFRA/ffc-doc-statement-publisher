const db = require('../data')

const saveStatement = require('./save-statement')
const sendCrmMessage = require('../messaging/send-crm-message')
const createFailure = require('../monitoring/create-failure')

const saveRequest = async (request, reference, method, reason) => {
  const transaction = await db.sequelize.transaction()
  try {
    const timestamp = new Date()
    const statement = await saveStatement(request, timestamp, transaction)
    const delivery = await saveDelivery(statement.statementId, method, reference, timestamp, transaction)
    if (reason) {
      console.log(`Unable to deliver statement ${statement.filename} to "${statement.email}": ${reason}`)
      await sendCrmMessage(statement.email, statement.frn, reason)
      await createFailure(delivery.deliveryId, reason, transaction)
    }
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

const saveDelivery = async (statementId, method, reference, timestamp, transaction) => {
  return db.delivery.create({
    statementId,
    method,
    reference,
    requested: timestamp
  }, { transaction })
}

module.exports = saveRequest
