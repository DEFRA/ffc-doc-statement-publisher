const { OK } = require('../../constants/ok')
const { HTTP_OK } = require('../../constants/statuses')

module.exports = {
  method: 'GET',
  path: '/healthz',
  handler: (_request, h) => {
    return h.response(OK).code(HTTP_OK)
  }
}
