const { QueryTypes } = require('sequelize')
const db = require('../data')

const getDeliveriesForReport = async (schemeName, start, end, transaction) => {
  console.log('get deliveries', {
    schemeName,
    start,
    end
  })

  const query = `
    SELECT d.*, s.*
    FROM deliveries d
    INNER JOIN statements s ON d.statementId = s.id
    WHERE s.schemeName = :schemeName AND d.requested BETWEEN :start AND :end
  `

  return db.sequelize.query(query, {
    replacements: { schemeName, start, end },
    type: QueryTypes.SELECT,
    transaction,
    stream: true
  })
}

module.exports = getDeliveriesForReport