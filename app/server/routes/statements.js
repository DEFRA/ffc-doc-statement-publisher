const db = require('../../data')
const { HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

module.exports = [{
  method: 'GET',
  path: '/statements',
  handler: async (request, h) => {
    console.info('[STATEMENTS] Handler invoked')
    try {
      const { frn, schemeshortname, schemeyear, timestamp, limit, offset, continuationToken } = request.query

      console.info('[STATEMENTS] Query params:', { frn, schemeshortname, schemeyear, timestamp, limit, offset, continuationToken })

      const criteria = {}
      if (frn) {
        criteria.frn = Number.parseInt(frn)
      }
      if (schemeshortname) {
        criteria.schemeShortName = schemeshortname
      }
      if (schemeyear) {
        criteria.schemeYear = Number.parseInt(schemeyear)
      }
      if (timestamp?.length === 16) {
        console.info('[STATEMENTS] Processing timestamp:', timestamp)
        const year = timestamp.substring(0, 4)
        const month = timestamp.substring(4, 6)
        const day = timestamp.substring(6, 8)
        const hour = timestamp.substring(8, 10)
        const minute = timestamp.substring(10, 12)
        const second = timestamp.substring(12, 14)
        const centiseconds = timestamp.substring(14, 16)
        const milliseconds = centiseconds + '0'
        const parsedDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}Z`)

        console.info('[STATEMENTS] Checking db.sequelize.Op availability:', !!db.sequelize?.Op)

        if (!db.sequelize?.Op) {
          console.error('[STATEMENTS] db.sequelize.Op not available, using exact match')
          criteria.received = parsedDate
        } else {
          criteria.received = {
            [db.sequelize.Op.gte]: parsedDate,
            [db.sequelize.Op.lt]: new Date(parsedDate.getTime() + 10)
          }
        }
      }

      const limitNum = limit ? Number.parseInt(limit) : 50

      let offsetNum = 0
      if (continuationToken && /^\d+$/.test(String(continuationToken))) {
        offsetNum = Number.parseInt(continuationToken)
      } else if (offset && /^\d+$/.test(String(offset))) {
        offsetNum = Number.parseInt(offset)
      }

      console.info('[STATEMENTS] Query criteria:', JSON.stringify(criteria), 'limit:', limitNum, 'offset:', offsetNum)
      console.info('[STATEMENTS] About to query database...')

      const statements = await db.statement.findAll({
        where: Object.keys(criteria).length > 0 ? criteria : undefined,
        limit: limitNum,
        offset: offsetNum
      })

      console.info('[STATEMENTS] Query completed, found', statements.length, 'results')

      const hasMore = statements.length === limitNum
      const nextContinuationToken = hasMore ? (offsetNum + limitNum).toString() : null

      return {
        statements: statements.map(s => {
          const date = new Date(s.received)
          const year = date.getUTCFullYear().toString()
          const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
          const day = date.getUTCDate().toString().padStart(2, '0')
          const hour = date.getUTCHours().toString().padStart(2, '0')
          const minute = date.getUTCMinutes().toString().padStart(2, '0')
          const second = date.getUTCSeconds().toString().padStart(2, '0')
          const centiseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0')
          const timestamp16 = year + month + day + hour + minute + second + centiseconds

          return {
            filename: s.filename ? String(s.filename) : null,
            schemeId: s.schemeId ? Number.parseInt(s.schemeId) : null,
            marketingYear: s.marketingYear ? Number.parseInt(s.marketingYear) : null,
            frn: s.frn ? Number.parseInt(s.frn) : null,
            timestamp: timestamp16
          }
        }),
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
