const db = require('../data')

const createFailure = async (deliveryId, errorObject, timestamp, transaction) => {
  await db.failure.create({
    deliveryId,
    reason: errorObject?.reason,
    failed: timestamp,
    statusCode: errorObject?.statusCode || null,
    error: errorObject?.error || null,
    message: errorObject?.message || null
  }, { transaction })
}

module.exports = createFailure
