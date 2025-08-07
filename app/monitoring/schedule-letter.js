const { LETTER } = require('../constants/methods')
const db = require('../data')
const publish = require('../publishing/publish')
const isDpScheme = require('../publishing/is-dp-scheme')

const scheduleLetter = async (delivery, transaction) => {
  if (!transaction) {
    throw new Error('Transaction is required to schedule letter')
  }

  const timestamp = new Date()
  const statement = await db.statement.findOne({
    where: { statementId: delivery.statementId },
    transaction
  })

  if (!statement) {
    throw new Error(`Statement not found for statementId: ${delivery.statementId}`)
  }

  if (!isDpScheme(statement?.schemeShortName)) {
    console.log(`Letter not scheduled - not DP scheme: ${statement.schemeShortName}`)
    return false
  }

  try {
    const response = await publish(
      statement.emailTemplate,
      statement.email,
      statement?.filename,
      null,
      LETTER
    )

    await db.delivery.create({
      statementId: delivery.statementId,
      method: LETTER,
      reference: response.data.id,
      requested: timestamp
    }, { transaction })

    console.log(`Letter scheduled successfully for statement ${statement.filename}`)
    return true
  } catch (error) {
    console.error('Failed to schedule letter:', error)
    throw error
  }
}

module.exports = scheduleLetter
