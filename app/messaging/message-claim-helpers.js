const db = require('../data')

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
      return false
    }
    throw error
  }
}

const markClaimStatus = async (messageId, status) => {
  await db.messageClaim.update(
    { status },
    { where: { messageId } }
  )
}

module.exports = {
  claimMessage,
  markClaimStatus
}
