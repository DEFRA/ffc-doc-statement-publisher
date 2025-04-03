const db = require('../data')

const getOutstandingDeliveries = async (options = {}) => {
  const {
    limit = 100,
    offset = 0,
    includeStatement = false
  } = options

  return db.delivery.findAll({
    attributes: ['deliveryId', 'statementId', 'method', 'reference', 'requested'],
    where: {
      completed: null,
      reference: {
        [db.Sequelize.Op.ne]: null
      }
    },
    include: includeStatement
      ? [{
          model: db.statement,
          as: 'statement',
          required: false
        }]
      : [],
    order: [['requested', 'ASC']],
    limit,
    offset
  })
}

const processAllOutstandingDeliveries = async (processFn, batchSize = 100) => {
  let offset = 0
  let batchCount = 0
  let totalProcessed = 0
  let batch

  do {
    batch = await getOutstandingDeliveries({ limit: batchSize, offset })

    if (batch.length > 0) {
      await processFn(batch)
      totalProcessed += batch.length
      batchCount++
    }

    offset += batchSize
  } while (batch.length === batchSize)

  return { totalProcessed, batchCount }
}

module.exports = {
  getOutstandingDeliveries,
  processAllOutstandingDeliveries
}
