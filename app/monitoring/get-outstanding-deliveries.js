const { EMAIL } = require('../constants/methods')
const { delivery: DELIVERIES, statement: STATEMENTS } = require('../constants/tables')
const db = require('../data')
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

  let totalProcessed = 0
  let batchCount = 0
  let lastProcessedId = 0

  while (true) {
    const deliveries = await fetchDeliveries({
      limit: batchSize,
      lastProcessedId
    })

    if (deliveries.length === 0) {
      break
    }

    batchCount++

    const results = await processFn(deliveries)

    if (Array.isArray(results)) {
      const successCount = results.filter(result => result.success === true).length
      totalProcessed += successCount
    } else {
      totalProcessed += deliveries.length
    }

    lastProcessedId = deliveries[deliveries.length - 1].deliveryId
  }

  return { totalProcessed, batchCount }
}

module.exports = {
  getOutstandingDeliveries,
  processAllOutstandingDeliveries
}
