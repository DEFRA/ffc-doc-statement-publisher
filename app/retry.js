const retry = async (fn, retriesLeft = 10, interval = 5000, exponential = false, isFirstAttempt = true) => {
  try {
    return await fn()
  } catch (err) {
    if (retriesLeft > 0) {
      if (isFirstAttempt) {
        console.warn(`Operation failed, retrying up to ${retriesLeft} more times...`)
      }
      await new Promise(resolve => setTimeout(resolve, interval))
      return await retry(fn, retriesLeft - 1, exponential ? interval * 2 : interval, exponential, false)
    } else {
      console.error('Operation failed after all retry attempts')
      throw err
    }
  }
}

module.exports = {
  retry
}
