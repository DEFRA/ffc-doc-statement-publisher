const db = require('../data')

const getOutstandingDeliveries = async (options = {}) => {
  const {
    limit = 100,
    lastProcessedId = 0,
    includeStatement = false
  } = options

  const queryOptions = {
    where: {
      deliveryId: { [db.Sequelize.Op.gt]: lastProcessedId },
      reference: { [db.Sequelize.Op.not]: null },
      completed: null
    },
    limit,
    order: [['deliveryId', 'ASC']]
  }

  if (includeStatement) {
    queryOptions.include = [
      {
        model: db.statement,
        as: 'statement',
        required: false
      }
    ]
  }
  return db.delivery.findAll(queryOptions)
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

    if (deliveries.length === 0) break

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
