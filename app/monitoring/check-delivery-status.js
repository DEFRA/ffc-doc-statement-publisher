const config = require('../config')
const { NotifyClient } = require('notifications-node-client')
const CACHE_TTL = 60000

let notifyClient
let cache

function initialize () {
  notifyClient = new NotifyClient(config.notifyApiKey)
  cache = new Map()
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key)
      }
    }
  }, CACHE_TTL)
}

initialize()
const checkDeliveryStatus = async (reference) => {
  const cacheKey = `status:${reference}`
  const cachedItem = cache.get(cacheKey)

  if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
    return cachedItem.data
  }

  try {
    const result = await notifyClient.getNotificationById(reference)

    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error(`Error checking delivery status for ${reference}:`, error.message)
    throw error
  }
}

const checkDeliveryStatuses = async (references) => {
  return Promise.all(references.map(reference => checkDeliveryStatus(reference)))
}

module.exports = {
  checkDeliveryStatus,
  checkDeliveryStatuses,
  _testing: {
    initialize,
    getCache: () => cache,
    setNotifyClient: (client) => { notifyClient = client }
  }
}
