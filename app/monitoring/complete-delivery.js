const db = require('../data')

const completeDelivery = async (deliveryId, transaction) => {
  try {
    const [updatedRows] = await db.delivery.update(
      { completed: new Date() },
      {
        where: { deliveryId },
        transaction,
        returning: true
      }
    )

    return updatedRows > 0
  } catch (error) {
    console.error(`Error completing delivery ${deliveryId}:`, error)
    throw error
  }
}

module.exports = completeDelivery
