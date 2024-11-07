const db = require('../data')

const updateFailureSent = async (failureId, transaction) => {
  await db.failures.update(
    { dateResent: new Date() },
    {
      where: {
        failureId
      },
      transaction
    }
  )
}

module.exports = updateFailureSent
