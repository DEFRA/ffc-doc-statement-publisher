const db = require('../data')

const createFailure = async (deliveryId, errorObject, timestamp, transaction) => {
  await db.failure.create({
    deliveryId,
    reason: errorObject.reason,
    failed: timestamp,
    statusCode: errorObject.statusCode,
    error: errorObject.error,
    message: errorObject.message
  }, { transaction })
}

module.exports = createFailure
