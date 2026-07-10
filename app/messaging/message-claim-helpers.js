const db = require('../data')
const { sendAlert } = require('../alert')

const RECLAIM_AFTER_MS = 5 * 60 * 1000

const claimMessage = async (messageId, documentReference) => {
  try {
    await db.messageClaim.create({
      messageId,
      documentReference,
      status: 'processing'
    })
    return true
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const existing = await db.messageClaim.findOne({ where: { messageId } })
      if (existing && (Date.now() - new Date(existing.updatedAt).getTime() > RECLAIM_AFTER_MS)) {
        const message = `Stale message claim reclaimed after ${RECLAIM_AFTER_MS / 60000} minutes, retrying: ${messageId}`
        console.warn(message)
        await sendAlert('message claim', new Error(message), message)
        await db.messageClaim.update(
          { status: 'processing', updatedAt: new Date() },
          { where: { messageId } }
        )
        return true
      }
      return false
    }
    throw error
  }
}

const markClaimStatus = async (messageId, status) => {
  await db.messageClaim.update(
    { status, updatedAt: new Date() },
    { where: { messageId } }
  )
}

module.exports = {
  claimMessage,
  markClaimStatus
}
