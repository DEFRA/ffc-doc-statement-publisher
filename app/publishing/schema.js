const Joi = require('joi')

module.exports = Joi.string().email().required()
