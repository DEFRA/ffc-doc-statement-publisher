const { failure } = require('../database')

const createFailure = async (deliveryId, errorObject, timestamp, transaction) => {
  await failure(transaction ?? undefined).insert({
    deliveryId,
    reason: errorObject?.reason,
    failed: timestamp,
    statusCode: errorObject?.statusCode || null,
    error: errorObject?.error || null,
    message: errorObject?.message || null
  })
}

module.exports = createFailure
