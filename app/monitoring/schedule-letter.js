const { LETTER } = require('../constants/methods')
const db = require('../data')
const getStatementFileUrl = require('../publishing/get-statement-file-url')
const publish = require('../publishing/publish')

const scheduleLetter = async (delivery) => {
  const transaction = await db.sequelize.transaction()
  try {
    const timestamp = new Date()
    const statement = await db.statement.findOne({ where: { statementId: delivery.statementId }, transaction })
    const filename = getStatementFileUrl(statement?.filename)
    const response = await publish(statement.emailTemplate, statement.email, filename, null, LETTER)
    await db.delivery.create({ statementId: delivery.statementId, method: delivery.method, reference: response.data.id, requested: timestamp }, { transaction })
    await db.delivery.update({ completed: timestamp }, { where: { deliveryId: delivery.deliveryId }, transaction })
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = scheduleLetter
