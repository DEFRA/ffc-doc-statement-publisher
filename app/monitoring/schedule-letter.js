const { LETTER } = require('../constants/methods')
const { statement, delivery } = require('../data')
const publish = require('../publishing/publish')
const isDpScheme = require('../publishing/is-dp-scheme')

const scheduleLetter = async (deliveryToSchedule, transaction) => {
  if (!transaction) {
    throw new Error('Transaction is required to schedule letter')
  }

  const timestamp = new Date()
  const statementRecord = (await statement(transaction)
    .where({ statementId: deliveryToSchedule.statementId })
    .first()) ?? null

  if (!statementRecord) {
    throw new Error(`Statement not found for statementId: ${deliveryToSchedule.statementId}`)
  }

  if (!isDpScheme(statementRecord?.schemeShortName)) {
    console.log(`Letter not scheduled - not DP scheme: ${statementRecord.schemeShortName}`)
    return false
  }

  try {
    const response = await publish(
      statementRecord.emailTemplate,
      statementRecord.email,
      statementRecord?.filename,
      null,
      LETTER
    )

    await delivery(transaction).insert({
      statementId: deliveryToSchedule.statementId,
      method: LETTER,
      reference: response.data.id,
      requested: timestamp
    })

    console.log(`Letter scheduled successfully for statement ${statementRecord.filename}`)
    return true
  } catch (error) {
    console.error('Failed to schedule letter:', error)
    throw error
  }
}

module.exports = scheduleLetter
