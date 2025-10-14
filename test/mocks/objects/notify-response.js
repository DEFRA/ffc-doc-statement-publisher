const { EMAIL } = require('../../../app/constants/methods')
const { PERMANENT: PERMANENT_FAILURE_EMAIL_ADDRESS, TEMPORARY: TEMPORARY_FAILURE_EMAIL_ADDRESS } = require('../../../app/constants/notify-simulation-email-addresses')
const { DELIVERED, PERMANENT_FAILURE, TEMPORARY_FAILURE, TECHNICAL_FAILURE } = require('../../../app/constants/statuses')

const EMAIL_ADDRESS = require('../components/email')
const RESPONSE_ID = require('../components/notify-response-id')
const TEMPLATE_ID = require('../components/notify-template-id')

const NOTIFY_RESPONSE = {
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
  data: {
    body: 'Markdown formatted contents of the email template with placeholder values injected into the text.',
    completed_at: '2023-02-15T10:05:50.922402Z',
    created_at: '2023-02-15T10:05:50.759413Z',
    created_by_name: null,
    email_address: null,
    id: RESPONSE_ID,
    line_1: null,
    line_2: null,
    line_3: null,
    line_4: null,
    line_5: null,
    line_6: null,
    phone_number: null,
    postage: null,
    postcode: null,
    reference: null,
    scheduled_for: null,
    sent_at: '2023-02-15T10:05:50.869835Z',
    status: null,
    subject: 'Delinked Payment Statement',
    template: {
      id: TEMPLATE_ID,
      uri: `https://api.notifications.service.gov.uk/v2/template/${TEMPLATE_ID}/version/7`,
      version: 7
    },
    type: EMAIL
  }
}

const NOTIFY_RESPONSE_DELIVERED = {
  ...NOTIFY_RESPONSE,
  data: {
    ...NOTIFY_RESPONSE.data,
    email_address: EMAIL_ADDRESS,
    status: DELIVERED
  }
}

const NOTIFY_RESPONSE_PERMANENT_FAILURE = {
  ...NOTIFY_RESPONSE,
  data: {
    ...NOTIFY_RESPONSE.data,
    email_address: PERMANENT_FAILURE_EMAIL_ADDRESS,
    status: PERMANENT_FAILURE
  }
}

const NOTIFY_RESPONSE_TEMPORARY_FAILURE = {
  ...NOTIFY_RESPONSE,
  data: {
    ...NOTIFY_RESPONSE.data,
    email_address: TEMPORARY_FAILURE_EMAIL_ADDRESS,
    status: TEMPORARY_FAILURE
  }
}

const NOTIFY_RESPONSE_TECHNICAL_FAILURE = {
  ...NOTIFY_RESPONSE,
  data: {
    ...NOTIFY_RESPONSE.data,
    email_address: EMAIL_ADDRESS,
    status: TECHNICAL_FAILURE
  }
}

module.exports = {
  NOTIFY_RESPONSE_DELIVERED,
  NOTIFY_RESPONSE_PERMANENT_FAILURE,
  NOTIFY_RESPONSE_TEMPORARY_FAILURE,
  NOTIFY_RESPONSE_TECHNICAL_FAILURE
}
