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

const processAllOutstandingDeliveries = async (processFn, batchSize = 100) => {
  let offset = 0
  let deliveries
  let totalProcessed = 0
  let batchCount = 0

  do {
    deliveries = await getOutstandingDeliveries({
      limit: batchSize,
      offset
    })

    if (deliveries.length > 0) {
      batchCount++
      // Pass the entire batch to the processFn, instead of mapping over individual deliveries
      const results = await processFn(deliveries)
      // Count successful operations if results contain success information
      if (Array.isArray(results)) {
        const successCount = results.filter(result => result.success === true).length
        totalProcessed += successCount
      } else {
        totalProcessed += deliveries.length
      }
    }

    offset += batchSize
  } while (deliveries.length === batchSize)

  return { totalProcessed, batchCount }
}

module.exports = {
  getOutstandingDeliveries,
  processAllOutstandingDeliveries
}
