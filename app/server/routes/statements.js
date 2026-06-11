const db = require('../../data')
const { HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

const NUMERIC_REGEX = /^\d+$/
const DEFAULT_LIMIT = 100
const PADDING_LENGTH = 2
const PADDING_CHAR = '0'
const CENTISECONDS = 10
const TIMESTAMP_WINDOW_MINUTES = 5
const MS_PER_MINUTE = 60000

const TIMESTAMP_16_REGEX = /^\d{16}$/
const DATE_TIME_REGEX = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/
const DATE_ONLY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/

const parseTimestampToRange = (timestamp) => {
  if (TIMESTAMP_16_REGEX.test(timestamp)) {
    const year = parseInt(timestamp.slice(0, 4), 10)
    const month = parseInt(timestamp.slice(4, 6), 10) - 1
    const day = parseInt(timestamp.slice(6, 8), 10)
    const hour = parseInt(timestamp.slice(8, 10), 10)
    const minute = parseInt(timestamp.slice(10, 12), 10)
    const second = parseInt(timestamp.slice(12, 14), 10)
    const from = new Date(Date.UTC(year, month, day, hour, minute, second, 0))
    const to = new Date(Date.UTC(year, month, day, hour, minute, second, 999))
    return { from, to }
  }

  const dateTimeMatch = DATE_TIME_REGEX.exec(timestamp)
  if (dateTimeMatch) {
    const [, dd, mm, yyyy, hh, min] = dateTimeMatch
    const centerTime = new Date(Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10), parseInt(hh, 10), parseInt(min, 10), 0, 0))
    const from = new Date(centerTime.getTime() - TIMESTAMP_WINDOW_MINUTES * MS_PER_MINUTE)
    const to = new Date(centerTime.getTime() + TIMESTAMP_WINDOW_MINUTES * MS_PER_MINUTE + 999)
    return { from, to }
  }

  const dateOnlyMatch = DATE_ONLY_REGEX.exec(timestamp)
  if (dateOnlyMatch) {
    const [, dd, mm, yyyy] = dateOnlyMatch
    const from = new Date(Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10), 0, 0, 0, 0))
    const to = new Date(Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10), 23, 59, 59, 999))
    return { from, to }
  }

  return null
}

const parseDateTimeToExactRange = (timestamp) => {
  const dateTimeMatch = DATE_TIME_REGEX.exec(timestamp)
  if (!dateTimeMatch) {
    return null
  }

  const [, dd, mm, yyyy, hh, min] = dateTimeMatch
  const from = new Date(Date.UTC(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10), parseInt(hh, 10), parseInt(min, 10), 0, 0))
  const to = new Date(from.getTime() + MS_PER_MINUTE - 1)
  return { from, to }
}

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
    const range = parseTimestampToRange(query.timestamp)
    if (range && op?.between) {
      console.info('[STATEMENTS] Adding timestamp range criteria to query on received:', range)
      criteria.received = { [op.between]: [range.from, range.to] }
    } else if (!range) {
      console.info('[STATEMENTS] Timestamp format not recognised, skipping filter:', query.timestamp)
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
  const centiseconds = Math.floor(date.getUTCMilliseconds() / CENTISECONDS).toString().padStart(PADDING_LENGTH, PADDING_CHAR)
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

module.exports = {
  routes: [{
    method: 'GET',
    path: '/statements',
    handler: async (request, h) => {
      console.info('[STATEMENTS] Handler called with query:', request.query)

      try {
        const criteria = buildQueryCriteria(request.query, db)
        const limitNum = request.query.limit ? Number.parseInt(request.query.limit) : DEFAULT_LIMIT
        const offsetNum = getOffset(request.query.continuationToken, request.query.offset)
        const runQuery = async (queryCriteria) => {
          return db.statement.findAndCountAll({
            where: Object.keys(queryCriteria).length > 0 ? queryCriteria : undefined,
            limit: limitNum,
            offset: offsetNum
          })
        }

        let result

        if (request.query.timestamp && DATE_TIME_REGEX.test(request.query.timestamp)) {
          const op = db.sequelize?.Op || db.Sequelize?.Op
          const exactRange = parseDateTimeToExactRange(request.query.timestamp)
          if (exactRange && op?.between) {
            const exactCriteria = { ...criteria, received: { [op.between]: [exactRange.from, exactRange.to] } }
            console.info('[STATEMENTS] Executing exact timestamp query with:', { criteria: exactCriteria, limit: limitNum, offset: offsetNum })
            const exactResult = await runQuery(exactCriteria)

            if (exactResult.count > 0) {
              console.info('[STATEMENTS] Exact timestamp query returned', exactResult.rows.length, 'results')
              result = exactResult
            } else {
              console.info('[STATEMENTS] No exact timestamp matches found, falling back to widened window')
            }
          }
        }

        if (!result) {
          console.info('[STATEMENTS] Executing query with:', { criteria, limit: limitNum, offset: offsetNum })
          result = await runQuery(criteria)
        }

        const { count, rows } = result

        console.info('[STATEMENTS] Query returned', rows.length, 'results')

        const hasMore = offsetNum + rows.length < count
        const nextContinuationToken = hasMore ? (offsetNum + limitNum).toString() : null
        const totalPages = Math.ceil(count / limitNum)

        console.info('[STATEMENTS] Returning response with:', {
          statementCount: rows.length,
          total: count,
          totalPages,
          hasMore,
          nextContinuationToken
        })

        return {
          statements: rows.map(formatStatement),
          continuationToken: nextContinuationToken,
          total: count,
          totalPages
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
  }],
  buildQueryCriteria,
  getOffset,
  formatStatementTimestamp,
  formatStatement,
  parseTimestampToRange
}
