const db = require('../../data')
const { HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

const NUMERIC_REGEX = /^\d+$/
const DEFAULT_LIMIT = 50
const PADDING_LENGTH = 2
const PADDING_CHAR = '0'
const CENTISECONDS_DIVISOR = 10

const buildQueryCriteria = (query, sequelizeDb) => {
  console.info('[STATEMENTS] buildQueryCriteria called with:', query)
  const criteria = {}

  if (query.frn) {
    const frnValue = Number.parseInt(query.frn)
    console.info('[STATEMENTS] Parsed FRN:', { input: query.frn, output: frnValue })
    criteria.frn = frnValue
  }

  if (query.schemeshortname) {
    console.info('[STATEMENTS] Set schemeShortName:', query.schemeshortname)
    criteria.schemeShortName = query.schemeshortname
  }

  if (query.schemeyear) {
    console.info('[STATEMENTS] Set schemeYear (keeping as string):', query.schemeyear)
    criteria.schemeYear = query.schemeyear
  }

  if (query.timestamp) {
    const op = sequelizeDb.sequelize?.Op || sequelizeDb.Sequelize?.Op
    if (op?.like) {
      console.info('[STATEMENTS] Adding timestamp criteria to query on filename')
      criteria.filename = { [op.like]: `%${query.timestamp}%` }
    } else {
      console.info('[STATEMENTS] Sequelize Op not available, skipping timestamp filter')
    }
  }

  console.info('[STATEMENTS] Final criteria:', criteria)
  return criteria
}

const getOffset = (continuationToken, offset) => {
  console.info('[STATEMENTS] getOffset called with:', { continuationToken, offset })

  if (continuationToken && NUMERIC_REGEX.test(String(continuationToken))) {
    const parsedToken = Number.parseInt(continuationToken)
    console.info('[STATEMENTS] Using continuationToken as offset:', parsedToken)
    return parsedToken
  }

  if (offset && NUMERIC_REGEX.test(String(offset))) {
    const parsedOffset = Number.parseInt(offset)
    console.info('[STATEMENTS] Using offset parameter:', parsedOffset)
    return parsedOffset
  }

  console.info('[STATEMENTS] No valid offset or continuationToken, using default: 0')
  return 0
}

const formatStatementTimestamp = (date) => {
  const year = date.getUTCFullYear().toString()
  const month = (date.getUTCMonth() + 1).toString().padStart(PADDING_LENGTH, PADDING_CHAR)
  const day = date.getUTCDate().toString().padStart(PADDING_LENGTH, PADDING_CHAR)
  const hour = date.getUTCHours().toString().padStart(PADDING_LENGTH, PADDING_CHAR)
  const minute = date.getUTCMinutes().toString().padStart(PADDING_LENGTH, PADDING_CHAR)
  const second = date.getUTCSeconds().toString().padStart(PADDING_LENGTH, PADDING_CHAR)
  const centiseconds = Math.floor(date.getUTCMilliseconds() / CENTISECONDS_DIVISOR).toString().padStart(PADDING_LENGTH, PADDING_CHAR)
  const timestamp16 = year + month + day + hour + minute + second + centiseconds
  return timestamp16
}

const formatStatement = (s) => {
  const formatted = {
    filename: s.filename ? String(s.filename) : null,
    schemeId: s.schemeId ? Number.parseInt(s.schemeId) : null,
    marketingYear: s.marketingYear ? Number.parseInt(s.marketingYear) : null,
    frn: s.frn ? Number.parseInt(s.frn) : null,
    timestamp: formatStatementTimestamp(new Date(s.received))
  }
  return formatted
}

module.exports = [{
  method: 'GET',
  path: '/statements',
  handler: async (request, h) => {
    console.info('[STATEMENTS] Handler called with query:', request.query)

    try {
      const criteria = buildQueryCriteria(request.query, db)
      const limitNum = request.query.limit ? Number.parseInt(request.query.limit) : DEFAULT_LIMIT
      const offsetNum = getOffset(request.query.continuationToken, request.query.offset)

      console.info('[STATEMENTS] Executing query with:', { criteria, limit: limitNum, offset: offsetNum })

      const statements = await db.statement.findAll({
        where: Object.keys(criteria).length > 0 ? criteria : undefined,
        limit: limitNum,
        offset: offsetNum
      })

      console.info('[STATEMENTS] Query returned', statements.length, 'results')

      const hasMore = statements.length === limitNum
      const nextContinuationToken = hasMore ? (offsetNum + limitNum).toString() : null

      console.info('[STATEMENTS] Returning response with:', {
        statementCount: statements.length,
        hasMore,
        nextContinuationToken
      })

      return {
        statements: statements.map(formatStatement),
        continuationToken: nextContinuationToken
      }
    } catch (error) {
      console.error('[STATEMENTS] Error in handler:', {
        message: error.message,
        stack: error.stack,
        query: request.query
      })

      return h.response({
        error: 'Internal server error',
        message: 'An error occurred while fetching statements'
      }).code(HTTP_INTERNAL_SERVER_ERROR)
    }
  }
}]

module.exports.buildQueryCriteria = buildQueryCriteria
module.exports.getOffset = getOffset
module.exports.formatStatementTimestamp = formatStatementTimestamp
module.exports.formatStatement = formatStatement
