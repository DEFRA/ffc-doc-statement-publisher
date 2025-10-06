const MARKETING_YEAR = require('../components/marketing-year')
const FRN = require('./frn')
const TIMESTAMP = require('./timestamp')

const { SHORT_NAMES } = require('../../../app/constants/scheme-names')

module.exports = {
  STATEMENT: `FFC_PaymentStatement_${SHORT_NAMES.DP}_${MARKETING_YEAR}_${FRN}_${TIMESTAMP}.pdf`.replace(/\s/g, '')
}
