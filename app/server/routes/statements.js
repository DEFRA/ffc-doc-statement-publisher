const db = require('../../data')
const { HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

const parseTimestamp16 = (timestamp) => {
  const match = timestamp.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute, second, centiseconds] = match
  const milliseconds = centiseconds + '0'
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}Z`)
}

const buildTimestampCriteria = (timestamp, db) => {
  if (timestamp?.length !== 16) return undefined
  const parsedDate = parseTimestamp16(timestamp)
  if (!parsedDate) return undefined

  if (!db.sequelize?.Op) {
    return parsedDate
  }

  return {
    [db.sequelize.Op.gte]: parsedDate,
    [db.sequelize.Op.lt]: new Date(parsedDate.getTime() + 10)
  }
}

const buildQueryCriteria = (query, db) => {
  const criteria = {}

  if (query.frn) {
    criteria.frn = Number.parseInt(query.frn)
  }
  if (query.schemeshortname) {
    criteria.schemeShortName = query.schemeshortname
  }
  if (query.schemeyear) {
    criteria.schemeYear = Number.parseInt(query.schemeyear)
  }

  const timestampCriteria = buildTimestampCriteria(query.timestamp, db)
  if (timestampCriteria) {
    criteria.received = timestampCriteria
  }

  return criteria
}

const getOffset = (continuationToken, offset) => {
  if (continuationToken && /^\d+$/.test(String(continuationToken))) {
    return Number.parseInt(continuationToken)
  }
  if (offset && /^\d+$/.test(String(offset))) {
    return Number.parseInt(offset)
  }
  return 0
}

const formatStatementTimestamp = (date) => {
  const year = date.getUTCFullYear().toString()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = date.getUTCDate().toString().padStart(2, '0')
  const hour = date.getUTCHours().toString().padStart(2, '0')
  const minute = date.getUTCMinutes().toString().padStart(2, '0')
  const second = date.getUTCSeconds().toString().padStart(2, '0')
  const centiseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0')
  return year + month + day + hour + minute + second + centiseconds
}

const formatStatement = (s) => ({
  filename: s.filename ? String(s.filename) : null,
  schemeId: s.schemeId ? Number.parseInt(s.schemeId) : null,
  marketingYear: s.marketingYear ? Number.parseInt(s.marketingYear) : null,
  frn: s.frn ? Number.parseInt(s.frn) : null,
  timestamp: formatStatementTimestamp(new Date(s.received))
})

module.exports = [{
  method: 'GET',
  path: '/statements',
  handler: async (request, h) => {
    try {
      const criteria = buildQueryCriteria(request.query, db)
      const limitNum = request.query.limit ? Number.parseInt(request.query.limit) : 50
      const offsetNum = getOffset(request.query.continuationToken, request.query.offset)

      const statements = await db.statement.findAll({
        where: Object.keys(criteria).length > 0 ? criteria : undefined,
        limit: limitNum,
        offset: offsetNum
      })

      const hasMore = statements.length === limitNum
      const nextContinuationToken = hasMore ? (offsetNum + limitNum).toString() : null

      return {
        statements: statements.map(formatStatement),
        continuationToken: nextContinuationToken
      }
    } catch (error) {
      console.error('[STATEMENTS] Error caught:', error)
      return h.response({
        error: 'Internal server error',
        message: 'An error occurred while fetching statements'
      }).code(HTTP_INTERNAL_SERVER_ERROR)
    }
  }
}]
