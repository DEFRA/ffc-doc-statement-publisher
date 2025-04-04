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
  let processedCount = 0

  do {
    deliveries = await getOutstandingDeliveries({
      limit: batchSize,
      offset
    })

    if (deliveries.length > 0) {
      await Promise.all(deliveries.map(processFn))
      processedCount += deliveries.length
    }

    offset += batchSize
  } while (deliveries.length === batchSize)

  return processedCount
}

module.exports = {
  getOutstandingDeliveries,
  processAllOutstandingDeliveries
}
