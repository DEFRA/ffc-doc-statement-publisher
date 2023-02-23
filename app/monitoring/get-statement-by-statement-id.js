const db = require('../data')

const getStatementByStatementId = async (statementId) => {
  return db.statement.findOne({ where: { statementId } })
}

module.exports = getStatementByStatementId
