const config = require('../config')
const updateDeliveries = require('./update-deliveries')

const start = async () => {
  try {
    await updateDeliveries()
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(start, config.deliveryCheckInterval)
  }
}

module.exports = {
  start
}
