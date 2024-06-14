const BUSINESS_NAME = require('../components/business-name')
const SBI = require('../components/sbi')
const FRN = require('../components/frn')
const {
  LINE_1,
  LINE_2,
  LINE_3,
  LINE_4,
  LINE_5,
  POSTCODE
} = require('../components/address')
const EMAIL = require('../components/email')
const { STATEMENT: STATEMENT_FILENAME, SCHEDULE: SCHEDULE_FILENAME } = require('../components/filename')
const { SHORT_NAMES, LONG_NAMES } = require('../../../app/constants/scheme-names')
const MARKETING_YEAR = require('../components/marketing-year')
const { QUARTERLY: QUARTERLY_FREQUENCY } = require('../../../app/constants/frequencies')
const DOCUMENT_REFERENCE = require('../components/document-reference')
const MESSAGE_SOURCE = require('../../../app/constants/message-source')

const BASE_MESSAGE = {
  body: {},
  type: null,
  source: MESSAGE_SOURCE
}

const STATEMENT_MESSAGE = {
  ...BASE_MESSAGE,
  body: {
    businessName: BUSINESS_NAME,
    sbi: Number(SBI),
    frn: Number(FRN),
    address: {
      line1: LINE_1,
      line2: LINE_2,
      line3: LINE_3,
      line4: LINE_4,
      line5: LINE_5,
      postcode: POSTCODE
    },
    email: EMAIL,
    filename: STATEMENT_FILENAME,
    scheme: {
      name: LONG_NAMES.SFI,
      shortName: SHORT_NAMES.SFI,
      year: String(MARKETING_YEAR),
      frequency: QUARTERLY_FREQUENCY
    },
    documentReference: DOCUMENT_REFERENCE
  },
  applicationProperties: {
    type: 'uk.gov.doc.statement.publish'
  },
  type: 'uk.gov.doc.statement.publish'
}

const SCHEDULE_MESSAGE = {
  ...BASE_MESSAGE,
  body: {
    businessName: BUSINESS_NAME,
    sbi: Number(SBI),
    frn: Number(FRN),
    address: {
      line1: LINE_1,
      line2: LINE_2,
      line3: LINE_3,
      line4: LINE_4,
      line5: LINE_5,
      postcode: POSTCODE
    },
    email: EMAIL,
    filename: SCHEDULE_FILENAME,
    scheme: {
      name: LONG_NAMES.SFI,
      shortName: SHORT_NAMES.SFI,
      year: String(MARKETING_YEAR),
      frequency: QUARTERLY_FREQUENCY
    },
    documentReference: DOCUMENT_REFERENCE
  },
  applicationProperties: {
    type: 'uk.gov.doc.schedule.publish'
  },
  type: 'uk.gov.doc.schedule.publish'
}

module.exports = {
  STATEMENT_MESSAGE,
  SCHEDULE_MESSAGE
}
