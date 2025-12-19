const { OK } = require('../../constants/ok')

module.exports = {
  method: 'GET',
  path: '/healthz',
  handler: (request, h) => {
    return h.response(OK).code(200)
  }
}
