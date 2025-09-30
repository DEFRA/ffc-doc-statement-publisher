const { string } = require('joi')
const { QUARTERLY } = require('../../../app/constants/frequencies')
const { SFI: SFI_SHORT_NAME } = require('../../../app/constants/scheme-names').SHORT_NAMES
const { SFI: SFI_LONG_NAME } = require('../../../app/constants/scheme-names').LONG_NAMES

const BUSINESS_NAME = require('../components/business-name')
const SCHEME_YEAR = require('../components/marketing-year')

module.exports = {
  businessName: BUSINESS_NAME,
  schemeFrequency: QUARTERLY,
  schemeName: SFI_LONG_NAME,
  schemeShortName: SFI_SHORT_NAME,
  schemeYear: SCHEME_YEAR
}
