const db = require('../data')

const createFailure = async (deliveryId, reason, transaction) => {
  await db.failure.create({
    deliveryId,
    reason,
    failed: new Date()
  }, { transaction })
}

module.exports = createFailure
