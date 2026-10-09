const { messageClaim } = require('../database')
const { sendAlert } = require('../alert')

const UNIQUE_VIOLATION = '23505'

const RECLAIM_AFTER_MINUTES = 5
const MS_PER_MINUTE = 60 * 1000
const RECLAIM_AFTER_MS = RECLAIM_AFTER_MINUTES * MS_PER_MINUTE

const claimMessage = async (messageId, documentReference) => {
  try {
    await messageClaim().insert({
      messageId,
      documentReference,
      status: 'processing'
    })
    return true
  } catch (error) {
    if (error?.code === UNIQUE_VIOLATION) {
      const existing = (await messageClaim().where({ messageId }).first()) ?? null
      if (existing?.status === 'processing' && (Date.now() - new Date(existing?.updatedAt).getTime() > RECLAIM_AFTER_MS)) {
        const message = `Stale message claim reclaimed after ${RECLAIM_AFTER_MINUTES} minutes, retrying: ${messageId}`
        console.warn(message)
        await sendAlert('message claim', new Error(message), message)
        await messageClaim()
          .where({ messageId })
          .update({ status: 'processing', updatedAt: new Date() })
        return true
      }
      return false
    }
    throw error
  }
}

const markClaimStatus = async (messageId, status) => {
  await messageClaim()
    .where({ messageId })
    .update({ status, updatedAt: new Date() })
}

const getClaimStatus = async (messageId) => {
  const existing = (await messageClaim().where({ messageId }).first()) ?? null
  return existing?.status ?? null
}

module.exports = {
  claimMessage,
  markClaimStatus,
  getClaimStatus
}
