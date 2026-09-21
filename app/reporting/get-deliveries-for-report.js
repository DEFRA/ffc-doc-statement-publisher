const db = require('../data')
const { delivery: DELIVERIES, statement: STATEMENTS, failure: FAILURES } = require('../constants/tables')

const getDeliveriesForReport = async (schemeName, start, end) => {
  console.log('get deliveries', {
    schemeName,
    start,
    end
  })

  // f.* is not selected wholesale: failures also has its own deliveryId column, and a
  // plain-object row built from duplicate column names keeps only the last one, silently
  // clobbering d."deliveryId" with the (frequently null, unmatched-left-join) failures one.
  const query = `
    SELECT d.*, s.*, f."failureId", f."statusCode", f.reason, f.error, f.message, f.failed
    FROM ${DELIVERIES} d
    INNER JOIN ${STATEMENTS} s ON d."statementId" = s."statementId"
    LEFT JOIN ${FAILURES} f ON d."deliveryId" = f."deliveryId"
    WHERE s."schemeName" = ? AND d.requested BETWEEN ? AND ?
    ORDER BY d."deliveryId" ASC, d."method"
  `

  return db.client.raw(query, [schemeName, start, end]).stream()
}

module.exports = getDeliveriesForReport
