const db = require('../data')
const QueryStream = require('pg-query-stream')

const getDeliveriesForReport = async (schemeName, start, end, transaction) => {
  console.log('get deliveries', {
    schemeName,
    start,
    end
  })

  const query = `
    SELECT d.*, s.*, f.*
    FROM deliveries d
    INNER JOIN statements s ON d."statementId" = s."statementId"
    LEFT JOIN failures f ON d."deliveryId" = f."deliveryId"
    WHERE s."schemeName" = $1 AND d.requested BETWEEN $2 AND $3
    ORDER BY d."deliveryId" ASC, d."method"
  `

  const client = await db.sequelize.connectionManager.getConnection()
  const stream = new QueryStream(query, [schemeName, start, end])
  const queryStream = client.query(stream)

  return queryStream
}

module.exports = getDeliveriesForReport
