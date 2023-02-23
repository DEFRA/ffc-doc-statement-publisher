const _2022 = require('../components/marketing-year')
const FRN = require('./frn')
const TIMESTAMP = require('./timestamp')

const { SHORT_NAMES } = require('../../../app/constants/scheme-names')

module.exports = {
  SFI: `FFC_PaymentStatement_${SHORT_NAMES.SFI}_${_2022}_${FRN}_${TIMESTAMP}.pdf`
}
