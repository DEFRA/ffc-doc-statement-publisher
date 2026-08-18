const db = require('../../data')
const config = require('../../config')
const { HTTP_OK, HTTP_UNAUTHORIZED, HTTP_INTERNAL_SERVER_ERROR } = require('../../constants/statuses')

module.exports = {
  method: 'POST',
  path: '/notify/callback/returned-letters',
  options: {
    auth: false
  },
  handler: async (request, h) => {
    const authHeader = request.headers.authorization
    const expectedToken = `Bearer ${config.notifyCallbackBearerToken}`

    if (!authHeader || authHeader !== expectedToken) {
      return h.response({ error: 'Unauthorized' }).code(HTTP_UNAUTHORIZED)
    }

    const { notification_id: notificationId, reference, date_sent: dateSent, upload_letter_file_name: uploadLetterFileName } = request.payload

    try {
      await db.returnedLetter.create({
        notificationId,
        reference: reference || null,
        dateSent: dateSent ? new Date(dateSent) : null,
        receivedAt: new Date()
      })

      console.info(`Returned letter logged: notificationId=${notificationId}, reference=${reference ?? 'none'}, file=${uploadLetterFileName ?? 'none'}`)

      return h.response().code(HTTP_OK)
    } catch (err) {
      console.error('Failed to save returned letter callback:', err)
      return h.response({ error: 'Internal server error' }).code(HTTP_INTERNAL_SERVER_ERROR)
    }
  }
}
