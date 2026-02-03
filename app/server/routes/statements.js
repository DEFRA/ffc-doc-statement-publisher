const statement = require('../../data/models/statement')
const { HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

const statementsPayload = async (_request, _h) => {
  return {
    filename: statement.filename ? String(statement.filename) : null,
    schemeId: statement.schemeId ? Number.parseInt(statement.schemeId) : null,
    marketingYear: statement.marketingYear ? Number.parseInt(statement.marketingYear) : null,
    frn: statement.frn ? Number.parseInt(statement.frn) : null,
    timestamp: statement.timestamp
  }
}

module.exports = [{
  method: 'GET',
  path: '/statements',
  handler: async (request, h) => {
    try {
      return await statementsPayload(request, h)
    } catch (error) {
      console.error('Error fetching statement:', error)
      return h.response({
        error: 'Internal server error',
        message: 'An error occurred while fetching statement'
      }).code(HTTP_INTERNAL_SERVER_ERROR)
    }
  }
}]
