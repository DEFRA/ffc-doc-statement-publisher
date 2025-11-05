const { QUARTERLY } = require('../../../app/constants/frequencies')
const { DP } = require('../../../app/constants/scheme-names').SHORT_NAMES
const { DELINKED } = require('../../../app/constants/scheme-names').LONG_NAMES

const BUSINESS_NAME = require('../components/business-name')
const SCHEME_YEAR = require('../components/marketing-year')

module.exports = {
  businessName: BUSINESS_NAME,
  schemeFrequency: QUARTERLY,
  schemeName: DELINKED,
  schemeShortName: DP,
  schemeYear: SCHEME_YEAR
}
