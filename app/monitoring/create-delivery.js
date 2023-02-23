const db = require('../data')

const createDelivery = async (statementId, method, reference, requested, transaction) => {
  await db.delivery.create({
    statementId,
    method,
    reference,
    requested
  }, { transaction })
}

module.exports = createDelivery
