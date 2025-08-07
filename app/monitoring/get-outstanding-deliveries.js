const db = require('../data')

const getOutstandingDeliveries = async (options = {}) => {
  const {
    limit = 100,
    offset = 0,
    includeStatement = false
  } = options

  const queryOptions = {
    where: {
      reference: { [db.Sequelize.Op.not]: null },
      completed: null
    },
    limit,
    offset,
    order: [['requested', 'ASC']]
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
  let offset = 0

  // First fetch
  let deliveries = await fetchDeliveries({
    limit: batchSize,
    offset
  })

  while (deliveries.length > 0) {
    batchCount++

    const results = await processFn(deliveries)

    if (Array.isArray(results)) {
      const successCount = results.filter(result => result.success === true).length
      totalProcessed += successCount
    } else {
      totalProcessed += deliveries.length
    }

    offset += batchSize
    //  CRITICAL: This will always be called once more after the last batch
    deliveries = await fetchDeliveries({
      limit: batchSize,
      offset
    })
  }

  return { totalProcessed, batchCount }
}

module.exports = {
  getOutstandingDeliveries,
  processAllOutstandingDeliveries
}
