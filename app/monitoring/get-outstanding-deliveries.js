const { EMAIL } = require('../constants/methods')
const { delivery: DELIVERIES, statement: STATEMENTS } = require('../constants/tables')
const db = require('../database')
const { delivery } = db

const getOutstandingDeliveries = async (options = {}) => {
  const {
    limit = 100,
    lastProcessedId = 0,
    includeStatement = false
  } = options

  const query = delivery()
    .where('deliveryId', '>', lastProcessedId)
    .whereNotNull('reference')
    .where({ method: EMAIL, completed: null })
    .orderBy('deliveryId', 'asc')
    .limit(limit)

  if (includeStatement) {
    query
      .select(`${DELIVERIES}.*`, db.client.raw(`row_to_json(${STATEMENTS}.*) as statement`))
      .leftJoin(STATEMENTS, `${STATEMENTS}.statementId`, `${DELIVERIES}.statementId`)
  }

  return query
}

const processAllOutstandingDeliveries = async (processFn, fetchFunction, batchSize = 100) => {
  const fetchDeliveries = fetchFunction || getOutstandingDeliveries

  const processBatch = async (lastProcessedId, totalProcessed, batchCount) => {
    const deliveries = await fetchDeliveries({
      limit: batchSize,
      lastProcessedId
    })

    if (deliveries.length === 0) {
      return { totalProcessed, batchCount }
    }

    const results = await processFn(deliveries)

    const processedCount = Array.isArray(results)
      ? results.filter(result => result.success === true).length
      : deliveries.length

    return processBatch(
      deliveries[deliveries.length - 1].deliveryId,
      totalProcessed + processedCount,
      batchCount + 1
    )
  }

  return processBatch(0, 0, 0)
}

module.exports = {
  getOutstandingDeliveries,
  processAllOutstandingDeliveries
}
