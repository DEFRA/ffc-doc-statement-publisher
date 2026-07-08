const db = require('../../data')
const { HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

const SUCCESS_CODE = 201

const NUMERIC_REGEX = /^\d+$/
const DEFAULT_LIMIT = 100
const PADDING_LENGTH = 2
const PADDING_CHAR = '0'
const CENTISECONDS = 10
const TIMESTAMP_WINDOW_MINUTES = 5
const MS_PER_MINUTE = 60000

const ZERO = 0
const ONE = 1
const YEAR_START_END = 4
const MONTH_START_END = 6
const DAY_START_END = 8
const MINUTE_START_END = 10
const SECOND_START_END = 12
const SECOND_END = 14

const END_OF_SECOND_MS = 999
const END_OF_DAY_HOUR = 23
const END_OF_DAY_MINUTE = 59
const END_OF_DAY_SECOND = 59

const TIMESTAMP_EXACT_MINUTE_OFFSET_MS = MS_PER_MINUTE - ONE
const TIMESTAMP_WINDOW_OFFSET_MS = TIMESTAMP_WINDOW_MINUTES * MS_PER_MINUTE
const DECIMAL = 10

const TIMESTAMP_16_REGEX = /^\d{16}$/
const DATE_TIME_REGEX = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/
const DATE_ONLY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/

const parseTimestampToRange = (timestamp) => {
  if (TIMESTAMP_16_REGEX.test(timestamp)) {
    const year = Number.parseInt(timestamp.slice(ZERO, YEAR_START_END), DECIMAL)
    const month = Number.parseInt(timestamp.slice(YEAR_START_END, MONTH_START_END), DECIMAL) - ONE
    const day = Number.parseInt(timestamp.slice(MONTH_START_END, DAY_START_END), DECIMAL)
    const hour = Number.parseInt(timestamp.slice(DAY_START_END, MINUTE_START_END), DECIMAL)
    const minute = Number.parseInt(timestamp.slice(MINUTE_START_END, SECOND_START_END), DECIMAL)
    const second = Number.parseInt(timestamp.slice(SECOND_START_END, SECOND_END), DECIMAL)
    const from = new Date(Date.UTC(year, month, day, hour, minute, second, ZERO))
    const to = new Date(Date.UTC(year, month, day, hour, minute, second, END_OF_SECOND_MS))
    return { from, to }
  }

  const dateTimeMatch = DATE_TIME_REGEX.exec(timestamp)
  if (dateTimeMatch) {
    const [, dd, mm, yyyy, hh, min] = dateTimeMatch
    const centerTime = new Date(Date.UTC(
      Number.parseInt(yyyy, DECIMAL),
      Number.parseInt(mm, DECIMAL) - ONE,
      Number.parseInt(dd, DECIMAL),
      Number.parseInt(hh, DECIMAL),
      Number.parseInt(min, DECIMAL),
      ZERO,
      ZERO
    ))
    const from = new Date(centerTime.getTime() - TIMESTAMP_WINDOW_OFFSET_MS)
    const to = new Date(centerTime.getTime() + TIMESTAMP_WINDOW_OFFSET_MS + END_OF_SECOND_MS)
    return { from, to }
  }

  const dateOnlyMatch = DATE_ONLY_REGEX.exec(timestamp)
  if (dateOnlyMatch) {
    const [, dd, mm, yyyy] = dateOnlyMatch
    const from = new Date(Date.UTC(
      Number.parseInt(yyyy, DECIMAL),
      Number.parseInt(mm, DECIMAL) - ONE,
      Number.parseInt(dd, DECIMAL),
      ZERO,
      ZERO,
      ZERO,
      ZERO
    ))
    const to = new Date(Date.UTC(
      Number.parseInt(yyyy, DECIMAL),
      Number.parseInt(mm, DECIMAL) - ONE,
      Number.parseInt(dd, DECIMAL),
      END_OF_DAY_HOUR,
      END_OF_DAY_MINUTE,
      END_OF_DAY_SECOND,
      END_OF_SECOND_MS
    ))
    return { from, to }
  }

  return null
}

const parseDateTimeToExactRange = (timestamp) => {
  const dateTimeMatch = DATE_TIME_REGEX.exec(timestamp)
  if (dateTimeMatch) {
    const [, dd, mm, yyyy, hh, min] = dateTimeMatch
    const from = new Date(Date.UTC(
      Number.parseInt(yyyy, DECIMAL),
      Number.parseInt(mm, DECIMAL) - ONE,
      Number.parseInt(dd, DECIMAL),
      Number.parseInt(hh, DECIMAL),
      Number.parseInt(min, DECIMAL),
      ZERO,
      ZERO
    ))
    const to = new Date(from.getTime() + TIMESTAMP_EXACT_MINUTE_OFFSET_MS)
    return { from, to }
  }

  return null
}

const getSequelizeOperator = (sequelizeDb) => {
  return sequelizeDb.sequelize?.Op || sequelizeDb.Sequelize?.Op
}

const addTimestampCriteria = (query, criteria, sequelizeDb) => {
  if (query.timestamp) {
    const op = getSequelizeOperator(sequelizeDb)
    const range = parseTimestampToRange(query.timestamp)

    if (range && op?.between) {
      console.info('[STATEMENTS] Adding timestamp range criteria to query on received:', range)
      criteria.received = { [op.between]: [range.from, range.to] }
    }

    if (range === null) {
      console.info('[STATEMENTS] Timestamp format not recognised, skipping filter:', query.timestamp)
    }

    if (range && op?.between === undefined) {
      console.info('[STATEMENTS] Sequelize Op not available, skipping timestamp filter')
    }
  }
}

const buildQueryCriteria = (query, sequelizeDb) => {
  console.info('[STATEMENTS] buildQueryCriteria called with:', query)
  const criteria = {}

  if (query.frn) {
    const frnValue = Number.parseInt(query.frn, DECIMAL)
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

  if (query.filename) {
    console.info('[STATEMENTS] Set filename:', query.filename)
    criteria.filename = query.filename
  }

  addTimestampCriteria(query, criteria, sequelizeDb)

  console.info('[STATEMENTS] Final criteria:', criteria)
  return criteria
}

const getOffset = (continuationToken, offset) => {
  console.info('[STATEMENTS] getOffset called with:', { continuationToken, offset })

  if (continuationToken && NUMERIC_REGEX.test(String(continuationToken))) {
    const parsedToken = Number.parseInt(continuationToken, DECIMAL)
    console.info('[STATEMENTS] Using continuationToken as offset:', parsedToken)
    return parsedToken
  }

  if (offset && NUMERIC_REGEX.test(String(offset))) {
    const parsedOffset = Number.parseInt(offset, DECIMAL)
    console.info('[STATEMENTS] Using offset parameter:', parsedOffset)
    return parsedOffset
  }

  console.info('[STATEMENTS] No valid offset or continuationToken, using default: 0')
  return ZERO
}

const formatStatementTimestamp = (date) => {
  const year = date.getUTCFullYear().toString()
  const month = (date.getUTCMonth() + ONE).toString().padStart(PADDING_LENGTH, PADDING_CHAR)
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
    schemeId: s.schemeId ? Number.parseInt(s.schemeId, DECIMAL) : null,
    marketingYear: s.marketingYear ? Number.parseInt(s.marketingYear, DECIMAL) : null,
    frn: s.frn ? Number.parseInt(s.frn, DECIMAL) : null,
    timestamp: formatStatementTimestamp(new Date(s.received))
  }
  return formatted
}

const executeQuery = async (criteria, limitNum, offsetNum) => {
  const where = Object.keys(criteria).length > ZERO ? criteria : undefined
  return db.statement.findAndCountAll({
    where,
    limit: limitNum,
    offset: offsetNum
  })
}

const executeQueryForDateTimeTimestamp = async (request, criteria, limitNum, offsetNum) => {
  const timestamp = request.query.timestamp
  const shouldUseExactMinute = Boolean(timestamp && DATE_TIME_REGEX.test(timestamp))
  if (shouldUseExactMinute === false) {
    return null
  }

  const op = getSequelizeOperator(db)
  const exactRange = parseDateTimeToExactRange(timestamp)
  if (Boolean(op?.between && exactRange) === false) {
    return null
  }

  const exactCriteria = { ...criteria, received: { [op.between]: [exactRange.from, exactRange.to] } }
  console.info('[STATEMENTS] Executing exact timestamp query with:', { criteria: exactCriteria, limit: limitNum, offset: offsetNum })
  const exactResult = await executeQuery(exactCriteria, limitNum, offsetNum)

  if (exactResult.count > ZERO) {
    console.info('[STATEMENTS] Exact timestamp query returned', exactResult.rows.length, 'results')
    return exactResult
  }

  console.info('[STATEMENTS] No exact timestamp matches found, falling back to widened window')
  return null
}

const queryStatements = async (request, criteria, limitNum, offsetNum) => {
  const exactResult = await executeQueryForDateTimeTimestamp(request, criteria, limitNum, offsetNum)
  if (exactResult) {
    return exactResult
  }

  console.info('[STATEMENTS] Executing query with:', { criteria, limit: limitNum, offset: offsetNum })
  return executeQuery(criteria, limitNum, offsetNum)
}

module.exports = {
  routes: [{
    method: 'POST',
    path: '/requests',
    handler: async (request, h) => {
      try {
        const { username, filename, type, timestamp } = request.payload

        console.log('[REQUESTS] Handler called with payload:', request.payload)

        const entry = await db.requests.create({
          username,
          filename,
          type,
          timestamp
        })

        return h.response({ success: true, id: entry.id }).code(SUCCESS_CODE)
      } catch (error) {
        console.error('[REQUESTS] Error creating audit log:', error)
        return h.response({
          error: 'Internal server error',
          message: 'Failed to write requests log'
        }).code(HTTP_INTERNAL_SERVER_ERROR)
      }
    }
  },
  {
    method: 'GET',
    path: '/statements',
    handler: async (request, h) => {
      console.info('[STATEMENTS] Handler called with query:', request.query)

      try {
        const criteria = buildQueryCriteria(request.query, db)
        const limitNum = request.query.limit ? Number.parseInt(request.query.limit, DECIMAL) : DEFAULT_LIMIT
        const offsetNum = getOffset(request.query.continuationToken, request.query.offset)
        const { count, rows } = await queryStatements(request, criteria, limitNum, offsetNum)

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
