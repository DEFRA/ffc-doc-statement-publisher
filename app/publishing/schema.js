const Joi = require('joi')

module.exports = Joi.string().email().optional().allow('', null).messages({
  'string.empty': 'email cannot be empty',
  'string.email': 'email must be a valid email address'
})
