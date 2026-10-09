const { delivery } = require('../database')

const completeDelivery = async (deliveryId, transaction) => {
  try {
    const updatedRows = await delivery(transaction ?? undefined)
      .where({ deliveryId })
      .update({ completed: new Date() })

    return updatedRows > 0
  } catch (error) {
    console.error(`Error completing delivery ${deliveryId}:`, error)
    throw error
  }
}

module.exports = completeDelivery
