const db = require('../data')
const { statement, delivery } = db
const getPersonalisation = require('../publishing/get-personalisation')
const publish = require('../publishing/publish')

const rescheduleDelivery = async (deliveryToReschedule) => {
  const transaction = await db.transaction()
  try {
    const timestamp = new Date()
    const statementRecord = (await statement(transaction).where({ statementId: deliveryToReschedule.statementId }).first()) ?? null
    const personalisation = getPersonalisation(statementRecord.schemeName, statementRecord.schemeShortName, statementRecord.schemeYear, statementRecord.schemeFrequency, statementRecord.businessName)
    const response = await publish(statementRecord.emailTemplate, statementRecord.email, statementRecord.filename, personalisation)
    await delivery(transaction).insert({ statementId: deliveryToReschedule.statementId, method: deliveryToReschedule.method, reference: response.data.id, requested: timestamp })
    await delivery(transaction).where({ deliveryId: deliveryToReschedule.deliveryId }).update({ completed: timestamp })
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = rescheduleDelivery
