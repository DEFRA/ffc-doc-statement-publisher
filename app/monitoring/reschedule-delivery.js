const db = require('../data')
const getPersonalisation = require('../publishing/get-personalisation')
const publish = require('../publishing/publish')

const rescheduleDelivery = async (delivery) => {
  const transaction = await db.transaction()
  try {
    const timestamp = new Date()
    const statement = (await db.statement(transaction).where({ statementId: delivery.statementId }).first()) ?? null
    const personalisation = getPersonalisation(statement.schemeName, statement.schemeShortName, statement.schemeYear, statement.schemeFrequency, statement.businessName)
    const response = await publish(statement.emailTemplate, statement.email, statement.filename, personalisation)
    await db.delivery(transaction).insert({ statementId: delivery.statementId, method: delivery.method, reference: response.data.id, requested: timestamp })
    await db.delivery(transaction).where({ deliveryId: delivery.deliveryId }).update({ completed: timestamp })
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = rescheduleDelivery
