const standardErrorObject = (err, reason) => {
  const statusCode = err.status || err.statusCode
  const error = err?.data?.errors ? err.data.errors[0].message : err.error
  const message = err.message

  const errorObject = {
    reason,
    statusCode,
    error,
    message
  }

  return errorObject
}

module.exports = standardErrorObject
