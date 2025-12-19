const { OK } = require('../../constants/ok')
const HTTP_OK = 200

module.exports = {
  method: 'GET',
  path: '/healthy',
  handler: (_request, h) => {
    return h.response(OK).code(HTTP_OK)
  }
}
