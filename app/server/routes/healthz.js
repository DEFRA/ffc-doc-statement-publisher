const { OK } = require('../../constants/ok')
const ok = 200

module.exports = {
  method: 'GET',
  path: '/healthz',
  handler: (_request, h) => {
    return h.response(OK).code(ok)
  }
}
