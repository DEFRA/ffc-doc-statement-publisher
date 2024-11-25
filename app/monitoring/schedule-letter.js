const { LETTER } = require('../constants/methods')
const db = require('../data')
const publish = require('../publishing/publish')
const isDpSchema = require('../publishing/is-dp-scheme')

const scheduleLetter = async (delivery) => {
  const transaction = await db.sequelize.transaction()
  try {
    const timestamp = new Date()
    const statement = await db.statement.findOne({ where: { statementId: delivery.statementId }, transaction })

    if (isDpSchema(statement?.schemeShortName)) {
      const response = await publish(statement.emailTemplate, statement.email, statement?.filename, null, LETTER)
      await db.delivery.create({ statementId: delivery.statementId, method: delivery.method, reference: response.data.id, requested: timestamp }, { transaction })
      await db.delivery.update({ completed: timestamp }, { where: { deliveryId: delivery.deliveryId }, transaction })
    } else {
      console.log('Letter not scheduled as not DP schema.')
    }

    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = scheduleLetter
