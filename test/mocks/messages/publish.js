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
const { STATEMENT: STATEMENT_FILENAME } = require('../components/filename')
const { SHORT_NAMES, LONG_NAMES } = require('../../../app/constants/scheme-names')
const MARKETING_YEAR = require('../components/marketing-year')
const { QUARTERLY: QUARTERLY_FREQUENCY } = require('../../../app/constants/frequencies')
const DOCUMENT_REFERENCE = require('../components/document-reference')
const MESSAGE_SOURCE = require('../../../app/constants/message-source')
const TEMPLATE = require('../components/template')

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
    emailTemplate: TEMPLATE,
    filename: STATEMENT_FILENAME,
    paymentBand1: '10',
    paymentBand2: '20',
    paymentBand3: '30',
    paymentBand4: '100',
    percentageReduction1: '10.00',
    percentageReduction2: '20.00',
    percentageReduction3: '50.00',
    percentageReduction4: '100.00',
    progressiveReductions1: '1.00',
    progressiveReductions2: '4.00',
    progressiveReductions3: '15.00',
    progressiveReductions4: '100.00',
    referenceAmount: '200.00',
    totalProgressiveReduction: '120.00',
    totalDelinkedPayment: '80.00',
    paymentAmountCalculated: '80.00',
    paymentPeriod: 'Q3-2025',
    transactionDate: '2025-10-06 00:00:00.000',
    scheme: {
      agreementNumber: 123456789,
      name: LONG_NAMES.DELINKED,
      shortName: SHORT_NAMES.DP,
      year: String(MARKETING_YEAR),
      frequency: 'annual'
    },
    documentReference: DOCUMENT_REFERENCE
  },
  applicationProperties: {
    type: 'uk.gov.doc.delinked-statement.publish'
  },
  type: 'uk.gov.doc.delinked-statement.publish'
}

const LETTER_STATEMENT_MESSAGE = {
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
    statementFileUrl: STATEMENT_FILENAME,
    scheme: {
      agreementNumber: 123456789,
      name: LONG_NAMES.DELINKED,
      shortName: SHORT_NAMES.DP,
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

module.exports = {
  STATEMENT_MESSAGE,
  LETTER_STATEMENT_MESSAGE
}
