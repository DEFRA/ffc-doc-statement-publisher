const db = require('../data')

const saveDelivery = async (statementId, method, reference, timestamp, transaction) => {
  return db.delivery.create({
    statementId,
    method,
    reference,
    requested: timestamp
  }, { transaction })
}

module.exports = saveDelivery
