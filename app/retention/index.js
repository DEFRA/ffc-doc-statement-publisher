const db = require('../data')
const { deleteStatement } = require('../storage')
const { findDeliveries } = require('./find-deliveries')
const { findStatements } = require('./find-statements')
const { removeDeliveries } = require('./remove-deliveries')
const { removeFailures } = require('./remove-failures')
const { removeStatements } = require('./remove-statements')

const removeAgreementData = async (retentionData) => {
  const transaction = await db.sequelize.transaction()
  try {
    const { documentReference, filename } = retentionData

    const statements = await findStatements(documentReference, filename, transaction)
    const statementIds = statements.map(s => s.statementId)
    if (statements.length === 0) {
      await transaction.commit()
      return
    }

    const deliveries = await findDeliveries(statementIds, transaction)
    const deliveryIds = deliveries.map(d => d.deliveryId)

    await removeFailures(deliveryIds, transaction)
    await removeDeliveries(deliveryIds, transaction)
    await removeStatements(statementIds, transaction)

    await deleteStatement(filename)

    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = {
  removeAgreementData
}
