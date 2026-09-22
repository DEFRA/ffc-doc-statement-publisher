const { statement } = require('../database')

const getStatementByStatementId = async (statementId, transaction) => {
  return (await statement(transaction ?? undefined).where({ statementId }).first()) ?? null
}

module.exports = getStatementByStatementId
