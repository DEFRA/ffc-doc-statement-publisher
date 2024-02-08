const Joi = require('joi')

const documentReference = require('../schemas/components/document-reference')

module.exports = Joi.object({
  filename: Joi.string().required(),
  businessName: Joi.string().required(),
  frn: Joi.number().integer().min(1000000000).max(9999999999).required(),
  sbi: Joi.number().integer().min(105000000).max(999999999).required(),
  email: Joi.string().optional().allow('', null),
  documentReference,
  address: Joi.object({
    line1: Joi.string().optional().allow('', null),
    line2: Joi.string().optional().allow('', null),
    line3: Joi.string().optional().allow('', null),
    line4: Joi.string().optional().allow('', null),
    line5: Joi.string().optional().allow('', null),
    postcode: Joi.string().optional().allow('', null)
  }).required(),
  scheme: Joi.object({
    name: Joi.string().required(),
    shortName: Joi.string().required(),
    year: Joi.string().required(),
    frequency: Joi.string().required()
  }).required()
}).required()
