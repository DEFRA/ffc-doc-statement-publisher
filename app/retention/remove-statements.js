const { statement } = require('../database')

const removeStatements = async (statementIds, transaction) => {
  await statement(transaction ?? undefined).whereIn('statementId', statementIds).del()
}

module.exports = {
  removeStatements
}
