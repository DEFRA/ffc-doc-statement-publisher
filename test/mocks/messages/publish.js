const _2022 = require('../components/marketing-year')
const {
  LINE_1,
  LINE_2,
  LINE_3,
  LINE_4,
  LINE_5,
  POSTCODE
} = require('../components/address')
const EMAIL = require('../components/email')
const FILENAME = require('../components/filename')
const FRN = require('../components/frn')
const BUSINESS_NAME = require('../components/business-name')
const SBI = require('../components/sbi')

const { QUARTERLY: QUARTERLY_FREQUENCY } = require('../../../app/constants/frequencies')
const { SHORT_NAMES, LONG_NAMES } = require('../../../app/constants/scheme-names')

module.exports = {
  filename: FILENAME,
  businessName: BUSINESS_NAME,
  frn: FRN,
  sbi: SBI,
  email: EMAIL,
  address: {
    line1: LINE_1,
    line2: LINE_2,
    line3: LINE_3,
    line4: LINE_4,
    line5: LINE_5,
    postcode: POSTCODE
  },
  scheme: {
    name: LONG_NAMES.SFI,
    shortName: SHORT_NAMES.SFI,
    year: _2022,
    frequency: QUARTERLY_FREQUENCY
  }
}
