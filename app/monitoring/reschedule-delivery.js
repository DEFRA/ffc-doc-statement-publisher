const db = require('../data')
const getPersonalisation = require('../publishing/get-personalisation')
const publish = require('../publishing/publish')

const rescheduleDelivery = async (delivery) => {
  const transaction = await db.sequelize.transaction()
  try {
    const timestamp = new Date()
    const statement = await db.statement.findOne({ where: { statementId: delivery.statementId }, transaction })
    const personalisation = getPersonalisation(statement.schemeName, statement.schemeShortName, statement.schemeYear, statement.schemeFrequency, statement.businessName)
    const response = await publish(statement.emailTemplate, statement.email, statement.filename, personalisation)
    await db.delivery.create({ statementId: delivery.statementId, method: delivery.method, reference: response.data.id, requested: timestamp }, { transaction })
    await db.delivery.update({ completed: timestamp }, { where: { deliveryId: delivery.deliveryId }, transaction })
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = rescheduleDelivery
